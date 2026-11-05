import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json } from './context.ts';
import { executionId, isSupervised, RESTART_EXIT_CODE } from './restart.ts';

// GET /__update-check  → { current, latest, outdated }
//   Compares the running @open-slide/core version against the npm `latest`
//   dist-tag. Network/parse failures degrade to { latest: null, outdated: false }.
// GET /__update-package → UpdateStatus
//   Progress of the in-app update. Polled by the client; a changed
//   executionId means the supervisor respawned the server on the new version.
// POST /__update-package → UpdateStatus
//   Starts installing @open-slide/core@latest with the detected package
//   manager, runs `open-slide sync:skills`, then restarts the dev server when
//   it runs under the CLI supervisor. Returns immediately.
// GET /__release-notes?from=<v>&to=<v> → { releases: Release[] | null }
//   Release notes for versions in (from, to], newest first, from the changelog
//   on open-slide.dev. A release whose own version is older than `from` only
//   brings its newer patches. Without `from`, only the release line holding
//   `to`. null when they could not be loaded.

const PKG = '@open-slide/core';
const CACHE_TTL_MS = 10 * 60 * 1000;
const COMMAND_TIMEOUT_MS = 300_000;
const RELEASES_URL = process.env.OPEN_SLIDE_RELEASES_URL ?? 'https://open-slide.dev/api/releases';

type CheckResult = { current: string; latest: string | null; outdated: boolean };
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
type CommandSpec = { cmd: string; args: string[] };
export type UpdatePhase = 'idle' | 'installing' | 'syncing' | 'restarting' | 'done' | 'error';
type UpdateJob = { phase: UpdatePhase; target: string | null; error: string | null };
export type ReleasePatch = { version: string; note: string };
export type ReleaseCover = { url: string; width: number; height: number; alt: string };
export type Release = {
  version: string;
  title: string;
  summary: string | null;
  highlights: string[];
  image: ReleaseCover | null;
  url: string | null;
  patches: ReleasePatch[];
};

let cache: { at: number; latest: string | null } | null = null;
let releasesCache: { at: number; releases: Release[] } | null = null;
let job: UpdateJob = { phase: 'idle', target: null, error: null };

function parseSemver(v: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareVersions(a: string, b: string): number {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (!x || !y) return 0;
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] - y[i];
  }
  return 0;
}

function isOutdated(current: string, latest: string): boolean {
  if (!parseSemver(current) || !parseSemver(latest)) return false;
  return compareVersions(latest, current) > 0;
}

async function fetchLatest(now: number): Promise<string | null> {
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.latest;
  try {
    const res = await fetch(`https://registry.npmjs.org/${PKG}/latest`, {
      signal: AbortSignal.timeout(3000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`registry ${res.status}`);
    const body = (await res.json()) as { version?: unknown };
    const latest = typeof body.version === 'string' ? body.version : null;
    cache = { at: now, latest };
    return latest;
  } catch {
    return cache?.latest ?? null;
  }
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function positive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function sanitizeCover(value: unknown): ReleaseCover | null {
  if (typeof value !== 'object' || value === null) return null;
  const { url, width, height, alt } = value as Record<string, unknown>;
  const src = httpsUrl(url);
  const w = positive(width);
  const h = positive(height);
  if (!src || !w || !h) return null;
  return { url: src, width: w, height: h, alt: text(alt) ?? '' };
}

function sanitizePatch(value: unknown): ReleasePatch | null {
  if (typeof value !== 'object' || value === null) return null;
  const { version, note } = value as Record<string, unknown>;
  const body = text(note);
  if (typeof version !== 'string' || !parseSemver(version) || !body) return null;
  return { version, note: body };
}

// The payload comes from the network and its image URL ends up in an <img>,
// so keep only well-formed fields.
export function sanitizeReleases(body: unknown): Release[] {
  const list = (body as { releases?: unknown } | null)?.releases;
  if (!Array.isArray(list)) return [];
  const releases: Release[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const { version, title, summary, highlights, image, url, patches } = item as Record<
      string,
      unknown
    >;
    if (typeof version !== 'string' || !parseSemver(version)) continue;
    releases.push({
      version,
      title: text(title) ?? `v${version}`,
      summary: text(summary),
      highlights: Array.isArray(highlights)
        ? highlights.map(text).filter((h): h is string => h !== null)
        : [],
      image: sanitizeCover(image),
      url: httpsUrl(url),
      patches: Array.isArray(patches)
        ? patches.map(sanitizePatch).filter((p): p is ReleasePatch => p !== null)
        : [],
    });
  }
  return releases;
}

function inRange(version: string, from: string, to: string): boolean {
  return compareVersions(version, from) > 0 && compareVersions(version, to) <= 0;
}

export function selectReleases(releases: Release[], from: string | null, to: string): Release[] {
  const selected: Release[] = [];
  for (const release of releases) {
    if (from === null) {
      const line = [release.version, ...release.patches.map((p) => p.version)];
      if (!line.some((v) => compareVersions(v, to) === 0)) continue;
      const patches = release.patches.filter((p) => compareVersions(p.version, to) <= 0);
      selected.push({ ...release, patches });
      continue;
    }
    const patches = release.patches.filter((p) => inRange(p.version, from, to));
    if (inRange(release.version, from, to)) {
      selected.push({ ...release, patches });
    } else if (patches.length > 0 && compareVersions(release.version, to) <= 0) {
      selected.push({ ...release, summary: null, highlights: [], image: null, patches });
    }
  }
  return selected.sort((a, b) => compareVersions(b.version, a.version));
}

async function fetchReleases(now: number): Promise<Release[] | null> {
  if (releasesCache && now - releasesCache.at < CACHE_TTL_MS) return releasesCache.releases;
  try {
    const res = await fetch(RELEASES_URL, {
      signal: AbortSignal.timeout(4000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`releases ${res.status}`);
    const releases = sanitizeReleases(await res.json());
    releasesCache = { at: now, releases };
    return releases;
  } catch {
    return releasesCache?.releases ?? null;
  }
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

const LOCKFILES: ReadonlyArray<readonly [string, PackageManager]> = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['package-lock.json', 'npm'],
];

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
  const ua = process.env.npm_config_user_agent ?? '';
  if (ua.startsWith('pnpm')) return 'pnpm';
  if (ua.startsWith('yarn')) return 'yarn';
  if (ua.startsWith('bun')) return 'bun';
  if (ua.startsWith('npm')) return 'npm';

  // Workspace members have no lockfile of their own; it lives at the root.
  let dir = cwd;
  while (true) {
    for (const [lockfile, pm] of LOCKFILES) {
      if (await fileExists(path.join(dir, lockfile))) return pm;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return 'npm';
    dir = parent;
  }
}

export function updateCommandFor(packageManager: PackageManager): CommandSpec {
  switch (packageManager) {
    case 'pnpm':
      return { cmd: 'pnpm', args: ['add', `${PKG}@latest`] };
    case 'yarn':
      return { cmd: 'yarn', args: ['add', `${PKG}@latest`] };
    case 'bun':
      return { cmd: 'bun', args: ['add', `${PKG}@latest`] };
    case 'npm':
      return { cmd: 'npm', args: ['install', `${PKG}@latest`] };
  }
}

function localOpenSlideCommand(cwd: string): CommandSpec {
  const bin = process.platform === 'win32' ? 'open-slide.cmd' : 'open-slide';
  return { cmd: path.join(cwd, 'node_modules', '.bin', bin), args: ['sync:skills'] };
}

function formatCommand(spec: CommandSpec): string {
  return [spec.cmd, ...spec.args].join(' ');
}

export async function runCommand(
  spec: CommandSpec,
  cwd: string,
  timeoutMs = COMMAND_TIMEOUT_MS,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(spec.cmd, spec.args, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${formatCommand(spec)} timed out`));
    }, timeoutMs);

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 2000) stderr = stderr.slice(-2000);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      const detail = stderr.trim();
      reject(new Error(detail || `${formatCommand(spec)} exited with code ${code ?? 'unknown'}`));
    });
  });
}

function isBusy(phase: UpdatePhase): boolean {
  return phase === 'installing' || phase === 'syncing' || phase === 'restarting';
}

function updateStatus() {
  return { executionId, canRestart: isSupervised(), ...job };
}

async function runUpdate(ctx: ApiContext): Promise<void> {
  job = { phase: 'installing', target: cache?.latest ?? null, error: null };
  try {
    job.target = (await fetchLatest(Date.now())) ?? job.target;
    const packageManager = await detectPackageManager(ctx.userCwd);
    await runCommand(updateCommandFor(packageManager), ctx.userCwd);
    job.phase = 'syncing';
    await runCommand(localOpenSlideCommand(ctx.userCwd), ctx.userCwd);
    cache = null;
  } catch (err) {
    job = { ...job, phase: 'error', error: err instanceof Error ? err.message : 'update failed' };
    return;
  }
  if (!isSupervised()) {
    job.phase = 'done';
    return;
  }
  job.phase = 'restarting';
  // A short grace period lets pollers see `restarting` before the socket drops.
  setTimeout(() => process.exit(RESTART_EXIT_CODE), 300);
}

export function registerUpdateRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__update-check', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'GET') return next();
    const latest = await fetchLatest(Date.now());
    const result: CheckResult = {
      current: ctx.coreVersion,
      latest,
      outdated: latest ? isOutdated(ctx.coreVersion, latest) : false,
    };
    res.setHeader('cache-control', 'no-store');
    json(res, 200, result);
  });

  server.middlewares.use('/__update-package', (req, res, next) => {
    const method = req.method ?? 'GET';
    if (method === 'GET') {
      res.setHeader('cache-control', 'no-store');
      return json(res, 200, updateStatus());
    }
    if (method !== 'POST') return next();

    const guard = validateMutationRequest(req);
    if (!guard.ok) return json(res, guard.status, { error: guard.error });

    if (!isBusy(job.phase)) void runUpdate(ctx);
    json(res, 200, updateStatus());
  });

  server.middlewares.use('/__release-notes', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'GET') return next();
    const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
    const to = params.get('to') ?? ctx.coreVersion;
    const from = params.get('from');
    if (!parseSemver(to) || (from !== null && !parseSemver(from))) {
      return json(res, 400, { error: 'invalid version' });
    }
    const releases = await fetchReleases(Date.now());
    res.setHeader('cache-control', 'no-store');
    json(res, 200, { releases: releases ? selectReleases(releases, from, to) : null });
  });
}
