import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AGENT_MODULES_ENV } from '../supervision.ts';
import {
  commandVersion,
  entryFromPackageJson,
  findOnPath,
  importAgentPackage,
  parseVersion,
  resolveAgentPackage,
  resolveWorkspacePackage,
  versionAtLeast,
  versionSpawnSpec,
} from './detect.ts';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'open-slide-detect-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('versionAtLeast', () => {
  it('compares numeric parts rather than strings', () => {
    expect(versionAtLeast('0.2.91', '0.2.91')).toBe(true);
    expect(versionAtLeast('0.2.100', '0.2.91')).toBe(true);
    expect(versionAtLeast('0.3.0', '0.2.91')).toBe(true);
    expect(versionAtLeast('0.2.90', '0.2.91')).toBe(false);
    expect(versionAtLeast('2.1.91-beta.1', '2.1.91')).toBe(true);
  });

  it('treats a missing or unreadable version as too old', () => {
    expect(versionAtLeast(null, '0.2.91')).toBe(false);
    expect(versionAtLeast('next', '0.2.91')).toBe(false);
  });
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

describe('versionSpawnSpec', () => {
  it('spawns directly, and only routes Windows batch shims through a shell', () => {
    expect(versionSpawnSpec('/usr/bin/claude', false)).toEqual({
      file: '/usr/bin/claude',
      args: ['--version'],
    });
    expect(versionSpawnSpec('C:\\Tools\\claude.exe', true)).toEqual({
      file: 'C:\\Tools\\claude.exe',
      args: ['--version'],
    });
    const batch = versionSpawnSpec('C:\\Tools\\claude.cmd', true);
    expect(batch).toEqual({ file: '"C:\\Tools\\claude.cmd" --version', args: [], shell: true });
    expect(versionSpawnSpec('C:\\Tools\\claude.cmd', false)).toEqual({
      file: 'C:\\Tools\\claude.cmd',
      args: ['--version'],
    });
  });
});

describe('commandVersion', () => {
  it('runs the CLI and parses its version output', async () => {
    const bin = path.join(dir, 'bin');
    await mkdir(bin);
    // On Windows a .cmd shim, which also covers the batch-through-shell path.
    const windows = process.platform === 'win32';
    const file = path.join(bin, windows ? 'fake-cli.cmd' : 'fake-cli');
    await writeFile(
      file,
      windows ? '@echo fake-cli 4.5.6\r\n' : '#!/bin/sh\n echo fake-cli 4.5.6 \n',
    );
    await chmod(file, 0o755);
    expect(await commandVersion(file)).toBe('4.5.6');
  });
});

describe('findOnPath', () => {
  const exe = process.platform === 'win32' ? '.exe' : '';

  it('finds an executable file in PATH directories', async () => {
    const bin = path.join(dir, 'bin');
    await mkdir(bin);
    const file = path.join(bin, `fake-cli${exe}`);
    await writeFile(file, '#!/bin/sh\necho 1.2.3\n');
    await chmod(file, 0o755);
    expect(
      findOnPath('fake-cli', { PATH: `${path.join(dir, 'missing')}${path.delimiter}${bin}` }),
    ).toBe(file);
    expect(findOnPath('other-cli', { PATH: bin })).toBeNull();
    expect(findOnPath('fake-cli', { PATH: '' })).toBeNull();
  });

  it('keeps searching past a candidate it is told to skip', async () => {
    const first = path.join(dir, 'first');
    const second = path.join(dir, 'second');
    await mkdir(first);
    await mkdir(second);
    await writeFile(path.join(first, `fake-cli${exe}`), '');
    await writeFile(path.join(second, `fake-cli${exe}`), '');
    const env = { PATH: `${first}${path.delimiter}${second}` };
    expect(findOnPath('fake-cli', env, (file) => !file.startsWith(first))).toBe(
      path.join(second, `fake-cli${exe}`),
    );
    expect(findOnPath('fake-cli', env, () => false)).toBeNull();
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
    const mod = await importAgentPackage<{ hello: string }>(dir, '@scope/fake-sdk');
    expect(mod?.hello).toBe('world');
  });

  it('returns null when the package is missing', async () => {
    await writeFile(path.join(dir, 'package.json'), '{"name":"ws"}');
    expect(resolveWorkspacePackage(dir, '@scope/nope')).toBeNull();
    expect(await importAgentPackage(dir, '@scope/nope')).toBeNull();
  });
});

describe('resolveAgentPackage', () => {
  const writeFakeSdk = async (root: string, version: string) => {
    const pkgDir = path.join(root, '@scope', 'fake-sdk');
    await mkdir(pkgDir, { recursive: true });
    await writeFile(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@scope/fake-sdk', version, main: 'index.js' }),
    );
    return pkgDir;
  };

  it('falls back to the host-provided node_modules', async () => {
    const workspace = path.join(dir, 'ws');
    await mkdir(workspace);
    const hostDir = await writeFakeSdk(path.join(dir, 'host', 'node_modules'), '1.0.0');
    const env = {
      [AGENT_MODULES_ENV]: `${path.join(dir, 'missing')}${path.delimiter}${path.join(dir, 'host', 'node_modules')}`,
    };
    expect(resolveAgentPackage(workspace, '@scope/fake-sdk', env)).toMatchObject({
      dir: hostDir,
      version: '1.0.0',
    });
    expect(resolveAgentPackage(workspace, '@scope/fake-sdk', {})).toBeNull();
  });

  it("prefers the workspace's own copy", async () => {
    await writeFakeSdk(path.join(dir, 'node_modules'), '2.0.0');
    await writeFakeSdk(path.join(dir, 'host', 'node_modules'), '1.0.0');
    const env = { [AGENT_MODULES_ENV]: path.join(dir, 'host', 'node_modules') };
    expect(resolveAgentPackage(dir, '@scope/fake-sdk', env)?.version).toBe('2.0.0');
  });
});
