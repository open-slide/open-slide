import { execFile } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import { settings } from './settings';

const MARKER = '__OPEN_SLIDE_PATH__';
const TIMEOUT_MS = 5000;

let probe: Promise<NodeJS.ProcessEnv> | null = null;
let probed: NodeJS.ProcessEnv | null = null;

// Apps launched from Finder or the Dock inherit launchd's bare PATH, which
// misses node, the package managers, and the agent CLIs. Ask the user's login
// shell for the PATH a terminal would see. That takes about a second, so until
// it answers, launches reuse the PATH the previous launch found.
export function shellEnv(): Promise<NodeJS.ProcessEnv> {
  probe ??= readLoginPath().then((loginPath) => {
    if (loginPath !== null) settings.setLoginPath(loginPath);
    probed = withPath(loginPath ?? settings.loginPath());
    return probed;
  });
  const cached = settings.loginPath();
  if (probed || cached === null) return probe;
  return Promise.resolve(withPath(cached));
}

function withPath(loginPath: string | null): NodeJS.ProcessEnv {
  const merged = [
    ...(loginPath ?? '').split(path.delimiter),
    ...(process.env.PATH ?? '').split(path.delimiter),
  ];
  const unique = [...new Set(merged.filter(Boolean))];
  return { ...process.env, PATH: unique.join(path.delimiter) };
}

function readLoginPath(): Promise<string | null> {
  if (process.platform === 'win32') return Promise.resolve(null);
  const shell = process.env.SHELL || '/bin/zsh';
  return new Promise((resolve) => {
    execFile(
      shell,
      ['-ilc', `printf '${MARKER}%s${MARKER}' "$PATH"`],
      { timeout: TIMEOUT_MS, env: { ...process.env, DISABLE_AUTO_UPDATE: 'true' } },
      (_err, stdout) => {
        const match = new RegExp(`${MARKER}(.*)${MARKER}`).exec(stdout ?? '');
        resolve(match ? match[1] : null);
      },
    );
  });
}

export function findOnPath(command: string, env: NodeJS.ProcessEnv): string | null {
  const isWindows = process.platform === 'win32';
  const exts = isWindows ? (env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : [''];
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
