import { expect, test } from '@playwright/test';
import { openSlide } from './helpers.ts';

test.describe('embed', () => {
  test('share menu copies an embed link and iframe code', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openSlide(page, 'alpha');
    const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

    await page.getByRole('button', { name: 'Share', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Copy embed link', exact: true }).click();
    await expect.poll(clipboard).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/s\/alpha\/embed$/);

    await page.getByRole('button', { name: 'Share', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Copy embed code', exact: true }).click();
    await expect
      .poll(clipboard)
      .toMatch(/^<iframe src="http:\/\/127\.0\.0\.1:\d+\/s\/alpha\/embed" title="Alpha Deck" /);
  });

  test('plays the deck inside an iframe', async ({ page }) => {
    await page.goto('/s/alpha');
    const src = new URL('/s/alpha/embed?p=2', page.url()).href;
    await page.setContent(
      `<iframe src="${src}" style="width:800px;height:450px;border:0"></iframe>`,
    );
    const embed = page.frameLocator('iframe');

    await expect(embed.getByText('Alpha page two')).toBeVisible();
    await expect(embed.getByText('02 / 03')).toBeVisible();

    await page.locator('iframe').hover();
    await embed.getByRole('button', { name: 'Next slide' }).click();
    await expect(embed.getByText('Alpha page three')).toBeVisible();
    await expect(embed.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute(
      'href',
      '/s/alpha?p=3',
    );

    await page.keyboard.press('ArrowLeft');
    await expect(embed.getByText('Alpha page two')).toBeVisible();
  });

  test('rounds a fractional start page down', async ({ page }) => {
    await page.goto('/s/alpha/embed?p=2.7');
    await expect(page.getByText('Alpha page two')).toBeVisible();
    await expect(page.getByText('02 / 03')).toBeVisible();
  });

  test('space activates a focused control instead of advancing the deck', async ({ page }) => {
    await page.goto('/s/alpha/embed?p=2');
    await expect(page.getByText('Alpha page two')).toBeVisible();
    await page.getByRole('button', { name: 'Previous slide' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByText('01 / 03')).toBeVisible();
  });
});
