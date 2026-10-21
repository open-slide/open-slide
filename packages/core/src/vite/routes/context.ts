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
  agentEnabled: boolean;
};

export type ApiPluginOptions = {
  userCwd: string;
  slidesDir?: string;
  assetsDir?: string;
  coreVersion: string;
  agentEnabled: boolean;
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
    agentEnabled: opts.agentEnabled,
  };
}

export class BodyTooLargeError extends Error {
  constructor() {
    super('request body too large');
    this.name = 'BodyTooLargeError';
  }
}

export async function readBody(
  req: Connect.IncomingMessage,
  limit = Number.POSITIVE_INFINITY,
): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        req.destroy();
        reject(new BodyTooLargeError());
        return;
      }
      chunks.push(c);
    });
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
