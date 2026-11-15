import { existsSync, readFileSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AgentId, AgentInfo, TaskResult } from '../shared/types';
import { cancelInstall, canInstallCli, cliSpec, installCli, isManagedCli } from './agent-cli';
import { type RunHandle, run } from './process';
import { findExecutable } from './shell-env';
import { modulesDir } from './workspace';

const STATUS_TIMEOUT_MS = 10_000;
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000;
// Codex prints its own callback server's address ahead of the sign-in page.
const URL_RE = /https?:\/\/(?!localhost\b|127\.0\.0\.1|\[::1\])[^\s"'<>]+/;
// Output arrives in arbitrary chunks, so a URL only counts as whole once
// something follows it.
const COMPLETE_URL_RE = new RegExp(`${URL_RE.source}(?=[\\s"'<>])`);
const URL_SETTLE_MS = 200;
const URL_SCAN_LIMIT = 8 * 1024;

type AgentSpec = {
  id: AgentId;
  name: string;
  sdkPackage: string;
  command: string;
  statusArgs: string[];
  parseStatus: (code: number | null, output: string) => Pick<AgentInfo, 'signedIn' | 'account'>;
  loginArgs: string[];
  logoutArgs: string[];
};

const AGENTS: AgentSpec[] = [
  {
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
  {
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
];

function spec(id: AgentId): AgentSpec {
  const found = AGENTS.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown agent ${id}`);
  return found;
}

function sdkDir(agent: AgentSpec): string | null {
  const dir = path.join(modulesDir(), agent.sdkPackage);
  return existsSync(path.join(dir, 'package.json')) ? realpathSync(dir) : null;
}

function readVersion(pkgDir: string | null): string | null {
  if (!pkgDir) return null;
  try {
    return (
      (JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8')) as { version?: string })
        .version ?? null
    );
  } catch {
    return null;
  }
}

// The app ships no agent CLI of its own: one on the user's PATH wins, and
// otherwise the copy downloaded on first sign-in, which the child env appends
// to PATH so core's providers find the same binary.
function resolveCli(agent: AgentSpec, env: NodeJS.ProcessEnv) {
  const found = findExecutable(agent.command, env);
  if (!found) return null;
  return { path: found, source: isManagedCli(found) ? ('downloaded' as const) : ('path' as const) };
}

async function cliVersion(cli: string, env: NodeJS.ProcessEnv): Promise<string | null> {
  const { output } = await run(cli, ['--version'], {
    cwd: os.homedir(),
    env,
    timeoutMs: STATUS_TIMEOUT_MS,
  }).done;
  return /(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/.exec(output)?.[1] ?? null;
}

async function describe(agent: AgentSpec, env: NodeJS.ProcessEnv): Promise<AgentInfo> {
  const cli = resolveCli(agent, env);
  const base: AgentInfo = {
    id: agent.id,
    name: agent.name,
    sdkVersion: readVersion(sdkDir(agent)),
    cliPath: cli?.path ?? null,
    cliSource: cli?.source ?? null,
    cliInstallable: !cli && canInstallCli(agent.id),
    cliVersion: null,
    signedIn: null,
    account: null,
  };
  if (!cli) return base;
  const [version, status] = await Promise.all([
    cliVersion(cli.path, env),
    run(cli.path, agent.statusArgs, {
      cwd: os.homedir(),
      env,
      timeoutMs: STATUS_TIMEOUT_MS,
    }).done,
  ]);
  return { ...base, cliVersion: version, ...agent.parseStatus(status.code, status.output) };
}

export function listAgents(env: NodeJS.ProcessEnv): Promise<AgentInfo[]> {
  return Promise.all(AGENTS.map((agent) => describe(agent, env)));
}

export type LoginHooks = {
  download: (progress: { received: number; total: number | null }) => void;
  installed: () => void;
  output: (chunk: string) => void;
  url: (url: string) => void;
};

export type LoginSession = {
  done: Promise<TaskResult>;
  write: (text: string) => void;
  cancel: () => void;
};

// One sign-in attempt: downloads the CLI when it is missing, then runs its
// login command until it exits or is cancelled.
export function startLogin(
  id: AgentId,
  readEnv: () => Promise<NodeJS.ProcessEnv>,
  hooks: LoginHooks,
): LoginSession {
  const agent = spec(id);
  let cancelled = false;
  let handle: RunHandle | null = null;
  let settle: NodeJS.Timeout | undefined;

  const attempt = async (): Promise<TaskResult> => {
    const env = await readEnv();
    if (cancelled) return { ok: false, error: 'Sign-in cancelled.' };
    if (!resolveCli(agent, env) && canInstallCli(id)) {
      try {
        await installCli(id, hooks.download);
      } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        return { ok: false, error: aborted ? 'Download cancelled.' : (err as Error).message };
      }
      hooks.installed();
    }
    if (cancelled) return { ok: false, error: 'Sign-in cancelled.' };
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
    const { code, timedOut } = await handle.done;
    clearTimeout(settle);
    if (code === 0) return { ok: true };
    if (timedOut) return { ok: false, error: 'Sign-in took too long and was stopped.' };
    return { ok: false, error: `Sign-in exited with code ${code}` };
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
  const agent = spec(id);
  const cli = resolveCli(agent, env);
  if (!cli) return { ok: false, error: `${agent.name} is not installed.` };
  const { code, output } = await run(cli.path, agent.logoutArgs, {
    cwd: os.homedir(),
    env,
    timeoutMs: STATUS_TIMEOUT_MS,
  }).done;
  return code === 0 ? { ok: true } : { ok: false, error: output.trim() || `exit code ${code}` };
}
