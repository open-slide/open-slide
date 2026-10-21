import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import type { Connect } from 'vite';
import { resolveSlideEntry } from '../../editing/slide-ops.ts';
import { foldersManifestPath } from '../../files/folders.ts';

export type ApiContext = {
  userCwd: string;
  slidesDir: string;
  slidesRoot: string;
  globalAssetsRoot: string;
  manifestPath: string;
  coreVersion: string;
};

export type ApiPluginOptions = {
  userCwd: string;
  slidesDir?: string;
  assetsDir?: string;
  coreVersion: string;
};

export function makeContext(opts: ApiPluginOptions): ApiContext {
  const userCwd = opts.userCwd;
  const slidesDir = opts.slidesDir ?? 'slides';
  const assetsDir = opts.assetsDir ?? 'assets';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const globalAssetsRoot = path.resolve(userCwd, assetsDir);
  const manifestPath = foldersManifestPath(slidesRoot);
  return {
    userCwd,
    slidesDir,
    slidesRoot,
    globalAssetsRoot,
    manifestPath,
    coreVersion: opts.coreVersion,
  };
}

export async function readBody(req: Connect.IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

export function resolveSlideEntryPath(ctx: ApiContext, slideId: string): string | null {
  return resolveSlideEntry(ctx.slidesRoot, slideId);
}

export async function readSlideSource(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export const DEFAULT_DECK_FILE = 'index.tsx';

function isDeckSourceName(name: string): boolean {
  return name.endsWith('.tsx') && !name.endsWith('.test.tsx') && !name.endsWith('.d.ts');
}

function isSafeRelativeFile(file: string): boolean {
  if (!file || file.includes('\\') || path.posix.isAbsolute(file) || path.isAbsolute(file)) {
    return false;
  }
  if (file.split('/').some((seg) => seg === '..')) return false;
  return file.endsWith('.tsx');
}

export function isInsideDir(dir: string, file: string): boolean {
  const rel = path.relative(dir, file);
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

export async function resolveDeckFile(
  ctx: ApiContext,
  slideId: string,
  file: string | null | undefined,
): Promise<string | null> {
  const entry = resolveSlideEntryPath(ctx, slideId);
  if (!entry || typeof file !== 'string' || !isSafeRelativeFile(file)) return null;
  const deckDir = path.dirname(entry);
  try {
    const realDeck = await fs.realpath(deckDir);
    const realFile = await fs.realpath(path.join(deckDir, file));
    if (!isInsideDir(realDeck, realFile)) return null;
    const stat = await fs.stat(realFile);
    return stat.isFile() ? realFile : null;
  } catch {
    return null;
  }
}

export async function listDeckFiles(ctx: ApiContext, slideId: string): Promise<string[]> {
  const entry = resolveSlideEntryPath(ctx, slideId);
  if (!entry) return [];
  const deckDir = path.dirname(entry);
  const out: string[] = [];
  async function walk(rel: string): Promise<void> {
    const entries = await fs
      .readdir(path.join(deckDir, rel), { withFileTypes: true })
      .catch(() => []);
    for (const e of entries) {
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') await walk(childRel);
      } else if (e.isFile() && isDeckSourceName(e.name)) {
        out.push(childRel);
      }
    }
  }
  await walk('');
  return out.sort();
}

export function requestedDeckFile(value: unknown): string {
  if (value === undefined || value === null) return DEFAULT_DECK_FILE;
  return typeof value === 'string' ? value : '';
}

export function rejectDeckFile(res: ServerResponse, file: string): void {
  if (file === DEFAULT_DECK_FILE) {
    json(res, 404, { error: 'slide not found' });
    return;
  }
  json(res, 400, {
    error: 'invalid file: the file resolver accepts only existing .tsx files inside the deck',
    failed: `file "${file}" is not a .tsx deck file inside slides/<slideId>/ (relative POSIX path, no "..", no absolute path, must exist)`,
    fixes: [
      'send a deck-relative .tsx path such as "pages/03-team.tsx"',
      'omit file to target index.tsx',
    ],
    verify: 're-send the request and expect HTTP 200',
  });
}
