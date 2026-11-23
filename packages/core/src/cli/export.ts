import { mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { createServer, mergeConfig } from 'vite';
import type { ExportFormat } from '../app/lib/cli-export.ts';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../app/lib/sdk.ts';
import { SLIDE_ID_RE } from '../editing/slide-ops.ts';
import { createViteConfig } from '../vite/config.ts';
import { saveHtmlOutput } from './html-output.ts';
import { createCliLogger } from './ui.ts';

const READY_TIMEOUT_MS = 60_000;
const EXPORT_TIMEOUT_MS = 120_000;

export interface ExportOptions {
  slide: string;
  format: ExportFormat;
  outDir?: string;
}

function loadChromium(userCwd: string): typeof import('@playwright/test').chromium {
  const require = createRequire(path.join(userCwd, 'package.json'));
  let entry: string;
  try {
    entry = require.resolve('playwright');
  } catch {
    throw new Error(
      'Install Playwright in this workspace with `npm install -D playwright`, then run `npx playwright install chromium`.',
    );
  }
  return (require(entry) as typeof import('@playwright/test')).chromium;
}

export async function exportDeck({ slide, format, outDir = '.' }: ExportOptions): Promise<string> {
  if (!SLIDE_ID_RE.test(slide)) throw new Error(`Invalid slide ID: ${slide}`);

  const userCwd = process.cwd();
  const chromium = loadChromium(userCwd);
  const browser = await chromium.launch().catch((error: unknown) => {
    throw new Error(
      `Could not start Chromium. Run \`npx playwright install chromium\`.\n${String(error)}`,
    );
  });
  try {
    const baseConfig = await createViteConfig({ userCwd, cliExport: true });
    const server = await createServer(
      mergeConfig(baseConfig, {
        customLogger: createCliLogger(),
        server: { host: '127.0.0.1', port: 0, open: false },
      }),
    );
    try {
      await server.listen();
      const baseUrl = server.resolvedUrls?.local[0];
      if (!baseUrl) throw new Error('Could not determine the local export server URL.');
      const page = await browser.newPage({
        acceptDownloads: true,
        viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      });
      const response = await page.goto(new URL(`s/${slide}/export`, baseUrl).href, {
        waitUntil: 'domcontentloaded',
        timeout: READY_TIMEOUT_MS,
      });
      if (!response?.ok()) {
        throw new Error(
          `Could not load the export page (HTTP ${response?.status() ?? 'unavailable'}).`,
        );
      }
      await page.waitForFunction(
        () => window.openSlideCliExport || document.querySelector('[data-osd-export-error]'),
        undefined,
        { timeout: READY_TIMEOUT_MS },
      );
      const loadError = await page.evaluate(
        () => document.querySelector('[data-osd-export-error]')?.textContent,
      );
      if (loadError) throw new Error(loadError);
      return await saveExport(page, slide, format, path.resolve(userCwd, outDir));
    } finally {
      await server.close();
    }
  } finally {
    await browser.close();
  }
}

async function saveExport(
  page: Page,
  slide: string,
  format: ExportFormat,
  outDir: string,
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const staging = await mkdtemp(path.join(outDir, '.open-slide-'));
  const stagedFile = path.join(staging, 'export');
  const runExport = () =>
    page.evaluate((value) => {
      if (!window.openSlideCliExport) throw new Error('The export page is no longer ready.');
      return window.openSlideCliExport(value);
    }, format);
  let renderError: Error | undefined;
  page.on('pageerror', (error) => {
    renderError ??= error;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timed out exporting "${slide}".`)),
      EXPORT_TIMEOUT_MS,
    );
  });

  try {
    let downloadName: string | undefined;
    if (format === 'pdf') {
      await page.exposeFunction('openSlideCliSavePdf', async () => {
        await page.pdf({ path: stagedFile, preferCSSPageSize: true, printBackground: true });
        return true;
      });
      await Promise.race([runExport(), deadline]);
    } else {
      const download = page.waitForEvent('download', { timeout: EXPORT_TIMEOUT_MS });
      const [file] = await Promise.race([Promise.all([download, runExport()]), deadline]);
      await Promise.race([file.saveAs(stagedFile), deadline]);
      downloadName = file.suggestedFilename();
    }
    if (renderError) throw renderError;
    if (format === 'html') {
      if (downloadName !== `${slide}.html` && downloadName !== `${slide}.zip`) {
        throw new Error(`Unexpected HTML export filename: ${downloadName}`);
      }
      return await saveHtmlOutput(staging, outDir, slide, downloadName, await readFile(stagedFile));
    }
    const output = path.join(outDir, `${slide}.${format === 'pdf' ? 'pdf' : 'pptx'}`);
    await rename(stagedFile, output);
    return output;
  } finally {
    clearTimeout(timer);
    try {
      await page.close();
    } finally {
      await rm(staging, { force: true, recursive: true });
    }
  }
}
