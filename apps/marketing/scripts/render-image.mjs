import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { closeDecks } from './decks.mjs';
import { ensureFonts } from './fonts.mjs';
import { loadImage, outDir, repo, root } from './projects.mjs';
import { gitInfo, parseRenderArgs, timestamp } from './render-kit.mjs';
import { serve } from './serve.mjs';

const { values: flags, positionals } = parseRenderArgs();
const image = await loadImage(positionals[0]);
const scale = Number(flags.scale ?? 1);
const only = flags.only?.split(',');
const outputs = only ? image.outputs.filter((o) => only.includes(o.name)) : image.outputs;
if (!outputs.length) {
  throw new Error(`no outputs match --only ${flags.only} (${image.outputs.map((o) => o.name)})`);
}

const started = Date.now();
const stamp = timestamp();
const workDir = path.join(root, 'out/.work', image.id);
const progressFile = path.join(workDir, 'progress.json');
fs.mkdirSync(workDir, { recursive: true });
fs.mkdirSync(outDir(image.id, 'renders'), { recursive: true });
process.on('exit', () => fs.rmSync(progressFile, { force: true }));

await ensureFonts();
if (image.fonts.length) await ensureFonts(image.id, image.fonts);
const server = await serve(root);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
});

for (const [i, o] of outputs.entries()) {
  const width = Math.round(o.width * scale);
  const height = Math.round(o.height * scale);
  const name = `${o.name}-${stamp}.png`;
  fs.writeFileSync(
    progressFile,
    JSON.stringify({ name, frames: i, total: outputs.length, unit: 'images', width, height }),
  );
  const t0 = Date.now();
  const page = await browser.newPage({
    viewport: { width: o.width, height: o.height },
    deviceScaleFactor: scale,
  });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(`${base}/images/${image.id}/${image.page}?render`, {
    waitUntil: 'domcontentloaded',
  });
  // Pages that build themselves asynchronously set `window.__ready = false`
  // up front and `true` once they're done.
  await page.waitForFunction(
    () => window.__ready !== false && [...document.images].every((img) => img.complete),
    null,
    { timeout: 180_000 },
  );
  const broken = await page.evaluate(() => [
    ...new Set([...document.images].filter((img) => !img.naturalWidth).map((img) => img.src)),
  ]);
  if (broken.length) throw new Error(`images failed to load: ${broken.join(', ')}`);
  await page.evaluate(() => document.fonts.ready);
  const file = outDir(image.id, 'renders', name);
  await page.screenshot({ path: file });
  await page.close();

  const publish = o.publish && !flags['no-publish'] ? o.publish : null;
  if (publish) fs.copyFileSync(file, path.join(repo, publish));
  fs.writeFileSync(
    file.replace(/\.png$/, '.json'),
    `${JSON.stringify(
      {
        image: image.id,
        title: image.title,
        name: o.name,
        createdAt: new Date().toISOString(),
        width,
        height,
        scale,
        publish,
        renderSeconds: Math.round((Date.now() - t0) / 1000),
        git: gitInfo(),
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `${width}×${height} → ${path.relative(process.cwd(), file)}${publish ? `, ${publish}` : ''}`,
  );
}

await browser.close();
await closeDecks();
server.close();
console.log(`rendered ${outputs.length} in ${Math.round((Date.now() - started) / 1000)}s`);
