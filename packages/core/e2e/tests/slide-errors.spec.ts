import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { devScratchDir, editorCanvas, openSlide, refreshSlidesModule } from './helpers.ts';

const pageSource = (name: string, body: string) => `const ${name}: Page = () => ${body};`;

const deck = (
  title: string,
  pages: string[],
  names: string[],
) => `import type { Page, SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = { title: ${JSON.stringify(title)}, createdAt: '2026-01-06T00:00:00.000Z' };

${pages.join('\n\n')}

export default [${names.join(', ')}] satisfies Page[];
`;

const HEALTHY = deck(
  'Error Deck',
  [pageSource('Only', `<div style={{ padding: 120, fontSize: 96 }}>Healthy page</div>`)],
  ['Only'],
);

const BROKEN = HEALTHY.replace('Healthy page</div>', 'Healthy page</div');

const THROWING = deck(
  'Throwing Deck',
  [
    pageSource('Fine', `<div style={{ padding: 120, fontSize: 96 }}>Fine page</div>`),
    `const Boom: Page = () => {
  const items = undefined as unknown as string[];
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
};`,
  ],
  ['Fine', 'Boom'],
);

async function writeDeck(id: string, source: string): Promise<string> {
  const dir = path.join(devScratchDir, 'slides', id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.tsx'), source);
  return dir;
}

async function copiedText(p: Page): Promise<string> {
  return p.evaluate(() => navigator.clipboard.readText());
}

test.describe('slide errors', () => {
  test('a deck that fails to compile shows the error and a fix prompt', async ({
    page: p,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const dir = await writeDeck('err-compile', BROKEN);
    try {
      await refreshSlidesModule('err-compile');
      await p.goto('/s/err-compile');

      const screen = p.locator('[data-osd-slide-error="compile"]');
      await expect(screen).toBeVisible({ timeout: 15_000 });
      await expect(screen).toContainText("This slide doesn't compile");
      await expect(screen).toContainText(/err-compile\/index\.tsx:\d+:\d+/);
      await expect(p.locator('vite-error-overlay')).toHaveCount(0);

      await screen.getByRole('button', { name: 'Copy fix prompt' }).click();
      await expect(screen.getByRole('button', { name: 'Copied' })).toBeVisible();
      const prompt = await copiedText(p);
      expect(prompt).toContain('`slides/err-compile/` fails to compile');
      expect(prompt).toMatch(/File: .*err-compile\/index\.tsx:\d+:\d+/);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('breaking an open deck keeps the last version on screen until it is fixed', async ({
    page: p,
  }) => {
    const dir = await writeDeck('err-hmr', HEALTHY);
    const file = path.join(dir, 'index.tsx');
    try {
      await refreshSlidesModule('err-hmr');
      await openSlide(p, 'err-hmr');
      const canvas = editorCanvas(p);
      await expect(canvas.getByText('Healthy page')).toBeVisible();

      await fs.writeFile(file, BROKEN);
      const banner = p.locator('[data-osd-slide-error="compile"]');
      await expect(banner).toBeVisible({ timeout: 15_000 });
      await expect(banner).toContainText('Showing the last working version');
      await expect(canvas.getByText('Healthy page')).toBeVisible();

      await fs.writeFile(file, HEALTHY.replace('Healthy page', 'Fixed page'));
      await expect(canvas.getByText('Fixed page')).toBeVisible({ timeout: 15_000 });
      await expect(banner).toBeHidden();
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  test('a page that throws renders a crash card instead of blanking the editor', async ({
    page: p,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const dir = await writeDeck('err-render', THROWING);
    try {
      await refreshSlidesModule('err-render');
      await openSlide(p, 'err-render', '?p=2');
      const canvas = editorCanvas(p);

      const banner = p.locator('[data-osd-slide-error="render"]');
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('Page 2 failed to render');
      await expect(canvas.getByText('Page failed to render').first()).toBeVisible();

      await banner.getByRole('button', { name: 'Copy fix prompt' }).click();
      const prompt = await copiedText(p);
      expect(prompt).toContain('`slides/err-render/` throws while rendering page 2');
      expect(prompt).toContain('Component stack:');

      // Arrow keys are ignored while a button has focus.
      await p.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await p.keyboard.press('ArrowLeft');
      await expect(canvas.getByText('Fine page')).toBeVisible();
      await expect(banner).toBeHidden();
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
