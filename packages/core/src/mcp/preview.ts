import { createRequire } from 'node:module';
import path from 'node:path';

type Page = {
  goto(url: string): Promise<unknown>;
  waitForSelector(selector: string, opts: { timeout: number }): Promise<unknown>;
  getAttribute(selector: string, name: string): Promise<string | null>;
  textContent(selector: string): Promise<string | null>;
  screenshot(opts: { type: 'jpeg'; quality: number }): Promise<Buffer>;
  close(): Promise<void>;
};
type Browser = {
  newPage(opts: {
    viewport: { width: number; height: number };
    deviceScaleFactor: number;
  }): Promise<Page>;
  close(): Promise<void>;
};
type Playwright = { chromium: { launch(): Promise<Browser> } };

let browser: Promise<Browser> | null = null;

// Playwright is never a dependency of core: use whichever copy the project or
// the machine already has, and fall back to the preview URL without one.
async function loadPlaywright(userCwd: string): Promise<Playwright | null> {
  const require = createRequire(path.join(userCwd, 'package.json'));
  for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
    try {
      const mod = (await import(require.resolve(name))) as Playwright & { default?: Playwright };
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return pw;
    } catch {}
  }
  return null;
}

export type PreviewShot =
  | { ok: true; jpeg: Buffer }
  | { ok: false; reason: 'no-browser' }
  | { ok: false; reason: 'error'; message: string };

export async function screenshotPreview(userCwd: string, url: string): Promise<PreviewShot> {
  if (!browser) {
    const pw = await loadPlaywright(userCwd);
    if (!pw) return { ok: false, reason: 'no-browser' };
    browser = pw.chromium.launch();
    browser.catch(() => {
      browser = null;
    });
  }
  let page: Page | null = null;
  try {
    page = await (await browser).newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 0.5,
    });
    await page.goto(url);
    await page.waitForSelector('[data-osd-preview="ready"], [data-osd-preview="error"]', {
      timeout: 20_000,
    });
    if ((await page.getAttribute('[data-osd-preview]', 'data-osd-preview')) === 'error') {
      const message = await page.textContent('[data-osd-preview-error]');
      return { ok: false, reason: 'error', message: message || 'The page failed to render.' };
    }
    return { ok: true, jpeg: await page.screenshot({ type: 'jpeg', quality: 80 }) };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await page?.close().catch(() => {});
  }
}

export async function closePreviewBrowser(): Promise<void> {
  const current = browser;
  browser = null;
  await (await current?.catch(() => null))?.close().catch(() => {});
}
