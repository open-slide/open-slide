import { expect, test } from '@playwright/test';
import { editorCanvas, enterPlayMode, openSlide } from './helpers.ts';

test.describe('presenter view', () => {
  test('standalone presenter shows notes and the not-linked badge', async ({ page }) => {
    await page.goto('/s/alpha/presenter');
    await expect(page.getByText('Presenter')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Not linked')).toBeVisible();
    await expect(page.getByText('Alpha speaker note')).toBeVisible();
  });

  test('presenter popup links to the player and drives it', async ({ page, context }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    const popupPromise = context.waitForEvent('page');
    await page.keyboard.press('p');
    const popup = await popupPromise;
    await popup.waitForLoadState();
    expect(popup.url()).toContain('/s/alpha/presenter');

    await expect(popup.getByText('01 / 03')).toBeVisible({ timeout: 30_000 });
    await expect(popup.getByText('Not linked')).toBeHidden();
    await expect(popup.getByText('Alpha speaker note')).toBeVisible();

    await popup.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(popup.getByText('02 / 03')).toBeVisible();
    await expect(popup.getByText('No speaker notes for this slide.')).toBeVisible();

    await popup.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/[?&]p=3/);
    await expect(popup.getByText('03 / 03')).toBeVisible();
    await expect(popup.getByText('Last slide')).toBeVisible();
    await expect(popup.getByText('End of deck')).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();

    await popup.getByRole('button', { name: 'Prev', exact: true }).click();
    await expect(page).toHaveURL(/[?&]p=2/);

    const jump = popup.locator('input[type="number"]');
    await jump.fill('1');
    await jump.press('Enter');
    await expect(page).toHaveURL(/[?&]p=1/);
    await expect(popup.getByText('01 / 03')).toBeVisible();
  });

  for (const exit of ['browser', 'Escape'] as const) {
    test(`presenter keeps driving the audience after fullscreen exit via ${exit}`, async ({
      page,
    }) => {
      await openSlide(page, 'steps');
      const popupPromise = page.waitForEvent('popup');
      await page.keyboard.press('p');
      const popup = await popupPromise;
      const next = popup.getByRole('button', { name: 'Next', exact: true });
      await expect(popup.getByText('01 / 03')).toBeVisible();
      await expect(popup.getByText('Not linked')).toBeHidden();
      await next.click();
      await expect(page.locator('[data-osd-step="pending"]')).toHaveCount(2);
      await expect(popup.locator('aside [data-osd-step="revealed"]')).toHaveCount(1);
      await next.click();
      const revealed = page.locator('[data-osd-step="revealed"]');
      await expect(revealed).toHaveCount(1);

      await page.bringToFront();
      const viewport = page.viewportSize();
      if (!viewport) throw new Error('viewport is not set');
      await page.mouse.move(viewport.width / 2, viewport.height - 10);
      await page.getByRole('button', { name: 'Enter fullscreen' }).click();
      const isFullscreen = () => page.evaluate(() => document.fullscreenElement !== null);
      await expect.poll(isFullscreen).toBe(true);

      if (exit === 'browser') await page.evaluate(() => document.exitFullscreen());
      else await page.keyboard.press('Escape');
      await expect.poll(isFullscreen).toBe(false);
      await expect(revealed).toHaveCount(1);
      await next.click();
      await expect(revealed).toHaveCount(2);
      await next.click();
      await expect(page).toHaveURL(/[?&]p=3/);
      await expect(popup.getByText('03 / 03')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(editorCanvas(page)).toBeVisible();
    });
  }

  test('blackout round-trips between presenter and player', async ({ page, context }) => {
    await openSlide(page, 'alpha');
    await enterPlayMode(page);

    const popupPromise = context.waitForEvent('page');
    await page.keyboard.press('p');
    const popup = await popupPromise;
    await expect(popup.getByText('01 / 03')).toBeVisible({ timeout: 30_000 });

    const blackButton = popup.getByRole('button', { name: 'Black', exact: true });
    await blackButton.click();
    await expect(blackButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('div.absolute.inset-0.bg-black')).toBeVisible();

    await blackButton.click();
    await expect(blackButton).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('div.absolute.inset-0.bg-black')).toBeHidden();

    const whiteButton = popup.getByRole('button', { name: 'White', exact: true });
    await whiteButton.click();
    await expect(whiteButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('div.absolute.inset-0.bg-white')).toBeVisible();

    await whiteButton.click();
    await expect(whiteButton).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('div.absolute.inset-0.bg-white')).toBeHidden();
  });
});
