import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import {
  type CreateWorkspaceRequest,
  PACKAGE_MANAGERS,
  type PackageManager,
  type TaskResult,
  type WorkspaceInspection,
} from '../shared/types';
import { run, runNodeScript } from './process';
import { findOnPath } from './shell-env';

const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;
const IGNORED_ENTRIES = new Set(['.DS_Store', '.git', 'Thumbs.db']);

// Packages the app ships that something outside its own bundle runs or
// imports. They live unpacked next to app.asar so other processes can read
// them as ordinary files.
export function modulesDir(): string {
  return path.join(app.getAppPath().replace(/app\.asar$/, 'app.asar.unpacked'), 'node_modules');
}

export function coreBin(root: string): string {
  return path.join(root, 'node_modules', '@open-slide', 'core', 'bin.js');
}

function readPackageJson(dir: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function dependsOnCore(pkg: Record<string, unknown>): boolean {
  return ['dependencies', 'devDependencies'].some((field) => {
    const deps = pkg[field] as Record<string, unknown> | undefined;
    return Boolean(deps && Object.hasOwn(deps, '@open-slide/core'));
  });
}

export function inspectWorkspace(dir: string): WorkspaceInspection {
  const resolved = path.resolve(dir);
  const name = path.basename(resolved);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    return { path: resolved, name, kind: 'missing' };
  }
  const pkg = readPackageJson(resolved);
  if (pkg && dependsOnCore(pkg)) {
    return {
      path: resolved,
      name: typeof pkg.name === 'string' ? pkg.name : name,
      kind: 'project',
    };
  }
  const entries = readdirSync(resolved).filter((entry) => !IGNORED_ENTRIES.has(entry));
  return { path: resolved, name, kind: entries.length === 0 ? 'empty' : 'other' };
}

const LOCKFILES: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

export function detectPackageManager(root: string, fallback: PackageManager): PackageManager {
  const declared = readPackageJson(root)?.packageManager;
  if (typeof declared === 'string') {
    const name = declared.split('@')[0];
    if ((PACKAGE_MANAGERS as readonly string[]).includes(name)) return name as PackageManager;
  }
  let dir = root;
  while (true) {
    for (const [file, pm] of LOCKFILES) {
      if (existsSync(path.join(dir, file))) return pm;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return fallback;
    dir = parent;
  }
}

export function availablePackageManagers(env: NodeJS.ProcessEnv): PackageManager[] {
  return PACKAGE_MANAGERS.filter((pm) => findOnPath(pm, env) !== null);
}

export async function installDependencies(
  root: string,
  pm: PackageManager,
  env: NodeJS.ProcessEnv,
  onChunk: (chunk: string) => void,
): Promise<TaskResult> {
  onChunk(`$ ${pm} install\n`);
  const { done } = run(pm, ['install'], { cwd: root, env, onChunk, timeoutMs: INSTALL_TIMEOUT_MS });
  const { code } = await done;
  if (code === 0 && existsSync(coreBin(root))) return { ok: true };
  return { ok: false, error: `${pm} install exited with code ${code}` };
}

function cliEntry(): string {
  const pkgDir = realpathSync(path.join(modulesDir(), '@open-slide', 'cli'));
  return path.join(pkgDir, 'dist', 'cli.js');
}

export async function createWorkspace(
  request: CreateWorkspaceRequest,
  env: NodeJS.ProcessEnv,
  onChunk: (chunk: string) => void,
): Promise<TaskResult & { root?: string }> {
  const target = path.join(request.parent, request.name);
  const existing = inspectWorkspace(target);
  if (existing.kind === 'project' || existing.kind === 'other') {
    return { ok: false, error: `${target} already exists and is not empty.` };
  }
  let entry: string;
  try {
    entry = cliEntry();
  } catch {
    return { ok: false, error: 'The bundled @open-slide/cli is missing from this build.' };
  }
  const args = ['init', request.name, `--use-${request.packageManager}`];
  onChunk(`$ open-slide ${args.join(' ')}\n`);
  const { done } = runNodeScript(entry, args, {
    cwd: request.parent,
    env,
    onChunk,
    timeoutMs: INSTALL_TIMEOUT_MS,
  });
  const { code } = await done;
  if (code !== 0 || inspectWorkspace(target).kind !== 'project') {
    return { ok: false, error: `open-slide init exited with code ${code}` };
  }
  return { ok: true, root: target };
}
