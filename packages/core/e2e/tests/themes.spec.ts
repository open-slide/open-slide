import { expect, test } from '@playwright/test';

test.describe('theme detail', () => {
  test('navigates demo pages and expands the prompt', async ({ page }) => {
    await page.goto('/themes/plain');
    const stage = page.getByRole('region', { name: 'Theme preview' });
    await expect(stage.getByText('Theme demo one')).toBeVisible({ timeout: 30_000 });

    const prev = page.getByRole('button', { name: 'Previous page' });
    const next = page.getByRole('button', { name: 'Next page' });
    await expect(prev).toBeDisabled();

    await next.click();
    await expect(stage.getByText('Theme demo two')).toBeVisible();
    await expect(next).toBeDisabled();

    await prev.click();
    await expect(stage.getByText('Theme demo one')).toBeVisible();

    await page.getByRole('button', { name: 'Go to page 2' }).click();
    await expect(stage.getByText('Theme demo two')).toBeVisible();

    const expand = page.getByRole('button', { name: 'Show full prompt' });
    await expand.click();
    await expect(page.getByRole('button', { name: 'Show less' })).toBeVisible();
  });
});
