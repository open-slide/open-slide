import type { ChildProcess } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AgentId, AgentInfo, LoginEvent, TaskResult } from '../shared/types';
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
  bundledCli: (sdkDir: string) => string | null;
  statusArgs: string[];
  parseStatus: (code: number | null, output: string) => Pick<AgentInfo, 'signedIn' | 'account'>;
  loginArgs: string[];
  logoutArgs: string[];
};

const EXE = process.platform === 'win32' ? '.exe' : '';

// Node's lookup, walking up from a package's real directory: pnpm keeps a
// package's dependencies next to it in the store rather than below it.
function findPackageDir(fromDir: string, name: string): string | null {
  let dir = fromDir;
  while (true) {
    if (path.basename(dir) !== 'node_modules') {
      const candidate = path.join(dir, 'node_modules', name);
      if (existsSync(path.join(candidate, 'package.json'))) return realpathSync(candidate);
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function platformSuffix(): string {
  return `${process.platform}-${process.arch}`;
}

function claudeBundledCli(sdkDir: string): string | null {
  const pkg = findPackageDir(sdkDir, `@anthropic-ai/claude-agent-sdk-${platformSuffix()}`);
  const file = pkg && path.join(pkg, `claude${EXE}`);
  return file && existsSync(file) ? file : null;
}

function codexBundledCli(sdkDir: string): string | null {
  const codex = findPackageDir(sdkDir, '@openai/codex');
  const native = codex && findPackageDir(codex, `@openai/codex-${platformSuffix()}`);
  if (!native) return null;
  const vendor = path.join(native, 'vendor');
  for (const triple of existsSync(vendor) ? readdirSync(vendor) : []) {
    const file = path.join(vendor, triple, 'bin', `codex${EXE}`);
    if (existsSync(file)) return file;
  }
  return null;
}

const AGENTS: AgentSpec[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    sdkPackage: '@anthropic-ai/claude-agent-sdk',
    command: 'claude',
    bundledCli: claudeBundledCli,
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
    bundledCli: codexBundledCli,
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

// Core's providers prefer a CLI on PATH and otherwise let the SDK run the
// copy it ships, so status and sign-in go through the same binary.
function resolveCli(agent: AgentSpec, env: NodeJS.ProcessEnv) {
  const onPath = findOnPath(agent.command, env);
  if (onPath) return { path: onPath, source: 'path' as const };
  const dir = sdkDir(agent);
  const bundled = dir ? agent.bundledCli(dir) : null;
  return bundled ? { path: bundled, source: 'bundled' as const } : null;
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
  const cli = resolveCli(agent, env);
  if (!cli) return { ok: false, error: `${agent.name} is not available in this build.` };
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
  logins.get(id)?.kill();
}

export async function logout(id: AgentId, env: NodeJS.ProcessEnv): Promise<TaskResult> {
  const agent = spec(id);
  const cli = resolveCli(agent, env);
  if (!cli) return { ok: false, error: `${agent.name} is not available in this build.` };
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
