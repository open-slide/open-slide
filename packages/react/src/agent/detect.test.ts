import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  entryFromPackageJson,
  findOnPath,
  importWorkspacePackage,
  parseVersion,
  resolveWorkspacePackage,
} from './detect.ts';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'open-slide-detect-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('parseVersion', () => {
  it('extracts the first semver-ish token', () => {
    expect(parseVersion('2.1.300 (Claude Code)')).toBe('2.1.300');
    expect(parseVersion('codex-cli 0.163.0\n')).toBe('0.163.0');
    expect(parseVersion('nope')).toBeNull();
  });
});

describe('entryFromPackageJson', () => {
  it('prefers the root export import condition', () => {
    expect(
      entryFromPackageJson({
        main: 'index.cjs',
        exports: { '.': { types: './sdk.d.ts', default: './sdk.mjs' } },
      }),
    ).toBe('./sdk.mjs');
    expect(
      entryFromPackageJson({
        exports: { '.': { import: './dist/index.js', require: './dist/index.cjs' } },
      }),
    ).toBe('./dist/index.js');
    expect(entryFromPackageJson({ exports: './only.js' })).toBe('./only.js');
    expect(entryFromPackageJson({ exports: { import: './a.js' } })).toBe('./a.js');
  });

  it('falls back to module and main', () => {
    expect(entryFromPackageJson({ module: 'm.js', main: 'c.js' })).toBe('m.js');
    expect(entryFromPackageJson({ main: 'c.js' })).toBe('c.js');
    expect(entryFromPackageJson({})).toBeNull();
  });
});

describe('findOnPath', () => {
  it('finds an executable file in PATH directories', async () => {
    const bin = path.join(dir, 'bin');
    await mkdir(bin);
    const file = path.join(bin, 'fake-cli');
    await writeFile(file, '#!/bin/sh\necho 1.2.3\n');
    await chmod(file, 0o755);
    expect(
      findOnPath('fake-cli', { PATH: `${path.join(dir, 'missing')}${path.delimiter}${bin}` }),
    ).toBe(file);
    expect(findOnPath('other-cli', { PATH: bin })).toBeNull();
    expect(findOnPath('fake-cli', { PATH: '' })).toBeNull();
  });
});

describe('resolveWorkspacePackage', () => {
  it('resolves a package installed in the workspace and imports it', async () => {
    const pkgDir = path.join(dir, 'node_modules', '@scope', 'fake-sdk');
    await mkdir(pkgDir, { recursive: true });
    await writeFile(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({
        name: '@scope/fake-sdk',
        version: '9.9.9',
        type: 'module',
        exports: { '.': { default: './sdk.mjs' } },
      }),
    );
    await writeFile(path.join(pkgDir, 'sdk.mjs'), 'export const hello = "world";\n');
    await writeFile(path.join(dir, 'package.json'), '{"name":"ws"}');

    const resolved = resolveWorkspacePackage(dir, '@scope/fake-sdk');
    expect(resolved).toMatchObject({ version: '9.9.9', entry: path.join(pkgDir, 'sdk.mjs') });
    const mod = await importWorkspacePackage<{ hello: string }>(dir, '@scope/fake-sdk');
    expect(mod?.hello).toBe('world');
  });

  it('returns null when the package is missing', async () => {
    await writeFile(path.join(dir, 'package.json'), '{"name":"ws"}');
    expect(resolveWorkspacePackage(dir, '@scope/nope')).toBeNull();
    expect(await importWorkspacePackage(dir, '@scope/nope')).toBeNull();
  });
});
