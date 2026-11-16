import os from 'node:os';
import path from 'node:path';
import type { AgentId, AgentInfo, LoginState, TaskResult } from '../shared/types';
import { cancelInstall, canInstallCli, cliSpec, installCli, isManagedCli } from './agent-cli';
import { type RunHandle, run } from './process';
import { findExecutable } from './shell-env';
import { modulesDir, readPackageJson, taskResult } from './workspace';

const STATUS_TIMEOUT_MS = 10_000;
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000;
// Skips loopback: Codex prints its own callback server's address ahead of the sign-in page.
const URL_RE = /https?:\/\/(?!localhost\b|127\.0\.0\.1|\[::1\])[^\s"'<>]+/;
// Output arrives in arbitrary chunks, so a URL is only whole once something follows it.
const COMPLETE_URL_RE = new RegExp(`${URL_RE.source}(?=[\\s"'<>])`);
const URL_SETTLE_MS = 200;
const URL_SCAN_LIMIT = 8 * 1024;
const CANCELLED: TaskResult = { ok: false, error: 'Sign-in cancelled.' };

type AgentSpec = ReturnType<typeof cliSpec> & {
  id: AgentId;
  statusArgs: string[];
  parseStatus: (code: number | null, output: string) => Pick<AgentInfo, 'signedIn' | 'account'>;
  loginArgs: string[];
  logoutArgs: string[];
};

const AGENTS: Record<AgentId, AgentSpec> = {
  claude: {
    id: 'claude',
    ...cliSpec('claude'),
    statusArgs: ['auth', 'status', '--json'],
    parseStatus(_code, output) {
      try {
        const json = JSON.parse(output.slice(output.indexOf('{'))) as {
          loggedIn?: boolean;
          email?: string;
          authMethod?: string;
        };
        return { signedIn: json.loggedIn === true, account: json.email ?? json.authMethod ?? null };
      } catch {
        return { signedIn: null, account: null };
      }
    },
    loginArgs: ['auth', 'login'],
    logoutArgs: ['auth', 'logout'],
  },
  codex: {
    id: 'codex',
    ...cliSpec('codex'),
    statusArgs: ['login', 'status'],
    parseStatus(code, output) {
      const line = output.trim().split('\n').pop()?.trim() ?? '';
      return code === 0
        ? { signedIn: true, account: line || null }
        : { signedIn: false, account: null };
    },
    loginArgs: ['login'],
    logoutArgs: ['logout'],
  },
};

// A CLI on the user's PATH wins over the downloaded one, which core's providers find on PATH too.
function resolveCli(agent: AgentSpec, env: NodeJS.ProcessEnv) {
  const found = findExecutable(agent.command, env);
  if (!found) return null;
  return { path: found, source: isManagedCli(found) ? ('downloaded' as const) : ('path' as const) };
}

function runCli(cli: string, args: string[], env: NodeJS.ProcessEnv) {
  return run(cli, args, { cwd: os.homedir(), env, timeoutMs: STATUS_TIMEOUT_MS }).done;
}

async function describe(agent: AgentSpec, env: NodeJS.ProcessEnv): Promise<AgentInfo> {
  const cli = resolveCli(agent, env);
  const sdkVersion = readPackageJson(path.join(modulesDir(), agent.sdkPackage))?.version;
  const base: AgentInfo = {
    id: agent.id,
    name: agent.name,
    sdkVersion: typeof sdkVersion === 'string' ? sdkVersion : null,
    cliPath: cli?.path ?? null,
    cliSource: cli?.source ?? null,
    cliInstallable: !cli && canInstallCli(agent.id),
    cliVersion: null,
    signedIn: null,
    account: null,
  };
  if (!cli) return base;
  const [version, status] = await Promise.all([
    runCli(cli.path, ['--version'], env),
    runCli(cli.path, agent.statusArgs, env),
  ]);
  const cliVersion = /(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/.exec(version.output)?.[1] ?? null;
  return { ...base, cliVersion, ...agent.parseStatus(status.code, status.output) };
}

export function listAgents(env: NodeJS.ProcessEnv): Promise<AgentInfo[]> {
  return Promise.all(Object.values(AGENTS).map((agent) => describe(agent, env)));
}

export type LoginHooks = {
  download: (progress: NonNullable<LoginState['download']>) => void;
  installed: () => void;
  output: (chunk: string) => void;
  url: (url: string) => void;
};

export type LoginSession = {
  done: Promise<TaskResult>;
  write: (text: string) => void;
  cancel: () => void;
};

export function startLogin(
  id: AgentId,
  readEnv: () => Promise<NodeJS.ProcessEnv>,
  hooks: LoginHooks,
): LoginSession {
  const agent = AGENTS[id];
  let cancelled = false;
  let handle: RunHandle | null = null;
  let settle: NodeJS.Timeout | undefined;

  const attempt = async (): Promise<TaskResult> => {
    const env = await readEnv();
    if (cancelled) return CANCELLED;
    if (!resolveCli(agent, env) && canInstallCli(id)) {
      try {
        await installCli(id, hooks.download);
      } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        return { ok: false, error: aborted ? 'Download cancelled.' : (err as Error).message };
      }
      hooks.installed();
    }
    if (cancelled) return CANCELLED;
    const cli = resolveCli(agent, env);
    if (!cli) return { ok: false, error: `${agent.name} is not available on this platform.` };
    let opened = false;
    let scanned = '';
    const openFrom = (pattern: RegExp) => {
      const url = opened ? null : pattern.exec(scanned)?.[0];
      if (!url) return;
      opened = true;
      hooks.url(url);
    };
    handle = run(cli.path, agent.loginArgs, {
      cwd: os.homedir(),
      env,
      stdin: true,
      timeoutMs: LOGIN_TIMEOUT_MS,
      onChunk(chunk) {
        hooks.output(chunk);
        if (opened) return;
        scanned = (scanned + chunk).slice(-URL_SCAN_LIMIT);
        clearTimeout(settle);
        openFrom(COMPLETE_URL_RE);
        // A prompt can end on the URL and wait there for input.
        if (!opened) settle = setTimeout(() => openFrom(URL_RE), URL_SETTLE_MS);
      },
    });
    const result = await handle.done;
    clearTimeout(settle);
    return taskResult(result, 'Sign-in');
  };

  return {
    done: attempt(),
    write: (text) => handle?.child.stdin?.write(`${text}\n`),
    cancel: () => {
      cancelled = true;
      cancelInstall(id);
      void handle?.terminate();
    },
  };
}

export async function logout(id: AgentId, env: NodeJS.ProcessEnv): Promise<TaskResult> {
  const agent = AGENTS[id];
  const cli = resolveCli(agent, env);
  if (!cli) return { ok: false, error: `${agent.name} is not installed.` };
  const { code, output } = await runCli(cli.path, agent.logoutArgs, env);
  return code === 0 ? { ok: true } : { ok: false, error: output.trim() || `exit code ${code}` };
}
