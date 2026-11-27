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

function release(version: string, patches: string[] = []): Release {
  return {
    version,
    title: version,
    summary: null,
    highlights: [],
    image: null,
    url: null,
    patches: patches.map((v) => ({ version: v, note: `fix in ${v}` })),
  };
}

const versionsOf = (releases: Release[]) =>
  releases.map((r) => [r.version, ...r.patches.map((p) => p.version)]);

describe('release notes helpers', () => {
  it('compares semver triples numerically', () => {
    expect(compareVersions('2.10.0', '2.9.3')).toBeGreaterThan(0);
    expect(compareVersions('2.2.0', '2.2.0')).toBe(0);
    expect(compareVersions('1.9.9', '2.0.0')).toBeLessThan(0);
  });

  it('selects releases in (from, to], newest first', () => {
    const releases = [release('2.0.0'), release('2.2.0'), release('2.1.0'), release('2.3.0')];
    expect(versionsOf(selectReleases(releases, '2.0.0', '2.2.0'))).toEqual([['2.2.0'], ['2.1.0']]);
  });

  it('keeps only the patches that fall inside the range', () => {
    const releases = [release('2.2.0'), release('2.3.0', ['2.3.1', '2.3.2'])];
    expect(versionsOf(selectReleases(releases, '2.2.0', '2.3.1'))).toEqual([['2.3.0', '2.3.1']]);
  });

  it('brings only patch notes from a release line that is already installed', () => {
    const releases = [
      { ...release('2.3.0', ['2.3.1']), summary: 'Agent panel', highlights: ['Draft decks'] },
    ];
    const [selected] = selectReleases(releases, '2.3.0', '2.3.1');
    expect(selected).toMatchObject({ summary: null, highlights: [], image: null });
    expect(selected.patches.map((p) => p.version)).toEqual(['2.3.1']);
  });

  it('selects the release line holding the target without a lower bound', () => {
    const releases = [release('2.1.0'), release('2.2.0', ['2.2.1', '2.2.2'])];
    expect(versionsOf(selectReleases(releases, null, '2.2.1'))).toEqual([['2.2.0', '2.2.1']]);
    expect(versionsOf(selectReleases(releases, null, '2.1.0'))).toEqual([['2.1.0']]);
  });

  it('drops malformed entries and non-https links', () => {
    const releases = sanitizeReleases({
      releases: [
        { version: 'next' },
        {
          version: '2.2.0',
          title: '  Comment mode ',
          summary: '   ',
          highlights: ['Drag a box to comment.', 42, ''],
          image: { url: 'javascript:alert(1)', width: 2000, height: 1274 },
          url: 'https://open-slide.dev/changelog#v2.2',
          patches: [
            { version: '2.2.1', note: 'Fix a thing.' },
            { version: 'x', note: 'nope' },
          ],
        },
        {
          version: '2.3.0',
          image: { url: 'https://open-slide.dev/a.webp', width: 2000, height: 1268, alt: 7 },
        },
      ],
    });
    expect(releases).toEqual([
      {
        version: '2.2.0',
        title: 'Comment mode',
        summary: null,
        highlights: ['Drag a box to comment.'],
        image: null,
        url: 'https://open-slide.dev/changelog#v2.2',
        patches: [{ version: '2.2.1', note: 'Fix a thing.' }],
      },
      {
        version: '2.3.0',
        title: 'v2.3.0',
        summary: null,
        highlights: [],
        image: { url: 'https://open-slide.dev/a.webp', width: 2000, height: 1268, alt: '' },
        url: null,
        patches: [],
      },
    ]);
  });
});
