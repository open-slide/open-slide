// Builds a throwaway open-slide project for screenshots under
// packages/core/e2e/.scratch/docs-shots (gitignored). It never touches
// apps/demo or the user's own decks.
import { cpSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadSharp, repoRoot, scratchDir } from './lib.mjs';

const demo = path.join(repoRoot, 'apps/demo');
const template = path.join(repoRoot, 'packages/cli/template');
const webAssets = path.join(repoRoot, 'apps/web/public/assets');

const DECKS = [
  'fieldwork-fy27-plan',
  'halden-core-launch',
  'northfold-q3-board',
  'pommi-series-b',
  'aero-3-launch',
  'lattice-ship-keynote',
  'selene-4-mission-brief',
  'marlow-investor-day',
];
const LOGOS = ['vercel-light', 'cloudflare', 'claude', 'gemini', 'codex-light', 'cursor-light'];

rmSync(scratchDir, { recursive: true, force: true });
mkdirSync(path.join(scratchDir, 'slides'), { recursive: true });

for (const file of ['open-slide.config.ts', 'tsconfig.json', 'package.json']) {
  cpSync(path.join(demo, file), path.join(scratchDir, file));
}
cpSync(
  path.join(template, 'slides/getting-started'),
  path.join(scratchDir, 'slides/getting-started'),
  {
    recursive: true,
  },
);
for (const deck of DECKS) {
  cpSync(path.join(demo, 'slides', deck), path.join(scratchDir, 'slides', deck), {
    recursive: true,
  });
}
cpSync(path.join(demo, 'themes'), path.join(scratchDir, 'themes'), { recursive: true });
cpSync(path.join(template, 'themes'), path.join(scratchDir, 'themes'), { recursive: true });

// A small deck with an ImagePlaceholder, for the placeholder / Replace… shots.
mkdirSync(path.join(scratchDir, 'slides/q2-launch'), { recursive: true });
writeFileSync(
  path.join(scratchDir, 'slides/q2-launch/index.tsx'),
  `import { ImagePlaceholder, type Page, type SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = { title: 'Q2 Launch' };

const Hero: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#fff', color: '#0a0a0a', fontFamily: 'Inter, -apple-system, sans-serif', padding: '120px 140px', display: 'grid', gridTemplateColumns: '1fr 920px', gap: 96, alignItems: 'center', boxSizing: 'border-box' }}>
    <div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#de3b3d', marginBottom: 36 }}>Q2 · Product</div>
      <h1 style={{ fontSize: 112, lineHeight: 1.02, letterSpacing: '-0.04em', fontWeight: 650, margin: 0 }}>Meet the new dashboard.</h1>
      <p style={{ fontSize: 34, lineHeight: 1.45, color: '#55555a', marginTop: 40 }}>Every metric your team tracks, on one calm screen.</p>
    </div>
    <ImagePlaceholder hint="Product dashboard screenshot" width={920} height={600} />
  </div>
);

export default [Hero] satisfies Page[];
`,
);

// Assets: brand logos plus generated gradient "photos". Never use real
// people's avatars or photos as sample assets.
const globalAssets = path.join(scratchDir, 'assets');
const deckAssets = path.join(scratchDir, 'slides/fieldwork-fy27-plan/assets');
mkdirSync(globalAssets, { recursive: true });
mkdirSync(deckAssets, { recursive: true });
for (const logo of LOGOS) {
  cpSync(path.join(webAssets, `${logo}.svg`), path.join(globalAssets, `${logo}.svg`));
}
for (const logo of LOGOS.slice(0, 4)) {
  cpSync(path.join(webAssets, `${logo}.svg`), path.join(deckAssets, `${logo}.svg`));
}
const sharp = loadSharp();
const images = [
  ['route-map.jpg', '#F8D978', '#E8553B', '#2B4C7E'],
  ['warehouse.jpg', '#C9D6DF', '#52616B', '#1E2022'],
  ['team-offsite.jpg', '#FFE5D9', '#F08A5D', '#6A2C70'],
  ['dashboard.png', '#EEF2FF', '#6366F1', '#111827'],
];
for (const [name, a, b, c] of images) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
    <defs><radialGradient id="g" cx="25%" cy="20%" r="95%">
      <stop offset="0" stop-color="${a}"/><stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>
    </radialGradient></defs>
    <rect width="1600" height="1000" fill="url(#g)"/>
    <circle cx="1180" cy="640" r="260" fill="${a}" opacity="0.35"/>
    <circle cx="420" cy="760" r="160" fill="${c}" opacity="0.25"/>
  </svg>`;
  const img = sharp(Buffer.from(svg));
  await (name.endsWith('.png') ? img.png() : img.jpeg({ quality: 85 })).toFile(
    path.join(deckAssets, name),
  );
}

// Per-entry symlinks (not one symlink for the whole folder) so the dev
// server's node_modules/.open-slide state lands in the scratch copy instead
// of apps/demo.
const nodeModules = path.join(scratchDir, 'node_modules');
mkdirSync(nodeModules);
for (const entry of readdirSync(path.join(demo, 'node_modules'))) {
  if (entry.startsWith('.') && entry !== '.bin') continue;
  symlinkSync(path.join(demo, 'node_modules', entry), path.join(nodeModules, entry), 'junction');
}

console.log(scratchDir);
