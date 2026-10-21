import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isInsideDir, listDeckFiles, makeContext, resolveDeckFile } from './context.ts';

async function tempDeck() {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-deck-'));
  const deck = path.join(cwd, 'slides', 'demo');
  await fs.mkdir(path.join(deck, 'pages'), { recursive: true });
  await fs.writeFile(path.join(deck, 'index.tsx'), 'export default [];\n');
  await fs.writeFile(path.join(deck, 'pages', '01-a.tsx'), 'export const A = 1;\n');
  await fs.writeFile(path.join(deck, 'pages', '01-a.test.tsx'), '');
  await fs.writeFile(path.join(deck, 'util.ts'), '');
  await fs.writeFile(path.join(cwd, 'outside.tsx'), '');
  const ctx = makeContext({ userCwd: cwd, coreVersion: '0.0.0' });
  return { cwd, deck, ctx };
}

describe('resolveDeckFile', () => {
  it('resolves file inside deck', async () => {
    const { deck, ctx } = await tempDeck();
    const real = await fs.realpath(deck);
    await expect(resolveDeckFile(ctx, 'demo', 'index.tsx')).resolves.toBe(
      path.join(real, 'index.tsx'),
    );
    await expect(resolveDeckFile(ctx, 'demo', 'pages/01-a.tsx')).resolves.toBe(
      path.join(real, 'pages', '01-a.tsx'),
    );
    await expect(listDeckFiles(ctx, 'demo')).resolves.toEqual(['index.tsx', 'pages/01-a.tsx']);
  });

  it('rejects escapes', async () => {
    const { cwd, deck, ctx } = await tempDeck();
    await fs.symlink(path.join(cwd, 'outside.tsx'), path.join(deck, 'link.tsx'));
    for (const file of [
      '../../outside.tsx',
      'pages/../../../outside.tsx',
      path.join(cwd, 'outside.tsx'),
      'pages\\01-a.tsx',
      'link.tsx',
      'util.ts',
      'pages/missing.tsx',
      '',
    ]) {
      await expect(resolveDeckFile(ctx, 'demo', file)).resolves.toBeNull();
    }
    await expect(resolveDeckFile(ctx, '../demo', 'index.tsx')).resolves.toBeNull();
    await expect(resolveDeckFile(ctx, 'demo', undefined)).resolves.toBeNull();
  });
});

describe('isInsideDir', () => {
  it('accepts a file under the filesystem root', () => {
    expect(
      isInsideDir(
        path.parse(process.cwd()).root,
        path.join(path.parse(process.cwd()).root, 'a.tsx'),
      ),
    ).toBe(true);
  });

  it('rejects the directory itself and paths outside it', () => {
    expect(isInsideDir('/deck', '/deck')).toBe(false);
    expect(isInsideDir('/deck', '/other/a.tsx')).toBe(false);
    expect(isInsideDir('/deck', '/deck-2/a.tsx')).toBe(false);
  });
});
