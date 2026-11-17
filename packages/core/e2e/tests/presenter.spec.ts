import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { editorCanvas, enterPlayMode, openSlide } from './helpers.ts';

async function openLinkedPresenter(page: Page, context: BrowserContext): Promise<Page> {
  await openSlide(page, 'alpha');
  await enterPlayMode(page);
  const popupPromise = context.waitForEvent('page');
  await page.keyboard.press('p');
  const popup = await popupPromise;
  await expect(popup.getByText('01 / 03')).toBeVisible({ timeout: 30_000 });
  await expect(popup.getByText('Not linked')).toBeHidden();
  return popup;
}

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

  test('presenter shows not linked once the player exits, then relinks', async ({
    page,
    context,
  }) => {
    const popup = await openLinkedPresenter(page, context);

    await page.keyboard.press('Escape');
    await expect(editorCanvas(page)).toBeVisible();
    await expect(popup.getByText('Not linked')).toBeVisible();

    await enterPlayMode(page);
    await expect(popup.getByText('Not linked')).toBeHidden();
    await popup.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page).toHaveURL(/[?&]p=2/);
  });

  test('present mode survives a reload of the player window', async ({ page, context }) => {
    const popup = await openLinkedPresenter(page, context);

    await page.reload();
    await expect(page.locator('[data-osd-chrome]')).toBeAttached({ timeout: 30_000 });
    await expect(editorCanvas(page)).toBeHidden();
    // Navigation is held until the reloaded page has re-warmed the deck.
    await expect(page.locator('[data-osd-freeze-motion]')).toHaveCount(0, { timeout: 30_000 });

    await popup.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(popup.getByText('02 / 03')).toBeVisible();
  });

  test('jump input hands the keyboard back after a jump', async ({ page, context }) => {
    const popup = await openLinkedPresenter(page, context);

    const jump = popup.locator('input[type="number"]');
    await jump.fill('2');
    await jump.press('Enter');
    await expect(page).toHaveURL(/[?&]p=2/);
    await expect(popup.getByText('02 / 03')).toBeVisible();

    await popup.keyboard.press('PageDown');
    await expect(page).toHaveURL(/[?&]p=3/);
  });

  test('prev and next account for steps left on the first and last page', async ({ page }) => {
    await page.goto('/s/steps/presenter');
    await expect(page.getByText('Not linked')).toBeVisible({ timeout: 30_000 });

    const publish = (state: Record<string, unknown>) =>
      page.evaluate((state) => {
        const channel = new BroadcastChannel('open-slide:presenter:steps');
        channel.postMessage({ type: 'state', state });
        channel.close();
      }, state);
    const base = { pageCount: 3, blackout: null, startedAt: Date.now(), stepCount: 2 };
    const prev = page.getByRole('button', { name: 'Prev', exact: true });
    const next = page.getByRole('button', { name: 'Next', exact: true });

    await publish({ ...base, index: 2, stepIndex: 1 });
    await expect(page.getByText('03 / 03')).toBeVisible();
    await expect(next).toBeEnabled();

    await publish({ ...base, index: 2, stepIndex: 2 });
    await expect(next).toBeDisabled();

    await publish({ ...base, index: 0, stepIndex: 1 });
    await expect(page.getByText('01 / 03')).toBeVisible();
    await expect(prev).toBeEnabled();

    await publish({ ...base, index: 0, stepIndex: 0 });
    await expect(prev).toBeDisabled();
  });
});
