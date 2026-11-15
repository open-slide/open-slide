import { execFile } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import { settings } from './settings';

const MARKER = '__OPEN_SLIDE_ENV__';
const TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;
// Describe the probe's own shell, not the environment a terminal would have.
const SHELL_STATE = new Set(['PWD', 'OLDPWD', 'SHLVL', '_', 'DISABLE_AUTO_UPDATE']);

let probe: Promise<NodeJS.ProcessEnv> | null = null;
let probed: NodeJS.ProcessEnv | null = null;
let attempts = 0;

// Apps launched from Finder or the Dock inherit launchd's bare environment,
// which misses node, the package managers, the agent CLIs, and whatever the
// shell profile exports for them (API keys, proxies, extra CA certificates).
// Ask the user's login shell for the environment a terminal would see. That
// takes about a second, so until it answers, launches reuse the PATH the
// previous launch found.
export function shellEnv(): Promise<NodeJS.ProcessEnv> {
  const login = loginEnv();
  const cached = settings.loginPath();
  if (probed || cached === null) return login;
  return Promise.resolve(merge({}, cached));
}

// Always waits for the shell: a child that outlives the launch would otherwise
// keep the cached PATH and none of the profile's other exports.
export function loginEnv(): Promise<NodeJS.ProcessEnv> {
  probe ??= readLoginEnv().then((login) => {
    const loginPath = login?.PATH ?? null;
    if (loginPath !== null) settings.setLoginPath(loginPath);
    else if (++attempts < MAX_ATTEMPTS) probe = null;
    const env = merge(login ?? {}, loginPath ?? settings.loginPath());
    if (loginPath !== null) probed = env;
    return env;
  });
  return probe;
}

function merge(login: NodeJS.ProcessEnv, loginPath: string | null): NodeJS.ProcessEnv {
  const paths = [
    ...(loginPath ?? '').split(path.delimiter),
    ...(process.env.PATH ?? '').split(path.delimiter),
  ];
  const unique = [...new Set(paths.filter(Boolean))];
  return { ...process.env, ...login, PATH: unique.join(path.delimiter) };
}

function parseEnv(block: string): NodeJS.ProcessEnv | null {
  const env: NodeJS.ProcessEnv = {};
  for (const entry of block.split('\0')) {
    const eq = entry.indexOf('=');
    if (eq < 1) continue;
    const key = entry.slice(0, eq);
    if (!SHELL_STATE.has(key)) env[key] = entry.slice(eq + 1);
  }
  return env.PATH ? env : null;
}

function readLoginEnv(): Promise<NodeJS.ProcessEnv | null> {
  if (process.platform === 'win32') return Promise.resolve(null);
  const shell = process.env.SHELL || '/bin/zsh';
  // The PATH is printed on its own as well, for an `env` without -0.
  const script = `printf '${MARKER}'; command env -0; printf '${MARKER}%s${MARKER}' "$PATH"`;
  return new Promise((resolve) => {
    execFile(
      shell,
      ['-ilc', script],
      {
        timeout: TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env, DISABLE_AUTO_UPDATE: 'true' },
      },
      (_err, stdout) => {
        const parts = (stdout ?? '').split(MARKER);
        if (parts.length < 4) {
          resolve(null);
          return;
        }
        const loginPath = parts.at(-2) as string;
        resolve(
          parseEnv(parts.slice(1, -2).join(MARKER)) ?? (loginPath ? { PATH: loginPath } : null),
        );
      },
    );
  });
}

export function findOnPath(
  command: string,
  env: NodeJS.ProcessEnv,
  accept: (candidate: string) => boolean = () => true,
): string | null {
  const isWindows = process.platform === 'win32';
  const exts = isWindows ? (env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = path.join(dir, command + ext.toLowerCase());
      try {
        if (statSync(candidate, { throwIfNoEntry: false })?.isFile() && accept(candidate)) {
          return candidate;
        }
      } catch {}
    }
  }
  return null;
}

// An absolute path is spawned without a shell, which cannot run a Windows .cmd
// shim, so there only a real executable counts as found.
export function findExecutable(command: string, env: NodeJS.ProcessEnv): string | null {
  if (process.platform !== 'win32') return findOnPath(command, env);
  return findOnPath(command, env, (candidate) => candidate.toLowerCase().endsWith('.exe'));
}
