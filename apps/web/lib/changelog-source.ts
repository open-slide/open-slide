import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Published before changesets started writing CHANGELOG.md: 0.0.1–0.0.16 and 1.0.0.
const UNLISTED_RELEASES = 17;

export function parseChangelogVersions(markdown: string): string[] {
  return [...markdown.matchAll(/^## (\d+\.\d+\.\d+(?:-[\w.]+)?)\s*$/gm)].map((match) => match[1]);
}

export function readCoreRelease(coreDir: string) {
  const versions = parseChangelogVersions(readFileSync(path.join(coreDir, 'CHANGELOG.md'), 'utf8'));
  const { version } = JSON.parse(readFileSync(path.join(coreDir, 'package.json'), 'utf8')) as {
    version: string;
  };
  return { versions, version, releaseCount: versions.length + UNLISTED_RELEASES };
}

// Walk up from wherever `next build` runs (apps/web locally and on Vercel)
// to the repo root rather than assuming a fixed depth.
function findCoreDir(from: string): string {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'packages/core');
    if (existsSync(path.join(candidate, 'CHANGELOG.md'))) return candidate;
    if (path.dirname(dir) === dir) throw new Error(`packages/core not found above ${from}`);
  }
}

export const coreDir = findCoreDir(process.cwd());
