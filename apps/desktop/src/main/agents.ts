import type { ChildProcess } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AgentId, AgentInfo, LoginEvent, TaskResult } from '../shared/types';
import { cancelInstall, canInstallCli, installCli, isManagedCli } from './agent-cli';
import { run } from './process';
import { findOnPath } from './shell-env';
import { modulesDir } from './workspace';

const STATUS_TIMEOUT_MS = 10_000;
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000;
const URL_RE = /https?:\/\/[^\s"'<>]+/;

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
    name: 'Claude Code',
    sdkPackage: '@anthropic-ai/claude-agent-sdk',
    command: 'claude',
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
    name: 'Codex',
    sdkPackage: '@openai/codex-sdk',
    command: 'codex',
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
  const found = findOnPath(agent.command, env);
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

const logins = new Map<AgentId, ChildProcess>();

export async function login(
  id: AgentId,
  env: NodeJS.ProcessEnv,
  emit: (event: LoginEvent) => void,
  openUrl: (url: string) => void,
): Promise<TaskResult> {
  const agent = spec(id);
  if (!resolveCli(agent, env) && canInstallCli(id)) {
    try {
      await installCli(id, (progress) => emit({ id, type: 'download', ...progress }));
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      return { ok: false, error: aborted ? 'Download cancelled.' : (err as Error).message };
    }
    emit({ id, type: 'installed' });
  }
  const cli = resolveCli(agent, env);
  if (!cli) return { ok: false, error: `${agent.name} is not available on this platform.` };
  logins.get(id)?.kill();
  let opened = false;
  const handle = run(cli.path, agent.loginArgs, {
    cwd: os.homedir(),
    env,
    stdin: true,
    timeoutMs: LOGIN_TIMEOUT_MS,
    onChunk(chunk) {
      emit({ id, type: 'output', chunk });
      const url = URL_RE.exec(chunk)?.[0];
      if (url && !opened) {
        opened = true;
        emit({ id, type: 'url', url });
        openUrl(url);
      }
    },
  });
  logins.set(id, handle.child);
  const { code } = await handle.done;
  if (logins.get(id) === handle.child) logins.delete(id);
  emit({ id, type: 'exit', ok: code === 0 });
  return code === 0 ? { ok: true } : { ok: false, error: `Sign-in exited with code ${code}` };
}

export function sendLoginInput(id: AgentId, text: string) {
  logins.get(id)?.stdin?.write(`${text}\n`);
}

export function cancelLogin(id: AgentId) {
  cancelInstall(id);
  logins.get(id)?.kill();
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

export function cancelAllLogins() {
  for (const child of logins.values()) child.kill();
  logins.clear();
}
