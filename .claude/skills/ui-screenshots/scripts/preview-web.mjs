// Checks how screenshots sit on the real site without a dev server: builds a
// static export of apps/web in a scratch copy and shoots a route full-page,
// sliced into readable sections.
//
//   node preview-web.mjs --route /docs/core-feature/inspector --out <dir>
//     [--width 1440] [--dark] [--skip-build] [--click <selector>]
//
// The scratch copy drops routes that can't export statically (docs search,
// OG images, llms). /docs pages are kept only when --keep-docs is passed,
// since they make the build slower.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { loadPlaywright, loadSharp, parseArgs, repoRoot } from './lib.mjs';

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.route || !flags.out) {
  console.error('usage: node preview-web.mjs --route <path> --out <dir> [--width 1440] [--dark]');
  process.exit(1);
}

const web = path.join(repoRoot, 'apps/web');
const dir = path.join(repoRoot, 'packages/core/e2e/.scratch/web-preview');
const out = path.join(dir, 'out');
const shotsDir = path.resolve(flags.out);
mkdirSync(shotsDir, { recursive: true });

if (!flags['skip-build'] || !existsSync(out)) {
  rmSync(dir, { recursive: true, force: true });
  cpSync(web, dir, {
    recursive: true,
    filter: (src) =>
      !['node_modules', '.next', '.turbo', 'out', 'tsconfig.tsbuildinfo'].includes(
        path.basename(src),
      ),
  });
  symlinkSync(path.join(web, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  const drop = [
    'proxy.ts',
    'app/api',
    'app/og',
    'app/llms.txt',
    'app/llms-full.txt',
    'app/llms.mdx',
  ];
  drop.push('app/robots.ts', 'app/sitemap.ts');
  if (!flags['keep-docs']) drop.push('app/docs');
  for (const rel of drop) rmSync(path.join(dir, rel), { recursive: true, force: true });
  writeFileSync(
    path.join(dir, 'next.config.mjs'),
    `import { createMDX } from 'fumadocs-mdx/next';
export default createMDX()({ reactStrictMode: true, output: 'export', images: { unoptimized: true } });
`,
  );
  const github = path.join(dir, 'lib/github.ts');
  if (existsSync(github)) {
    writeFileSync(
      github,
      readFileSync(github, 'utf8').replace('next: { revalidate: 3600 },', "cache: 'force-cache',"),
    );
  }
  execFileSync(path.join(dir, 'node_modules/.bin/next'), ['build'], { cwd: dir, stdio: 'inherit' });
}

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};
const resolveFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  return [
    path.join(out, clean),
    path.join(out, `${clean}.html`),
    path.join(out, clean, 'index.html'),
  ].find((c) => existsSync(c) && statSync(c).isFile());
};

const { chromium } = loadPlaywright();
const width = Number(flags.width ?? 1440);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height: 900 } });
if (flags.dark) await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
await context.route('http://osd.test/**', (route) => {
  const file = resolveFile(new URL(route.request().url()).pathname);
  if (!file) return route.fulfill({ status: 404, body: 'not found' });
  route.fulfill({
    body: readFileSync(file),
    contentType: types[path.extname(file)] ?? 'application/octet-stream',
  });
});
const page = await context.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`http://osd.test${flags.route}`);
await page.waitForTimeout(1200);

// Scroll through once so [data-reveal] elements and lazy images settle.
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 600) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(120);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1600);

const name = `${flags.route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'}-${flags.dark ? 'dark' : 'light'}-${width}`;
const full = path.join(shotsDir, `${name}.png`);
await page.screenshot({ path: full, fullPage: true });

if (typeof flags.click === 'string') {
  const target = page.locator(flags.click).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await target.click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(shotsDir, `${name}-clicked.png`) });
}
await browser.close();

const sharp = loadSharp();
const { height } = await sharp(full).metadata();
const SLICE = 2200;
for (let top = 0, i = 0; top < height; top += SLICE, i++) {
  const file = full.replace(/\.png$/, `-${String(i).padStart(2, '0')}.png`);
  await sharp(full)
    .extract({ left: 0, top, width, height: Math.min(SLICE, height - top) })
    .toFile(file);
  console.log(file);
}
