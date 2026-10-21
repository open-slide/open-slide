import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const IS_WINDOWS = process.platform === 'win32';
const VERSION_TIMEOUT_MS = 5000;

export function findOnPath(command: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const dirs = (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean);
  const exts = IS_WINDOWS ? (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.join(dir, command + ext.toLowerCase());
      try {
        if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) return candidate;
      } catch {}
    }
  }
  return null;
}

// The SDKs spawn the CLI without a shell, which cannot run a Windows .cmd shim,
// so only a real executable is worth overriding their bundled default with.
export function findSpawnableCli(command: string, env: NodeJS.ProcessEnv = process.env) {
  const found = findOnPath(command, env);
  if (!found || !IS_WINDOWS) return found;
  return found.toLowerCase().endsWith('.exe') ? found : null;
}

const versionCache = new Map<string, Promise<string | null>>();

export function commandVersion(file: string): Promise<string | null> {
  let cached = versionCache.get(file);
  if (!cached) {
    cached = readVersion(file);
    versionCache.set(file, cached);
  }
  return cached;
}

function readVersion(file: string): Promise<string | null> {
  return new Promise((resolve) => {
    let out = '';
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(file, ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: IS_WINDOWS,
        windowsHide: true,
      });
    } catch {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => {
      child.kill();
      resolve(null);
    }, VERSION_TIMEOUT_MS);
    child.stdout?.on('data', (c: Buffer) => {
      out += c.toString('utf8');
    });
    child.stderr?.on('data', (c: Buffer) => {
      out += c.toString('utf8');
    });
    child.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on('close', () => {
      clearTimeout(timer);
      resolve(parseVersion(out));
    });
  });
}

export function parseVersion(output: string): string | null {
  const m = /(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/.exec(output);
  return m ? m[1] : null;
}

type PackageJson = {
  version?: string;
  main?: string;
  module?: string;
  exports?: unknown;
};

export type ResolvedPackage = { dir: string; version: string; entry: string };

export function entryFromPackageJson(pkg: PackageJson): string | null {
  const root = pickExport(pkg.exports);
  if (root) return root;
  return pkg.module ?? pkg.main ?? null;
}

function pickExport(exportsField: unknown): string | null {
  if (!exportsField) return null;
  if (typeof exportsField === 'string') return exportsField;
  if (typeof exportsField !== 'object') return null;
  const record = exportsField as Record<string, unknown>;
  const keys = Object.keys(record);
  const isSubpathMap = keys.some((k) => k.startsWith('.'));
  const target = isSubpathMap ? record['.'] : exportsField;
  return pickCondition(target);
}

function pickCondition(target: unknown): string | null {
  if (!target) return null;
  if (typeof target === 'string') return target;
  if (Array.isArray(target)) {
    for (const t of target) {
      const hit = pickCondition(t);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof target !== 'object') return null;
  const record = target as Record<string, unknown>;
  for (const key of ['import', 'node', 'default', 'require']) {
    if (key in record) {
      const hit = pickCondition(record[key]);
      if (hit) return hit;
    }
  }
  return null;
}

// Walks node_modules up from the workspace like Node does, but reads
// package.json directly: the SDKs' `exports` maps don't expose it, so
// `require.resolve('<pkg>/package.json')` would refuse.
export function resolveWorkspacePackage(userCwd: string, name: string): ResolvedPackage | null {
  let dir = path.resolve(userCwd);
  while (true) {
    const pkgJsonPath = path.join(dir, 'node_modules', name, 'package.json');
    if (existsSync(pkgJsonPath)) {
      let pkg: PackageJson;
      try {
        pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as PackageJson;
      } catch {
        return null;
      }
      const entry = entryFromPackageJson(pkg);
      if (!entry) return null;
      const pkgDir = path.dirname(pkgJsonPath);
      return { dir: pkgDir, version: pkg.version ?? '0.0.0', entry: path.resolve(pkgDir, entry) };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function importWorkspacePackage<T>(userCwd: string, name: string): Promise<T | null> {
  const resolved = resolveWorkspacePackage(userCwd, name);
  if (!resolved) return null;
  return (await import(pathToFileURL(resolved.entry).href)) as T;
}
