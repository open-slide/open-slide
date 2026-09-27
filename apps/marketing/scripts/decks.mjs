import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { prepareScratchProject } from '../../../packages/core/e2e/scratch.mjs';
import { repo, root } from './projects.mjs';

// Pages can show real slides with `<img src="/@deck/<deck>/<page>.png">`.
// The deck is built with the local core and screenshotted at 1920 × 1080.
// Shots are cached under out/.cache/decks/<deck>-<hash of its sources>, so
// they refresh when the deck changes. Run `pnpm core build` first if core's
// dist is stale.
const SOURCES = ['packages/cli/template', 'apps/demo'];
const cacheRoot = path.join(root, 'out/.cache/decks');

const TYPES = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function findDeck(deck) {
  for (const source of SOURCES) {
    const project = path.join(repo, source);
    if (fs.existsSync(path.join(project, 'slides', deck))) return project;
  }
  throw new Error(`no deck "${deck}" in ${SOURCES.map((s) => `${s}/slides`).join(' or ')}`);
}

function hashDir(dir) {
  const hash = createHash('sha1');
  const walk = (d) => {
    for (const e of fs
      .readdirSync(d, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const file = path.join(d, e.name);
      if (e.isDirectory()) walk(file);
      else hash.update(path.relative(dir, file)).update(fs.readFileSync(file));
    }
  };
  walk(dir);
  return hash.digest('hex').slice(0, 10);
}

function build(deck, project) {
  const scratch = prepareScratchProject(`marketing-${deck}`);
  for (const dir of ['slides', 'themes', 'assets']) {
    fs.rmSync(path.join(scratch, dir), { recursive: true, force: true });
  }
  for (const dir of ['themes', 'assets']) {
    const src = path.join(project, dir);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(scratch, dir), { recursive: true });
  }
  fs.cpSync(path.join(project, 'slides', deck), path.join(scratch, 'slides', deck), {
    recursive: true,
  });
  console.log(`building deck ${deck}…`);
  execFileSync('node', [path.join(repo, 'packages/core/bin.js'), 'build'], {
    cwd: scratch,
    env: { ...process.env, OPEN_SLIDE_SKIP_SKILLS_CHECK: '1' },
    stdio: 'pipe',
  });
  return path.join(scratch, 'dist');
}

let browser = null;
let queue = Promise.resolve();
const builds = new Map();
const shots = new Map();

async function capture(deck, dist, n) {
  browser ??= await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
  });
  await page.route('http://deck.test/**', (route) => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = path.join(dist, rel);
    const target =
      fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(dist, 'index.html');
    return route.fulfill({
      body: fs.readFileSync(target),
      contentType: TYPES[path.extname(target)] ?? 'application/octet-stream',
    });
  });
  try {
    await page.goto(`http://deck.test/s/${deck}?p=${n}`);
    await page.waitForTimeout(800);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
    return await page.screenshot();
  } finally {
    await page.close();
  }
}

export function deckShot(deck, n) {
  const project = findDeck(deck);
  const key = `${deck}-${hashDir(path.join(project, 'slides', deck))}`;
  const file = path.join(cacheRoot, key, `${n}.png`);
  if (fs.existsSync(file)) return Promise.resolve(fs.readFileSync(file));
  if (!shots.has(file)) {
    const shot = queue.then(async () => {
      if (!builds.has(key)) {
        if (fs.existsSync(cacheRoot)) {
          for (const old of fs.readdirSync(cacheRoot)) {
            if (old.startsWith(`${deck}-`) && old !== key) {
              fs.rmSync(path.join(cacheRoot, old), { recursive: true, force: true });
            }
          }
        }
        builds.set(key, build(deck, project));
      }
      const png = await capture(deck, builds.get(key), n);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, png);
      return png;
    });
    queue = shot.catch(() => null);
    shots.set(file, shot);
    shot.finally(() => shots.delete(file)).catch(() => null);
  }
  return shots.get(file);
}

export async function closeDecks() {
  await queue;
  await browser?.close();
  browser = null;
}
