import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { eras, latestVersion } from './changelog';
import { readCoreRelease } from './changelog-source';

const core = readCoreRelease(fileURLToPath(new URL('../../../packages/core/', import.meta.url)));
const UNLISTED = ['0.0.1', '1.0.0'];

const onPage = eras.flatMap((era) =>
  era.releases.flatMap((release) => [
    release.version,
    ...(release.patches ?? []).map((patch) => patch.version),
  ]),
);

// Prereleases fold into the release they led up to, so only stable versions
// need their own line on the page.
const stable = core.versions.filter((version) => !version.includes('-'));

describe('changelog page data', () => {
  it('covers every stable @open-slide/core release', () => {
    const missing = stable.filter((version) => !onPage.includes(version));
    expect(
      missing,
      `Missing from apps/web/lib/changelog.ts: ${missing.join(', ')}. Draft them with the changelog-entry skill.`,
    ).toEqual([]);
  });

  it('only lists versions that were published', () => {
    const unknown = onPage.filter(
      (version) => !stable.includes(version) && !UNLISTED.includes(version),
    );
    expect(unknown).toEqual([]);
  });

  it('lists each version once', () => {
    const repeated = onPage.filter((version, i) => onPage.indexOf(version) !== i);
    expect(repeated).toEqual([]);
  });

  it('marks the published core version as latest', () => {
    expect(latestVersion).toBe(core.version);
  });
});
