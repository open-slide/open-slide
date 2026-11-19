import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { app } from 'electron';
import {
  type CreateWorkspaceRequest,
  PACKAGE_MANAGERS,
  type PackageManager,
  type TaskResult,
  type WorkspaceInspection,
} from '../shared/types';
import { type RunResult, run, runNodeScript } from './process';
import { findOnPath } from './shell-env';

const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;
const IGNORED_ENTRIES = new Set(['.DS_Store', '.git', 'Thumbs.db']);
const PROVIDED_DEPENDENCIES = new Set(['@open-slide/core', 'react', 'react-dom']);
const LOCKFILES: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

export function modulesDir(): string {
  return path.join(app.getAppPath().replace(/app\.asar$/, 'app.asar.unpacked'), 'node_modules');
}

let core: { bin: string; version: string } | null = null;

export function bundledCore(): { bin: string; version: string } {
  if (!core) {
    const dir = path.join(modulesDir(), '@open-slide', 'core');
    const version = readPackageJson(dir)?.version;
    core = {
      bin: path.join(dir, 'bin.js'),
      version: typeof version === 'string' ? version : '0.0.0',
    };
  }
  return core;
}

export function readPackageJson(dir: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
}

export function findUp<T>(start: string, probe: (dir: string) => T | undefined): T | undefined {
  for (let dir = start; ; dir = path.dirname(dir)) {
    const found = probe(dir);
    if (found !== undefined || path.dirname(dir) === dir) return found;
  }
}

// Not require.resolve, which refuses packages whose exports omit package.json.
export function findPackage(name: string, from: string): string | undefined {
  return findUp(from, (dir) => {
    const candidate = path.join(dir, 'node_modules', name);
    return existsSync(path.join(candidate, 'package.json')) ? candidate : undefined;
  });
}

function dependencyNames(pkg: Record<string, unknown>): string[] {
  return ['dependencies', 'devDependencies'].flatMap((field) => {
    const deps = pkg[field];
    return deps && typeof deps === 'object' ? Object.keys(deps) : [];
  });
}

export function needsInstall(root: string): boolean {
  const pkg = readPackageJson(root);
  return dependencyNames(pkg ?? {}).some(
    (name) =>
      !PROVIDED_DEPENDENCIES.has(name) &&
      !name.startsWith('@types/') &&
      findPackage(name, root) === undefined,
  );
}

export function inspectWorkspace(dir: string): WorkspaceInspection {
  const resolved = path.resolve(dir);
  const name = path.basename(resolved);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    return { path: resolved, name, kind: 'missing' };
  }
  const pkg = readPackageJson(resolved);
  if (pkg && dependencyNames(pkg).includes('@open-slide/core')) {
    return {
      path: resolved,
      name: typeof pkg.name === 'string' ? pkg.name : name,
      kind: 'project',
    };
  }
  const entries = readdirSync(resolved).filter((entry) => !IGNORED_ENTRIES.has(entry));
  return { path: resolved, name, kind: entries.length === 0 ? 'empty' : 'other' };
}

export function detectPackageManager(root: string, fallback: PackageManager): PackageManager {
  const declared = readPackageJson(root)?.packageManager;
  if (typeof declared === 'string') {
    const name = declared.split('@')[0];
    if ((PACKAGE_MANAGERS as readonly string[]).includes(name)) return name as PackageManager;
  }
  const locked = findUp(
    root,
    (dir) => LOCKFILES.find(([file]) => existsSync(path.join(dir, file)))?.[1],
  );
  return locked ?? fallback;
}

export function availablePackageManagers(env: NodeJS.ProcessEnv): PackageManager[] {
  return PACKAGE_MANAGERS.filter((pm) => findOnPath(pm, env) !== null);
}

export function taskResult({ code, timedOut }: RunResult, label: string): TaskResult {
  if (code === 0) return { ok: true };
  if (timedOut) return { ok: false, error: `${label} took too long and was stopped.` };
  return { ok: false, error: `${label} exited with code ${code}` };
}

export async function installDependencies(
  root: string,
  pm: PackageManager,
  env: NodeJS.ProcessEnv,
  onChunk: (chunk: string) => void,
): Promise<TaskResult> {
  onChunk(`$ ${pm} install\n`);
  const { done } = run(pm, ['install'], { cwd: root, env, onChunk, timeoutMs: INSTALL_TIMEOUT_MS });
  return taskResult(await done, `${pm} install`);
}

export async function syncSkills(
  root: string,
  env: NodeJS.ProcessEnv,
  onChunk: (chunk: string) => void,
): Promise<TaskResult> {
  const { done } = runNodeScript(bundledCore().bin, ['sync:skills'], { cwd: root, env, onChunk });
  return taskResult(await done, 'sync:skills');
}

export type CreateResult =
  | { ok: true; root: string; created: boolean }
  | { ok: false; error: string };

async function initWorkspace(
  parent: string,
  name: string,
  flags: string[],
  env: NodeJS.ProcessEnv,
  onChunk: (chunk: string) => void,
): Promise<CreateResult> {
  const target = path.join(parent, name);
  const existing = inspectWorkspace(target);
  if (existing.kind === 'project' || existing.kind === 'other') {
    return { ok: false, error: `${target} already exists and is not empty.` };
  }
  let cli: string;
  try {
    cli = realpathSync(path.join(modulesDir(), '@open-slide', 'cli'));
  } catch {
    return { ok: false, error: 'The bundled @open-slide/cli is missing from this build.' };
  }
  const args = ['init', name, ...flags];
  onChunk(`$ open-slide ${args.join(' ')}\n`);
  const opts = { cwd: parent, env, onChunk, timeoutMs: INSTALL_TIMEOUT_MS };
  const result = await runNodeScript(path.join(cli, 'dist', 'cli.js'), args, opts).done;
  const outcome = taskResult(result, 'open-slide init');
  if (!outcome.ok) return outcome;
  if (inspectWorkspace(target).kind !== 'project') {
    return { ok: false, error: `open-slide init exited with code ${result.code}` };
  }
  return { ok: true, root: target, created: true };
}

export function createWorkspace(
  request: CreateWorkspaceRequest,
  env: NodeJS.ProcessEnv,
  onChunk: (chunk: string) => void,
): Promise<CreateResult> {
  const flags = [`--use-${request.packageManager}`];
  return initWorkspace(request.parent, request.name, flags, env, onChunk);
}

export async function createDefaultWorkspace(
  env: NodeJS.ProcessEnv,
  onChunk: (chunk: string) => void,
): Promise<CreateResult> {
  const root = path.join(homedir(), '.open-slide', 'slides');
  if (inspectWorkspace(root).kind === 'project') return { ok: true, root, created: false };
  const parent = path.dirname(root);
  await mkdir(parent, { recursive: true });
  // On a Mac without developer tools, merely probing for git opens an install prompt.
  const flags = ['--no-install', '--no-git'];
  return initWorkspace(parent, path.basename(root), flags, env, onChunk);
}
