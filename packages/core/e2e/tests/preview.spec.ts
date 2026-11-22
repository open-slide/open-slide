import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { DEV_SERVER_PORT } from '../../playwright.config.ts';
import {
  deleteSlide,
  devScratchDir,
  duplicateSlide,
  readSlideSource,
  slideSourcePath,
} from './helpers.ts';

const preview = (page: Page) => page.locator('[data-osd-preview]');

test.describe('page preview route', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('renders a single page at native size without editor chrome', async ({ page }) => {
    await page.goto('/s/alpha/preview?p=2');
    await expect(preview(page)).toHaveAttribute('data-osd-preview', 'ready');
    await expect(preview(page)).toHaveAttribute('data-osd-preview-total', '3');
    await expect(page.getByText('Alpha page two')).toBeVisible();
    await expect(page.getByText('Alpha page one')).toHaveCount(0);
    await expect(page.locator('main[data-inspector-root]')).toHaveCount(0);

    const box = await page.locator('[data-osd-canvas]').boundingBox();
    expect(box).toMatchObject({ x: 0, y: 0, width: 1920, height: 1080 });
  });

  test('step param limits revealed steps', async ({ page }) => {
    await page.goto('/s/steps/preview?p=2&step=1');
    await expect(preview(page)).toHaveAttribute('data-osd-preview', 'ready');
    await expect(page.getByText('Step item first')).toBeVisible();
    await expect(page.getByText('Step item second')).toBeHidden();

    await page.goto('/s/steps/preview?p=2');
    await expect(preview(page)).toHaveAttribute('data-osd-preview', 'ready');
    await expect(page.getByText('Step item second')).toBeVisible();
  });

  test('reports out-of-range pages and unknown slides', async ({ page }) => {
    await page.goto('/s/alpha/preview?p=9');
    await expect(preview(page)).toHaveAttribute('data-osd-preview', 'error');
    await expect(page.locator('[data-osd-preview-error]')).toContainText('out of range (1–3)');

    await page.goto('/s/does-not-exist/preview?p=1');
    await expect(preview(page)).toHaveAttribute('data-osd-preview', 'error');
  });

  test('reports a page that throws while rendering', async ({ page, request }) => {
    const slideId = 'preview-throw';
    try {
      await duplicateSlide(request, 'alpha', slideId);
      const source = await readSlideSource(slideId);
      await fs.writeFile(
        slideSourcePath(slideId),
        source.replace(
          'const Two: Page = () => (',
          "const Two: Page = () => {\n  throw new Error('preview boom');\n};\nconst Unused: Page = () => (",
        ),
      );
      await expect
        .poll(async () => {
          await page.goto(`/s/${slideId}/preview?p=2`);
          await expect(preview(page)).not.toHaveAttribute('data-osd-preview', 'loading');
          return preview(page).getAttribute('data-osd-preview');
        })
        .toBe('error');
      await expect(page.locator('[data-osd-preview-error]')).toContainText('preview boom');

      await page.goto(`/s/${slideId}/preview?p=1`);
      await expect(preview(page)).toHaveAttribute('data-osd-preview', 'ready');
    } finally {
      await deleteSlide(request, slideId);
    }
  });

  test('dev server publishes its url for agents', async () => {
    const raw = await fs.readFile(
      path.join(devScratchDir, 'node_modules', '.open-slide', 'server.json'),
      'utf8',
    );
    const info = JSON.parse(raw) as { url: string; port: number };
    expect(info.port).toBe(DEV_SERVER_PORT);
    expect(info.url).toMatch(new RegExp(`^http://[^/]+:${DEV_SERVER_PORT}/$`));
  });
});
