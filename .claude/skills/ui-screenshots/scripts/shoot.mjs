// Captures dev-UI states and composes them into framed webp images.
//
//   node shoot.mjs <shots.mjs> --out <dir> [--port 43219] [--only name,name]
//
// <shots.mjs> default-exports an array of shot definitions; see
// shots.example.mjs for the full shape and working recipes.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPlaywright, loadSharp, parseArgs, scratchDir } from './lib.mjs';

const { flags, positional } = parseArgs(process.argv.slice(2));
const [shotsFile] = positional;
if (!shotsFile || !flags.out) {
  console.error('usage: node shoot.mjs <shots.mjs> --out <dir> [--port 43219] [--only a,b]');
  process.exit(1);
}

const base = `http://127.0.0.1:${flags.port ?? 43219}`;
const outDir = path.resolve(flags.out);
const rawDir = path.join(scratchDir, '.raw');
const only = typeof flags.only === 'string' ? flags.only.split(',') : [];
mkdirSync(outDir, { recursive: true });
mkdirSync(rawDir, { recursive: true });

const shots = (await import(pathToFileURL(path.resolve(shotsFile)).href)).default;
const { chromium } = loadPlaywright();
const sharp = loadSharp();

// The look: a 1000-css-px stage rendered at 2x (2000px wide), soft warm-gray
// gradient, the app as a rounded window with a layered shadow. Crop edges
// that touch the viewport get PAD of breathing room; edges that cut through
// the UI bleed off the stage, which is what makes a crop read as a detail of
// a real window rather than a pasted rectangle.
const STAGE_W = 1000;
const PAD = 56;
const UI_DPR = 3;
const OUT_DPR = 2;

const browser = await chromium.launch();

async function capture(shot) {
  const viewport = shot.viewport ?? { width: 1280, height: 800 };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: UI_DPR,
    reducedMotion: 'reduce',
    baseURL: base,
    colorScheme: 'light',
  });
  if (shot.init) await context.addInitScript(shot.init);
  if (shot.routes) await shot.routes(context);
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log(`[${shot.name}] pageerror`, e.message));
  const openSlide = async (id, query = '') => {
    await page.goto(`/s/${id}${query}`);
    await page.locator('main[data-inspector-root]').waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500);
  };
  const target = (await shot.setup({ page, context, openSlide })) ?? page;
  await target.waitForTimeout(shot.settle ?? 700);
  // Park the cursor in a corner so no stray hover state lands in the frame.
  await target.mouse.move(viewport.width - 1, viewport.height - 1).catch(() => {});
  if (shot.beforeShot) await shot.beforeShot({ page: target });
  await target.waitForTimeout(250);
  const buf = await target.screenshot();
  writeFileSync(path.join(rawDir, `${shot.name}.png`), buf);
  await context.close();
  return { buf, viewport };
}

async function compose(shot, { buf, viewport }) {
  const crop = shot.crop ?? { x: 0, y: 0, w: viewport.width, h: viewport.height };
  const pad = shot.pad ?? PAD;
  const pl = crop.x <= 0 ? pad : 0;
  const pt = crop.y <= 0 ? pad : 0;
  const pr = crop.x + crop.w >= viewport.width ? pad : 0;
  const pb = crop.y + crop.h >= viewport.height ? pad : 0;
  const stageW = shot.stageW ?? STAGE_W;
  const s = (stageW - pl - pr) / crop.w;
  const stageH = Math.round(crop.h * s + pt + pb);
  const win = {
    left: pl - crop.x * s,
    top: pt - crop.y * s,
    width: viewport.width * s,
    height: viewport.height * s,
  };
  const dark = shot.stage === 'dark';
  const html = `<!doctype html><html><head><style>
    html, body { margin: 0; background: transparent; }
    .stage {
      position: relative; overflow: hidden;
      width: ${stageW}px; height: ${stageH}px;
      background: ${
        dark
          ? 'radial-gradient(130% 120% at 0% 0%, #2a2a2c 0%, #1c1c1e 55%, #161618 100%)'
          : 'radial-gradient(130% 120% at 0% 0%, #f5f4f2 0%, #ecebe8 55%, #e4e3df 100%)'
      };
    }
    .win {
      position: absolute;
      left: ${win.left}px; top: ${win.top}px;
      width: ${win.width}px; height: ${win.height}px;
      border-radius: ${shot.radius ?? 12}px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'},
        0 1px 2px rgba(0,0,0,${dark ? 0.3 : 0.04}),
        0 10px 28px -8px rgba(0,0,0,${dark ? 0.45 : 0.1}),
        0 28px 72px -16px rgba(0,0,0,${dark ? 0.55 : 0.16});
    }
    .win img { display: block; width: 100%; height: 100%; }
  </style></head><body>
    <div class="stage"><div class="win"><img src="data:image/png;base64,${buf.toString('base64')}"></div></div>
  </body></html>`;
  const context = await browser.newContext({
    viewport: { width: stageW, height: stageH },
    deviceScaleFactor: OUT_DPR,
  });
  const page = await context.newPage();
  await page.setContent(html);
  await page.locator('img').evaluate((img) => img.decode());
  const png = await page.locator('.stage').screenshot();
  await context.close();
  const file = path.join(outDir, `${shot.name}.webp`);
  const info = await sharp(png).webp({ quality: 86, effort: 6 }).toFile(file);
  console.log(`${file}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
}

let failed = 0;
try {
  for (const shot of shots) {
    if (only.length && !only.includes(shot.name)) continue;
    try {
      await compose(shot, await capture(shot));
    } catch (err) {
      failed++;
      console.log(`[${shot.name}] FAILED`, err.message);
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
