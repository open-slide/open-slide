import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(here, '../../../..');
export const scratchDir = path.join(repoRoot, 'packages/core/e2e/.scratch/docs-shots');
export const coreBin = path.join(repoRoot, 'packages/core/bin.js');

const coreRequire = createRequire(path.join(repoRoot, 'packages/core/package.json'));

export function loadPlaywright() {
  return coreRequire('@playwright/test');
}

// sharp is not a direct dependency of any workspace package; Next pulls it
// into the pnpm store, so resolve whichever copy is there.
export function loadSharp() {
  const store = path.join(repoRoot, 'node_modules/.pnpm');
  const dir = readdirSync(store).find((name) => name.startsWith('sharp@'));
  if (!dir) throw new Error('sharp not found in node_modules/.pnpm — run pnpm install first.');
  return createRequire(import.meta.url)(path.join(store, dir, 'node_modules/sharp'));
}

export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else {
        flags[key] = next;
        i++;
      }
    } else positional.push(arg);
  }
  return { flags, positional };
}
