import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  compareVersions,
  detectPackageManager,
  type Release,
  sanitizeReleases,
  selectReleases,
  updateCommandFor,
} from './update.ts';

async function tempProject(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-update-'));
}

describe('update routes helpers', () => {
  const originalUserAgent = process.env.npm_config_user_agent;

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
  });

  it('detects package managers from npm user agent first', async () => {
    const cwd = await tempProject();
    await fs.writeFile(path.join(cwd, 'pnpm-lock.yaml'), '');
    process.env.npm_config_user_agent = 'yarn/1.22.22 npm/? node/? darwin x64';

    await expect(detectPackageManager(cwd)).resolves.toBe('yarn');
  });

  it('detects package managers from lockfiles', async () => {
    const cwd = await tempProject();
    delete process.env.npm_config_user_agent;

    await fs.writeFile(path.join(cwd, 'pnpm-lock.yaml'), '');
    await expect(detectPackageManager(cwd)).resolves.toBe('pnpm');

    await fs.rm(path.join(cwd, 'pnpm-lock.yaml'));
    await fs.writeFile(path.join(cwd, 'bun.lock'), '');
    await expect(detectPackageManager(cwd)).resolves.toBe('bun');

    await fs.rm(path.join(cwd, 'bun.lock'));
    await fs.writeFile(path.join(cwd, 'package-lock.json'), '');
    await expect(detectPackageManager(cwd)).resolves.toBe('npm');
  });

  it('finds the lockfile in an ancestor workspace root', async () => {
    const root = await tempProject();
    delete process.env.npm_config_user_agent;
    const cwd = path.join(root, 'packages', 'deck');
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(path.join(root, 'bun.lock'), '');

    await expect(detectPackageManager(cwd)).resolves.toBe('bun');
  });

  it('uses fixed update commands for each package manager', () => {
    expect(updateCommandFor('pnpm')).toEqual({
      cmd: 'pnpm',
      args: ['add', '@open-slide/core@latest'],
    });
    expect(updateCommandFor('yarn')).toEqual({
      cmd: 'yarn',
      args: ['add', '@open-slide/core@latest'],
    });
    expect(updateCommandFor('bun')).toEqual({
      cmd: 'bun',
      args: ['add', '@open-slide/core@latest'],
    });
    expect(updateCommandFor('npm')).toEqual({
      cmd: 'npm',
      args: ['install', '@open-slide/core@latest'],
    });
  });
});

function release(version: string): Release {
  return { version, title: version, image: null, url: null, changes: [] };
}

describe('release notes helpers', () => {
  it('compares semver triples numerically', () => {
    expect(compareVersions('2.10.0', '2.9.3')).toBeGreaterThan(0);
    expect(compareVersions('2.2.0', '2.2.0')).toBe(0);
    expect(compareVersions('1.9.9', '2.0.0')).toBeLessThan(0);
  });

  it('selects releases in (from, to], newest first', () => {
    const releases = ['2.0.0', '2.2.0', '2.1.0', '2.3.0'].map(release);
    expect(selectReleases(releases, '2.0.0', '2.2.0').map((r) => r.version)).toEqual([
      '2.2.0',
      '2.1.0',
    ]);
  });

  it('selects only the target release without a lower bound', () => {
    const releases = ['2.1.0', '2.2.0'].map(release);
    expect(selectReleases(releases, null, '2.1.0').map((r) => r.version)).toEqual(['2.1.0']);
  });

  it('drops malformed entries and non-https links', () => {
    const releases = sanitizeReleases({
      releases: [
        { version: 'next' },
        {
          version: '2.2.0',
          title: '  Comment mode ',
          image: 'javascript:alert(1)',
          url: 'https://github.com/open-slide/open-slide',
          changes: [
            { type: 'minor', text: 'Add comment mode.', pr: 556, author: '1weiho' },
            { type: 'weird', text: 'Fix a thing.', pr: '1', author: '<b>' },
            { type: 'patch', text: '   ' },
          ],
        },
      ],
    });
    expect(releases).toEqual([
      {
        version: '2.2.0',
        title: 'Comment mode',
        image: null,
        url: 'https://github.com/open-slide/open-slide',
        changes: [
          { type: 'minor', text: 'Add comment mode.', pr: 556, author: '1weiho' },
          { type: 'patch', text: 'Fix a thing.', pr: null, author: null },
        ],
      },
    ]);
  });
});
