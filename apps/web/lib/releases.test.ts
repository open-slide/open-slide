import { describe, expect, it } from 'vitest';
import { eras } from './changelog';
import { coreReleases } from './releases';

describe('release notes API', () => {
  it('uses the changelog screenshot as the cover when a release has one', () => {
    const withShot = eras.flatMap((era) => era.releases).filter((release) => release.shot);
    expect(withShot.length).toBeGreaterThan(0);
    for (const release of withShot) {
      const cover = coreReleases.find((r) => r.version === release.version)?.image;
      expect(cover).toMatchObject({
        url: `https://open-slide.dev${release.shot?.src}`,
        width: release.shot?.width,
        height: release.shot?.height,
      });
    }
  });

  it('falls back to the generated cover and links each release to its changelog entry', () => {
    const polish = coreReleases.find((r) => r.version === '2.1.0');
    expect(polish?.image.url).toBe('https://open-slide.dev/og/releases/2.1.0');
    expect(polish?.url).toBe('https://open-slide.dev/changelog#v2.1');
  });

  it('carries patch notes with their release line', () => {
    const agent = coreReleases.find((r) => r.version === '2.3.0');
    expect(agent?.patches.map((p) => p.version)).toContain('2.3.1');
  });
});
