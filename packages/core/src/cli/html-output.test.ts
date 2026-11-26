import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { saveHtmlOutput } from './html-output.ts';

describe('saveHtmlOutput', () => {
  let outDir: string;
  const html = strToU8('<!doctype html><title>Example deck</title>');

  beforeEach(async () => {
    outDir = await mkdtemp(path.join(os.tmpdir(), 'open-slide-html-'));
  });

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  async function save(name: string, bytes: Uint8Array) {
    const staging = await mkdtemp(path.join(outDir, '.staging-'));
    try {
      return await saveHtmlOutput(staging, outDir, 'deck', name, bytes);
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }

  it('creates index.html and an empty assets folder for a bare HTML download', async () => {
    const index = await save('deck.html', html);
    expect(index).toBe(path.join(outDir, 'deck', 'index.html'));
    expect(await readFile(index, 'utf8')).toContain('<title>Example deck</title>');
    expect(await readdir(path.join(outDir, 'deck', 'assets'))).toEqual([]);
  });

  it('removes stale assets on a repeat export', async () => {
    const archive = zipSync({ 'deck.html': html, assets: { 'old.svg': strToU8('<svg/>') } });
    await save('deck.zip', archive);
    const assetsDir = path.join(outDir, 'deck', 'assets');
    expect(await readdir(assetsDir)).toEqual(['old.svg']);

    await save('deck.html', html);
    expect(await readdir(assetsDir)).toEqual([]);
  });

  it('preserves unrelated files in an existing export folder', async () => {
    await save('deck.html', html);
    const customAsset = path.join(outDir, 'deck', 'assets', 'custom.txt');
    await writeFile(customAsset, 'Keep this file.');

    await expect(save('deck.html', html)).rejects.toThrow('Choose a different output directory.');
    expect(await readFile(customAsset, 'utf8')).toBe('Keep this file.');
  });

  it('does not extract archive entries outside the assets folder', async () => {
    const archive = zipSync({ 'deck.html': html, 'assets/../other.txt': strToU8('outside') });
    await expect(save('deck.zip', archive)).rejects.toThrow('Unexpected file in HTML export');
    expect(await readdir(outDir)).toEqual([]);
  });
});
