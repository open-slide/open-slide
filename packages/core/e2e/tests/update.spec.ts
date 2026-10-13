import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { coreRoot, TINY_PNG } from './helpers.ts';

const COVER_URL = 'https://covers.open-slide.test/next.png';

async function mockUpdate(page: Page, current: string) {
  const latest = '99.1.0';
  let phase = 'idle';
  await page.route('**/__update-check', (route) =>
    route.fulfill({ json: { current, latest, outdated: true } }),
  );
  await page.route('**/__release-notes?*', (route) =>
    route.fulfill({
      json: {
        releases: [
          {
            version: latest,
            title: 'Faster everything',
            image: COVER_URL,
            url: null,
            changes: [
              { type: 'minor', text: 'Add a `whats new` dialog.', pr: 1, author: 'octo' },
              { type: 'patch', text: 'Fix a sidebar glitch.', pr: null, author: null },
            ],
          },
        ],
      },
    }),
  );
  await page.route(COVER_URL, (route) =>
    route.fulfill({ body: TINY_PNG, contentType: 'image/png' }),
  );
  await page.route('**/__update-package', (route) => {
    if (route.request().method() === 'POST') phase = 'installing';
    return route.fulfill({
      json: { executionId: 'same', canRestart: true, phase, target: latest, error: null },
    });
  });
  return latest;
}

test.describe('in-app update', () => {
  let current: string;

  test.beforeAll(async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(coreRoot, 'package.json'), 'utf8'));
    current = pkg.version;
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((version) => {
      localStorage.setItem('open-slide:last-seen-version', version);
    }, current);
  });

  test('sidebar card opens release notes for the new version', async ({ page }) => {
    const latest = await mockUpdate(page, current);
    await page.goto('/');

    await expect(page.getByText('Update available')).toBeVisible();
    await expect(page.getByText('Faster everything')).toBeVisible();
    await page.getByRole('button', { name: "What's new" }).last().click();

    const dialog = page.getByRole('dialog', { name: `What's new in v${latest}` });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Fix a sidebar glitch.')).toBeVisible();
    await expect(dialog.getByRole('link', { name: '#1' })).toHaveAttribute(
      'href',
      'https://github.com/open-slide/open-slide/pull/1',
    );

    await dialog.getByRole('button', { name: 'Later' }).click();
    await expect(dialog).toBeHidden();
  });

  test('updating locks the dialog until the server comes back', async ({ page }) => {
    const latest = await mockUpdate(page, current);
    await page.goto('/');

    await page.getByRole('button', { name: 'Update now' }).click();
    const dialog = page.getByRole('dialog', { name: `What's new in v${latest}` });
    await expect(dialog.getByText(`Install v${latest}`)).toBeVisible();
    await expect(dialog.getByText('Keep this tab open.', { exact: false })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(0);

    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    await page.keyboard.press('ControlOrMeta+k');
    await expect(dialog).toBeVisible();
    await expect(page.getByPlaceholder('Search slides or run a command')).toBeHidden();
  });

  test('dismissing the card keeps a dot on the version label', async ({ page }) => {
    await mockUpdate(page, current);
    await page.goto('/');

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByText('Update available')).toBeHidden();
    await page.getByRole('button', { name: `v${current}` }).click();
    await expect(page.getByRole('dialog', { name: /What's new in v99\.1\.0/ })).toBeVisible();
  });

  test('shows what changed after the version moves forward', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('open-slide:last-seen-version', '0.0.1');
    });
    await page.route('**/__release-notes?*', (route) =>
      route.fulfill({
        json: {
          releases: [{ version: current, title: 'Shiny', image: null, url: null, changes: [] }],
        },
      }),
    );
    await page.goto('/');

    const dialog = page.getByRole('dialog', { name: `Updated to v${current}` });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Got it' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('open-slide:last-seen-version'))).toBe(
      current,
    );
  });
});
