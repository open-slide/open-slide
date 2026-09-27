import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findViteDeclaration, findViteMismatch, formatViteMismatch } from './preflight.ts';

let root: string;

function addPackage(rel: string, version: string): void {
  const dir = path.join(root, 'node_modules', rel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: rel, version }));
}

function coreDir(): string {
  const dir = path.join(root, 'node_modules', '@open-slide', 'core', 'dist', 'cli');
  mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'open-slide-preflight-'));
  addPackage('@open-slide/core', '2.0.0');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('findViteMismatch', () => {
  it('flags a hoisted plugin that resolves a different vite than core', () => {
    addPackage('vite', '5.4.21');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');

    const mismatch = findViteMismatch(coreDir());
    expect(mismatch).not.toBeNull();
    expect(mismatch?.consumer).toBe('@vitejs/plugin-react');
    expect(mismatch?.coreVite.version).toBe('8.2.2');
    expect(mismatch?.consumerVite.version).toBe('5.4.21');
  });

  it('passes when the plugin is nested next to core vite', () => {
    addPackage('vite', '5.4.21');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');
    addPackage('@open-slide/core/node_modules/@vitejs/plugin-react', '6.1.1');

    expect(findViteMismatch(coreDir())).toBeNull();
  });

  it('passes when everything is hoisted onto a single vite', () => {
    addPackage('vite', '8.2.2');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@tailwindcss/vite', '4.3.3');

    expect(findViteMismatch(coreDir())).toBeNull();
  });

  it('passes when two copies of the same vite version coexist', () => {
    addPackage('vite', '8.2.2');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');

    expect(findViteMismatch(coreDir())).toBeNull();
  });

  it('checks every consumer, not just the first', () => {
    addPackage('vite', '5.4.21');
    addPackage('@tailwindcss/vite', '4.3.3');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');
    addPackage('@open-slide/core/node_modules/@vitejs/plugin-react', '6.1.1');

    expect(findViteMismatch(coreDir())?.consumer).toBe('@tailwindcss/vite');
  });

  it('passes when vite cannot be located at all', () => {
    expect(findViteMismatch(coreDir())).toBeNull();
  });
});

describe('findViteDeclaration', () => {
  function writeManifest(rel: string, manifest: object): string {
    const dir = path.join(root, rel);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest));
    return dir;
  }

  it('finds vite in the current package', () => {
    const dir = writeManifest('app', { devDependencies: { vite: '^5.0.0' } });
    expect(findViteDeclaration(dir)).toEqual({
      file: path.join(dir, 'package.json'),
      field: 'devDependencies',
    });
  });

  it('finds vite in a parent workspace root', () => {
    writeManifest('.', { dependencies: { vite: '^5.0.0' } });
    const dir = writeManifest('packages/deck', { dependencies: { '@open-slide/core': '2.0.0' } });
    expect(findViteDeclaration(dir)?.file).toBe(path.join(root, 'package.json'));
  });

  it('prefers the install root over a nearer declaration', () => {
    writeManifest('.', { devDependencies: { vite: '^5.0.0' } });
    const dir = writeManifest('packages/deck', { devDependencies: { vite: '^8.0.0' } });
    expect(findViteDeclaration(dir, root)?.file).toBe(path.join(root, 'package.json'));
  });

  it('falls back to a nested declaration hoisted into the install root', () => {
    writeManifest('.', { private: true });
    const dir = writeManifest('packages/deck', { devDependencies: { vite: '^5.0.0' } });
    expect(findViteDeclaration(dir, root)?.file).toBe(path.join(dir, 'package.json'));
  });

  it('does not look above the install root', () => {
    writeManifest('.', { devDependencies: { vite: '^5.0.0' } });
    const installRoot = writeManifest('project', { private: true });
    const dir = writeManifest('project/deck', { private: true });
    expect(findViteDeclaration(dir, installRoot)).toBeNull();
  });

  it('returns null when nothing lists vite', () => {
    const dir = writeManifest('app', { dependencies: { '@open-slide/core': '2.0.0' } });
    expect(findViteDeclaration(dir)).toBeNull();
  });
});

describe('formatViteMismatch', () => {
  function mismatch() {
    addPackage('vite', '5.4.21');
    addPackage('@vitejs/plugin-react', '6.1.1');
    addPackage('@open-slide/core/node_modules/vite', '8.2.2');
    const found = findViteMismatch(coreDir());
    if (!found) throw new Error('expected a mismatch');
    return found;
  }

  it('tells the user to remove the declared vite with their package manager', () => {
    const message = stripVTControlCharacters(
      formatViteMismatch(mismatch(), {
        cwd: root,
        packageManager: 'bun',
        declaration: { file: path.join(root, 'package.json'), field: 'devDependencies' },
      }),
    );

    expect(message).toContain('Remove vite from your package.json');
    expect(message).toContain('devDependencies in package.json still lists vite');
    expect(message).toContain('shadows the vite@8.2.2 bundled with open-slide');
    expect(message).toContain('is loading vite@5.4.21');
    expect(message).toContain(path.join('node_modules', 'vite'));
    expect(message).toContain('$ bun remove vite');
    expect(message).toContain('migrate-to-v2');
  });

  it('cds into the workspace root when vite is declared there', () => {
    const cwd = path.join(root, 'packages', 'deck');
    const message = stripVTControlCharacters(
      formatViteMismatch(mismatch(), {
        cwd,
        packageManager: 'npm',
        declaration: { file: path.join(root, 'package.json'), field: 'dependencies' },
      }),
    );

    expect(message).toContain(`$ cd ${path.join('..', '..')} && npm uninstall vite`);
  });

  it('falls back to a reinstall when no package.json lists vite', () => {
    const message = stripVTControlCharacters(
      formatViteMismatch(mismatch(), { cwd: root, packageManager: 'pnpm' }),
    );

    expect(message).toContain('Conflicting vite versions');
    expect(message).toContain('$ pnpm install');
  });
});
