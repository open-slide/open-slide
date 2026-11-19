import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, readdirSync, realpathSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';
import { app, net } from 'electron';
import { AGENT_IDS, type AgentId, type LoginState } from '../shared/types';
import { isWindows } from './platform';
import { run, windowsTool } from './process';
import { findPackage, modulesDir, readPackageJson } from './workspace';

const REGISTRY = 'https://registry.npmjs.org';
const EXTRACT_TIMEOUT_MS = 5 * 60 * 1000;
const PROGRESS_INTERVAL_MS = 100;
const EXE = isWindows ? '.exe' : '';
const PLATFORM = `${process.platform}-${process.arch}`;

const CODEX_TRIPLES: Record<string, string> = {
  'darwin-arm64': 'aarch64-apple-darwin',
  'darwin-x64': 'x86_64-apple-darwin',
  'linux-arm64': 'aarch64-unknown-linux-musl',
  'linux-x64': 'x86_64-unknown-linux-musl',
  'win32-arm64': 'aarch64-pc-windows-msvc',
  'win32-x64': 'x86_64-pc-windows-msvc',
};

function codexVendorDir(root: string): string {
  return path.join(root, 'vendor', CODEX_TRIPLES[PLATFORM] ?? PLATFORM);
}

type CliSpec = {
  command: string;
  sdkPackage: string;
  name: string;
  pinnedBy?: string;
  platformPackage: string;
  binDir: (root: string) => string;
  companionDirs?: (root: string) => string[];
};

const SPECS: Record<AgentId, CliSpec> = {
  claude: {
    command: 'claude',
    sdkPackage: '@anthropic-ai/claude-agent-sdk',
    name: 'Claude Code',
    platformPackage: `@anthropic-ai/claude-agent-sdk-${PLATFORM}`,
    binDir: (root) => root,
  },
  codex: {
    command: 'codex',
    sdkPackage: '@openai/codex-sdk',
    name: 'Codex',
    pinnedBy: '@openai/codex',
    platformPackage: `@openai/codex-${PLATFORM}`,
    binDir: (root) => path.join(codexVendorDir(root), 'bin'),
    companionDirs: (root) => [path.join(codexVendorDir(root), 'codex-path')],
  },
};

type Pin = { name: string; version: string };
type DownloadProgress = NonNullable<LoginState['download']>;

export function cliSpec(id: AgentId): Pick<CliSpec, 'command' | 'sdkPackage' | 'name'> {
  return SPECS[id];
}

function agentsRoot(): string {
  return path.join(app.getPath('userData'), 'agents');
}

const pins = new Map<AgentId, Pin | null>();

function pin(id: AgentId): Pin | null {
  if (!pins.has(id)) pins.set(id, readPin(SPECS[id]));
  return pins.get(id) ?? null;
}

function readPin(spec: CliSpec): Pin | null {
  const sdkDir = path.join(modulesDir(), spec.sdkPackage);
  if (!existsSync(sdkDir)) return null;
  // pnpm keeps a package's dependencies next to its real directory in the store.
  const pinner = spec.pinnedBy ? findPackage(spec.pinnedBy, realpathSync(sdkDir)) : sdkDir;
  const optional = pinner && readPackageJson(pinner)?.optionalDependencies;
  const range = (optional as Record<string, unknown> | undefined)?.[spec.platformPackage];
  if (typeof range !== 'string') return null;
  const alias = /^npm:(.+)@([^@]+)$/.exec(range);
  return alias
    ? { name: alias[1], version: alias[2] }
    : { name: spec.platformPackage, version: range };
}

function versionDir(id: AgentId, version: string): string {
  return path.join(agentsRoot(), id, version);
}

function packageDir(id: AgentId, version: string): string {
  return path.join(versionDir(id, version), 'package');
}

function pathDirs(id: AgentId, version: string): string[] {
  const { binDir, companionDirs } = SPECS[id];
  const root = packageDir(id, version);
  return [binDir(root), ...(companionDirs?.(root) ?? [])];
}

function executable(id: AgentId, version: string): string {
  const { binDir, command } = SPECS[id];
  return path.join(binDir(packageDir(id, version)), command + EXE);
}

function installedVersions(id: AgentId): string[] {
  const dir = path.join(agentsRoot(), id);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.') && existsSync(executable(id, name)))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

export function canInstallCli(id: AgentId): boolean {
  return pin(id) !== null;
}

export function isManagedCli(file: string): boolean {
  return file.startsWith(agentsRoot() + path.sep);
}

let cliDirs: string[] | null = null;

// The pinned version is listed before it is downloaded, so servers already running find it
// once it lands; until then an older download stands in.
export function managedCliDirs(): string[] {
  cliDirs ??= AGENT_IDS.flatMap((id) => {
    const current = pin(id)?.version;
    const versions = current ? [current] : [];
    const fallback = installedVersions(id).find((v) => v !== current);
    if (fallback && !(current && existsSync(executable(id, current)))) versions.push(fallback);
    return versions.flatMap((v) => pathDirs(id, v));
  });
  return cliDirs;
}

const installs = new Map<AgentId, { done: Promise<void>; abort: AbortController }>();

export function installCli(
  id: AgentId,
  onProgress: (progress: DownloadProgress) => void,
): Promise<void> {
  const running = installs.get(id);
  if (running) return running.done;
  const abort = new AbortController();
  const done = download(id, abort.signal, onProgress).finally(() => installs.delete(id));
  installs.set(id, { done, abort });
  return done;
}

export function cancelInstall(id: AgentId) {
  installs.get(id)?.abort.abort();
}

export function cancelAllInstalls() {
  for (const { abort } of installs.values()) abort.abort();
}

async function registryDist(
  target: Pin,
  signal: AbortSignal,
): Promise<{ tarball: string; sha512: string }> {
  const url = `${REGISTRY}/${target.name.replace('/', '%2f')}/${encodeURIComponent(target.version)}`;
  const res = await net.fetch(url, { signal });
  if (!res.ok) throw new Error(`Registry responded ${res.status} for ${target.name}.`);
  const { dist } = (await res.json()) as { dist?: { tarball?: string; integrity?: string } };
  const sha512 = dist?.integrity?.startsWith('sha512-') ? dist.integrity.slice(7) : null;
  if (!dist?.tarball || !sha512) throw new Error(`Registry has no checksum for ${target.name}.`);
  if (!dist.tarball.startsWith(`${REGISTRY}/`)) {
    throw new Error(`Registry pointed ${target.name} at an unexpected host.`);
  }
  return { tarball: dist.tarball, sha512 };
}

async function fetchTarball(
  url: string,
  file: string,
  signal: AbortSignal,
  onProgress: (progress: DownloadProgress) => void,
): Promise<string> {
  const res = await net.fetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`Download failed with status ${res.status}.`);
  const length = Number(res.headers.get('content-length'));
  const total = Number.isFinite(length) && length > 0 ? length : null;
  const hash = createHash('sha512');
  let received = 0;
  let reported = 0;
  onProgress({ received, total });
  const meter = new Transform({
    transform(chunk: Buffer, _enc, callback) {
      hash.update(chunk);
      received += chunk.length;
      const now = Date.now();
      if (now - reported >= PROGRESS_INTERVAL_MS) {
        reported = now;
        onProgress({ received, total });
      }
      callback(null, chunk);
    },
  });
  await pipeline(
    Readable.fromWeb(res.body as ReadableStream<Uint8Array>),
    meter,
    createWriteStream(file),
    { signal },
  );
  onProgress({ received, total });
  return hash.digest('base64');
}

async function extractTarball(tarball: string, into: string, signal: AbortSignal) {
  await mkdir(into, { recursive: true });
  const tar = isWindows ? windowsTool('tar.exe') : 'tar';
  signal.throwIfAborted();
  const extract = run(tar, ['-xzf', tarball, '-C', into], {
    cwd: path.dirname(tarball),
    env: process.env,
    timeoutMs: EXTRACT_TIMEOUT_MS,
  });
  signal.addEventListener('abort', () => void extract.terminate(), { once: true });
  const { code, output } = await extract.done;
  if (signal.aborted) throw signal.reason;
  if (code !== 0) throw new Error(output.trim() || `tar exited with code ${code}`);
}

async function download(
  id: AgentId,
  signal: AbortSignal,
  onProgress: (progress: DownloadProgress) => void,
) {
  const target = pin(id);
  if (!target) throw new Error(`No ${SPECS[id].command} build is available for ${PLATFORM}.`);
  if (existsSync(executable(id, target.version))) return;

  const dist = await registryDist(target, signal);
  const agentDir = path.join(agentsRoot(), id);
  const tarball = path.join(agentDir, `.${target.version}.tgz`);
  const staging = path.join(agentDir, `.${target.version}.partial`);
  await mkdir(agentDir, { recursive: true });
  await rm(staging, { recursive: true, force: true });

  try {
    const sha512 = await fetchTarball(dist.tarball, tarball, signal, onProgress);
    if (sha512 !== dist.sha512) {
      throw new Error(`The downloaded ${target.name} failed its checksum.`);
    }
    await extractTarball(tarball, staging, signal);
    await rm(versionDir(id, target.version), { recursive: true, force: true });
    await rename(staging, versionDir(id, target.version));
    cliDirs = null;
    if (!existsSync(executable(id, target.version))) {
      throw new Error(`${target.name} did not contain a ${SPECS[id].command} executable.`);
    }
  } finally {
    await rm(tarball, { force: true });
    await rm(staging, { recursive: true, force: true });
  }
}

export async function syncManagedClis() {
  for (const id of AGENT_IDS) {
    const current = pin(id)?.version;
    const installed = installedVersions(id);
    if (!current || installed.length === 0) continue;
    if (!installed.includes(current)) {
      void installCli(id, () => {}).catch(() => {});
      continue;
    }
    for (const stale of installed.filter((v) => v !== current)) {
      await rm(versionDir(id, stale), { recursive: true, force: true });
    }
  }
}
