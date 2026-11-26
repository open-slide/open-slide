import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { AGENT_MODULES_ENV } from '../supervision.ts';

const IS_WINDOWS = process.platform === 'win32';
const VERSION_TIMEOUT_MS = 5000;

export function findOnPath(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  accept: (candidate: string) => boolean = () => true,
): string | null {
  const dirs = (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean);
  const exts = IS_WINDOWS ? (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const dir of dirs) {
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

// The SDKs spawn the CLI without a shell, which cannot run a Windows .cmd shim,
// so only a real executable is worth overriding their bundled default with.
export function findSpawnableCli(command: string, env: NodeJS.ProcessEnv = process.env) {
  if (!IS_WINDOWS) return findOnPath(command, env);
  return findOnPath(command, env, (candidate) => candidate.toLowerCase().endsWith('.exe'));
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

type VersionSpawn = { file: string; args: string[]; shell?: boolean };

// Node refuses .cmd/.bat without a shell, and DEP0190 forbids args + shell:
// batch shims must run as a single pre-quoted command string instead.
export function versionSpawnSpec(file: string, isWindows = IS_WINDOWS): VersionSpawn {
  if (isWindows && /\.(cmd|bat)$/i.test(file)) {
    return { file: `"${file}" --version`, args: [], shell: true };
  }
  return { file, args: ['--version'] };
}

function readVersion(file: string): Promise<string | null> {
  return new Promise((resolve) => {
    let out = '';
    const spec = versionSpawnSpec(file);
    let child: ReturnType<typeof spawn>;
    try {
      child = spec.shell
        ? spawn(spec.file, {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
            windowsHide: true,
          })
        : spawn(spec.file, spec.args, {
            stdio: ['ignore', 'pipe', 'pipe'],
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

export function versionAtLeast(version: string | null | undefined, floor: string): boolean {
  if (!version) return false;
  const parts = (v: string) => v.split(/[-+]/)[0].split('.').map(Number);
  const have = parts(version);
  const need = parts(floor);
  for (let i = 0; i < need.length; i++) {
    const a = have[i] ?? 0;
    if (Number.isNaN(a)) return false;
    if (a !== need[i]) return a > need[i];
  }
  return true;
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
    const pkgDir = path.join(dir, 'node_modules', name);
    if (existsSync(path.join(pkgDir, 'package.json'))) return readPackageAt(pkgDir);
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function readPackageAt(pkgDir: string): ResolvedPackage | null {
  let pkg: PackageJson;
  try {
    pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8')) as PackageJson;
  } catch {
    return null;
  }
  const entry = entryFromPackageJson(pkg);
  if (!entry) return null;
  return { dir: pkgDir, version: pkg.version ?? '0.0.0', entry: path.resolve(pkgDir, entry) };
}

export function resolveAgentPackage(
  userCwd: string,
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedPackage | null {
  const own = resolveWorkspacePackage(userCwd, name);
  if (own) return own;
  for (const dir of (env[AGENT_MODULES_ENV] ?? '').split(path.delimiter).filter(Boolean)) {
    const pkgDir = path.join(dir, name);
    if (existsSync(path.join(pkgDir, 'package.json'))) return readPackageAt(pkgDir);
  }
  return null;
}

export async function importAgentPackage<T>(userCwd: string, name: string): Promise<T | null> {
  const resolved = resolveAgentPackage(userCwd, name);
  if (!resolved) return null;
  return (await import(pathToFileURL(resolved.entry).href)) as T;
}
