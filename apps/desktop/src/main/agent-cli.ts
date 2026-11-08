import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';
import { app, net } from 'electron';
import type { AgentId } from '../shared/types';
import { run } from './process';
import { modulesDir } from './workspace';

const REGISTRY = 'https://registry.npmjs.org';
const EXTRACT_TIMEOUT_MS = 5 * 60 * 1000;
const PROGRESS_INTERVAL_MS = 100;
const EXE = process.platform === 'win32' ? '.exe' : '';

const CODEX_TRIPLES: Record<string, string> = {
  'darwin-arm64': 'aarch64-apple-darwin',
  'darwin-x64': 'x86_64-apple-darwin',
  'linux-arm64': 'aarch64-unknown-linux-musl',
  'linux-x64': 'x86_64-unknown-linux-musl',
  'win32-arm64': 'aarch64-pc-windows-msvc',
  'win32-x64': 'x86_64-pc-windows-msvc',
};

type CliSpec = {
  command: string;
  sdkPackage: string;
  // The SDK dependency whose optionalDependencies pin the per-platform CLI
  // build, when the SDK does not pin it itself.
  pinnedBy?: string;
  platformPackage: string;
  // Where the executable and its helpers sit inside the extracted tarball.
  binDirs: (root: string) => string[];
};

const PLATFORM = `${process.platform}-${process.arch}`;

const SPECS: Record<AgentId, CliSpec> = {
  claude: {
    command: 'claude',
    sdkPackage: '@anthropic-ai/claude-agent-sdk',
    platformPackage: `@anthropic-ai/claude-agent-sdk-${PLATFORM}`,
    binDirs: (root) => [root],
  },
  codex: {
    command: 'codex',
    sdkPackage: '@openai/codex-sdk',
    pinnedBy: '@openai/codex',
    platformPackage: `@openai/codex-${PLATFORM}`,
    binDirs: (root) => {
      const vendor = path.join(root, 'vendor', CODEX_TRIPLES[PLATFORM] ?? PLATFORM);
      // Codex shells out to the ripgrep it ships next to itself.
      return [path.join(vendor, 'bin'), path.join(vendor, 'codex-path')];
    },
  },
};

type Pin = { name: string; version: string };

export type DownloadProgress = { received: number; total: number | null };

function agentsRoot(): string {
  return path.join(app.getPath('userData'), 'agents');
}

function readJson(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Node's lookup without require.resolve, which refuses package.json for
// packages whose exports leave it out. pnpm keeps a package's dependencies
// next to it in the store, so the walk starts from its real directory.
function findPackageJson(fromDir: string, name: string): string | null {
  let dir = realpathSync(fromDir);
  while (true) {
    const candidate = path.join(dir, 'node_modules', name, 'package.json');
    if (path.basename(dir) !== 'node_modules' && existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// The SDK ships without its native CLI; the exact build it expects is the one
// its package pins for this platform.
function pin(spec: CliSpec): Pin | null {
  const sdkDir = path.join(modulesDir(), spec.sdkPackage);
  if (!existsSync(path.join(sdkDir, 'package.json'))) return null;
  const pinnedByJson = spec.pinnedBy
    ? findPackageJson(sdkDir, spec.pinnedBy)
    : path.join(sdkDir, 'package.json');
  if (!pinnedByJson) return null;
  const optional = readJson(pinnedByJson)?.optionalDependencies as
    | Record<string, string>
    | undefined;
  const range = optional?.[spec.platformPackage];
  if (!range) return null;
  const alias = /^npm:(.+)@([^@]+)$/.exec(range);
  return alias
    ? { name: alias[1], version: alias[2] }
    : { name: spec.platformPackage, version: range };
}

function versionDir(id: AgentId, version: string): string {
  return path.join(agentsRoot(), id, version);
}

function packageRoot(id: AgentId, version: string): string {
  return path.join(versionDir(id, version), 'package');
}

function executable(id: AgentId, version: string): string {
  const spec = SPECS[id];
  return path.join(spec.binDirs(packageRoot(id, version))[0], spec.command + EXE);
}

function installedVersions(id: AgentId): string[] {
  const dir = path.join(agentsRoot(), id);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.') && existsSync(executable(id, name)))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

export function canInstallCli(id: AgentId): boolean {
  return pin(SPECS[id]) !== null;
}

export function isManagedCli(file: string): boolean {
  return file.startsWith(agentsRoot() + path.sep);
}

// Directories to append to every child's PATH. The pinned version is listed
// even before it exists, so a CLI downloaded mid-session is found by servers
// that are already running; until then an older download stands in.
export function managedCliDirs(): string[] {
  return (Object.keys(SPECS) as AgentId[]).flatMap((id) => {
    const current = pin(SPECS[id])?.version;
    const versions = current ? [current] : [];
    const fallback = installedVersions(id).find((v) => v !== current);
    if (fallback && !(current && existsSync(executable(id, current)))) versions.push(fallback);
    return versions.flatMap((v) => SPECS[id].binDirs(packageRoot(id, v)));
  });
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

async function download(
  id: AgentId,
  signal: AbortSignal,
  onProgress: (progress: DownloadProgress) => void,
) {
  const target = pin(SPECS[id]);
  if (!target) throw new Error(`No ${SPECS[id].command} build is available for ${PLATFORM}.`);
  if (existsSync(executable(id, target.version))) return;

  const metaUrl = `${REGISTRY}/${target.name.replace('/', '%2f')}/${encodeURIComponent(target.version)}`;
  const metaRes = await net.fetch(metaUrl, { signal });
  if (!metaRes.ok) throw new Error(`Registry responded ${metaRes.status} for ${target.name}.`);
  const dist = ((await metaRes.json()) as { dist?: { tarball?: string; integrity?: string } }).dist;
  const expected = dist?.integrity?.startsWith('sha512-') ? dist.integrity.slice(7) : null;
  if (!dist?.tarball || !expected) throw new Error(`Registry has no checksum for ${target.name}.`);

  const agentDir = path.join(agentsRoot(), id);
  const tarball = path.join(agentDir, `.${target.version}.tgz`);
  const staging = path.join(agentDir, `.${target.version}.partial`);
  await mkdir(agentDir, { recursive: true });
  await rm(staging, { recursive: true, force: true });

  try {
    const res = await net.fetch(dist.tarball, { signal });
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
      createWriteStream(tarball),
      { signal },
    );
    onProgress({ received, total });
    if (hash.digest('base64') !== expected) {
      throw new Error(`The downloaded ${target.name} failed its checksum.`);
    }

    await mkdir(staging, { recursive: true });
    const tar =
      process.platform === 'win32'
        ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe')
        : 'tar';
    const extract = run(tar, ['-xzf', tarball, '-C', staging], {
      cwd: agentDir,
      env: process.env,
      timeoutMs: EXTRACT_TIMEOUT_MS,
    });
    signal.addEventListener('abort', () => extract.child.kill(), { once: true });
    const { code, output } = await extract.done;
    if (signal.aborted) throw signal.reason;
    if (code !== 0) throw new Error(output.trim() || `tar exited with code ${code}`);

    await rm(versionDir(id, target.version), { recursive: true, force: true });
    await rename(staging, versionDir(id, target.version));
    if (!existsSync(executable(id, target.version))) {
      throw new Error(`${target.name} did not contain a ${SPECS[id].command} executable.`);
    }
  } finally {
    await rm(tarball, { force: true });
    await rm(staging, { recursive: true, force: true });
  }
}

// Drops downloads the bundled SDK has moved past, and refreshes a stale one in
// the background so the agent keeps matching its SDK across app updates.
export async function syncManagedClis() {
  for (const id of Object.keys(SPECS) as AgentId[]) {
    const current = pin(SPECS[id])?.version;
    if (!current) continue;
    const installed = installedVersions(id);
    if (installed.length === 0) continue;
    if (installed.includes(current)) {
      for (const stale of installed.filter((v) => v !== current)) {
        await rm(versionDir(id, stale), { recursive: true, force: true });
      }
    } else {
      void installCli(id, () => {}).catch(() => {});
    }
  }
}
