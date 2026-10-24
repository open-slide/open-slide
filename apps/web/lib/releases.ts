import { eras } from './changelog';
import { siteUrl } from './shared';

export type ReleaseCover = { url: string; width: number; height: number; alt: string };

export type Release = {
  version: string;
  title: string;
  summary: string | null;
  highlights: string[];
  image: ReleaseCover;
  url: string;
  patches: { version: string; note: string }[];
};

const absolute = (route: string) => new URL(route, siteUrl).toString();

// Releases without a screenshot on the changelog page fall back to the
// generated cover at /og/releases/<version>.
export const coreReleases: Release[] = eras
  .flatMap((era) => era.releases)
  .filter((release) => release.kind !== 'origin')
  .map((release) => ({
    version: release.version,
    title: release.title,
    summary: release.summary ?? null,
    highlights: release.highlights ?? [],
    image: release.shot
      ? {
          url: absolute(release.shot.src),
          width: release.shot.width,
          height: release.shot.height,
          alt: release.shot.alt,
        }
      : { url: absolute(`/og/releases/${release.version}`), width: 1200, height: 500, alt: '' },
    url: absolute(`/changelog#v${release.line}`),
    patches: (release.patches ?? []).map(({ version, note }) => ({ version, note })),
  }));
