import { gitConfig, siteUrl } from './shared';

export type ReleaseChange = {
  type: 'major' | 'minor' | 'patch';
  text: string;
  pr: number | null;
  author: string | null;
};

export type Release = {
  version: string;
  title: string;
  image: string;
  url: string;
  changes: ReleaseChange[];
};

// Curated per-release headline and cover. Releases without an entry get a
// generic title and the generated cover at /og/releases/<version>.
// Drop custom covers in public/releases/ and reference them as `/releases/<file>`.
const highlights: Record<string, { title: string; image?: string }> = {
  '2.2.0': { title: 'Comment mode' },
  '2.1.0': { title: 'Page preview and Español' },
  '2.0.0': { title: 'React 19, Vite 8 and editable PPTX' },
};

const CHANGELOG_URL = `https://raw.githubusercontent.com/${gitConfig.owner}/${gitConfig.repo}/${gitConfig.branch}/packages/core/CHANGELOG.md`;

const SECTION_TYPES: Record<string, ReleaseChange['type']> = {
  'Major Changes': 'major',
  'Minor Changes': 'minor',
  'Patch Changes': 'patch',
};

// "[#556](…) [`92d58d7`](…) Thanks [@1weiho](…)! - Move comments into…"
const ENTRY_PREFIX =
  /^(?:\[#(\d+)\]\([^)]*\)\s*)?(?:\[`[0-9a-f]+`\]\([^)]*\)\s*)?(?:Thanks \[@([\w-]+)\]\([^)]*\)!\s*)?-\s+/;

function parseEntry(raw: string, type: ReleaseChange['type']): ReleaseChange | null {
  const match = ENTRY_PREFIX.exec(raw);
  const body = (match ? raw.slice(match[0].length) : raw).split(/\n\s*\n/)[0];
  const text = body.replace(/\s*\n\s*/g, ' ').trim();
  if (!text || text.startsWith('Updated dependencies')) return null;
  return {
    type,
    text,
    pr: match?.[1] ? Number(match[1]) : null,
    author: match?.[2] ?? null,
  };
}

function releaseUrl(version: string): string {
  const tag = encodeURIComponent(`@open-slide/core@${version}`);
  return `https://github.com/${gitConfig.owner}/${gitConfig.repo}/releases/tag/${tag}`;
}

function fallbackTitle(changes: ReleaseChange[]): string {
  if (changes.some((c) => c.type === 'major')) return 'Major update';
  if (changes.some((c) => c.type === 'minor')) return 'New features';
  return 'Fixes and polish';
}

export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  let current: { version: string; changes: ReleaseChange[] } | null = null;
  let type: ReleaseChange['type'] = 'patch';
  let entry: string | null = null;

  const flushEntry = () => {
    if (current && entry !== null) {
      const change = parseEntry(entry, type);
      if (change) current.changes.push(change);
    }
    entry = null;
  };
  const flushRelease = () => {
    flushEntry();
    if (!current) return;
    const meta = highlights[current.version];
    releases.push({
      version: current.version,
      title: meta?.title ?? fallbackTitle(current.changes),
      image: new URL(meta?.image ?? `/og/releases/${current.version}`, siteUrl).toString(),
      url: releaseUrl(current.version),
      changes: current.changes,
    });
    current = null;
  };

  for (const line of markdown.split('\n')) {
    const heading = /^## (\S+)\s*$/.exec(line)?.[1];
    if (heading) {
      flushRelease();
      // Prereleases never reach the npm `latest` tag the in-app updater installs.
      current = /^\d+\.\d+\.\d+$/.test(heading) ? { version: heading, changes: [] } : null;
      continue;
    }
    const section = /^### (.+?)\s*$/.exec(line)?.[1];
    if (section) {
      flushEntry();
      type = SECTION_TYPES[section] ?? 'patch';
      continue;
    }
    if (!current) continue;
    if (line.startsWith('- ')) {
      flushEntry();
      entry = line.slice(2);
    } else if (entry !== null && (line.startsWith('  ') || line.trim() === '')) {
      entry += `\n${line}`;
    }
  }
  flushRelease();
  return releases;
}

export async function getCoreReleases(): Promise<Release[]> {
  const res = await fetch(CHANGELOG_URL, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`changelog ${res.status}`);
  return parseChangelog(await res.text());
}
