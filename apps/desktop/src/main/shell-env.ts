import { execFile } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import { settings } from './settings';

const MARKER = '__OPEN_SLIDE_ENV__';
const TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;
// These describe the probe's own shell, not the environment a terminal would have.
const SHELL_STATE = new Set(['PWD', 'OLDPWD', 'SHLVL', '_', 'DISABLE_AUTO_UPDATE']);
const isWindows = process.platform === 'win32';

let probe: Promise<NodeJS.ProcessEnv> | null = null;
let probed = false;
let attempts = 0;

// Apps launched from Finder inherit launchd's bare environment, so the login shell is asked
// for a terminal's. That takes about a second; until then, launches reuse the last PATH found.
export function shellEnv(): Promise<NodeJS.ProcessEnv> {
  const login = loginEnv();
  const cached = settings.loginPath();
  if (probed || cached === null) return login;
  return Promise.resolve(withPath({ PATH: cached }));
}

// Always waits for the shell, so long-lived children get the profile's other exports too.
export function loginEnv(): Promise<NodeJS.ProcessEnv> {
  probe ??= readLoginEnv().then((login) => {
    if (!login?.PATH) {
      if (++attempts < MAX_ATTEMPTS) probe = null;
      return withPath({ PATH: settings.loginPath() ?? undefined });
    }
    settings.setLoginPath(login.PATH);
    probed = true;
    return withPath(login);
  });
  return probe;
}

function withPath(login: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const paths = [login.PATH, process.env.PATH].flatMap((p) => (p ?? '').split(path.delimiter));
  return {
    ...process.env,
    ...login,
    PATH: [...new Set(paths.filter(Boolean))].join(path.delimiter),
  };
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
  if (isWindows) return Promise.resolve(null);
  const shell = process.env.SHELL || '/bin/zsh';
  // PATH is printed on its own too, for an `env` without -0.
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
        if (parts.length < 4) return resolve(null);
        const loginPath = parts.at(-2);
        resolve(
          parseEnv(parts.slice(1, -2).join(MARKER)) ?? (loginPath ? { PATH: loginPath } : null),
        );
      },
    );
  });
}

function search(command: string, env: NodeJS.ProcessEnv, exts: string[]): string | null {
  for (const dir of (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = path.join(dir, command + ext.toLowerCase());
      try {
        if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) return candidate;
      } catch {}
    }
  }
  return null;
}

export function findOnPath(command: string, env: NodeJS.ProcessEnv): string | null {
  return search(command, env, isWindows ? (env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : ['']);
}

// An absolute path is spawned without a shell, which cannot run a Windows .cmd shim.
export function findExecutable(command: string, env: NodeJS.ProcessEnv): string | null {
  return search(command, env, [isWindows ? '.exe' : '']);
}
