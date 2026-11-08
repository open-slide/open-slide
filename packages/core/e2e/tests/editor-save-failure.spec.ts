import { expect, test } from '@playwright/test';
import type { Edit } from '../../src/app/lib/inspector/use-editor';
import { deleteSlide, duplicateSlide, editorCanvas, openSlide, readSlideSource } from './helpers';

test.describe('partially saved text edits', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const slideId of createdSlides.splice(0)) await deleteSlide(request, slideId);
  });

  test('a partially failed autosave keeps the saved edits and reverts the failed text sequence', async ({
    page,
    request,
  }) => {
    const slideId = 'text-save-failure';
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    const canvas = editorCanvas(page);
    const body = canvas.locator('p');
    const headline = canvas.getByText('Editable headline', { exact: true });
    const panel = page.locator('aside[data-inspector-ui]');

    await page.route(
      '**/__edit/batch',
      async (route) => {
        const data = route.request().postDataJSON() as { slideId: string; edits: Edit[] };
        const rangeEdit = data.edits.find((edit) => edit.ops[0].kind === 'set-text-range-style');
        if (rangeEdit?.ops[0].kind !== 'set-text-range-style') {
          throw new Error('Expected a buffered range-style edit');
        }
        rangeEdit.ops[0].start = -1;
        const response = await route.fetch({ postData: data });
        await route.fulfill({ response });
      },
      { times: 1 },
    );
    const failedSave = page.waitForResponse('**/__edit/batch');

    await body.dblclick();
    await body.press('End');
    await page.keyboard.insertText(' first');
    await body.press('Home');
    for (let i = 0; i < 'Editable'.length; i++) await page.keyboard.press('Shift+ArrowRight');
    await panel.getByRole('button', { name: 'Bold', exact: true }).click();
    await body.press('End');
    await page.keyboard.insertText(' final');
    await body.press('Escape');
    await panel.getByRole('button', { name: 'center', exact: true }).click();
    await expect(body).toHaveCSS('text-align', 'center');
    await headline.click();
    await panel.getByRole('button', { name: 'Italic', exact: true }).click();
    await expect(headline).toHaveCSS('font-style', 'italic');

    const firstResult = (await (await failedSave).json()) as { results: { ok: boolean }[] };
    expect(firstResult.results.some((result) => !result.ok)).toBe(true);
    await expect(page.getByText(/Couldn't save:/)).toBeVisible();

    await expect.poll(() => readSlideSource(slideId)).toContain("fontStyle: 'italic'");
    const saved = await readSlideSource(slideId);
    expect(saved).toContain('Editable body copy first');
    expect(saved).not.toContain('first final');
    expect(saved).not.toContain('fontWeight');
    expect(saved).toContain("textAlign: 'center'");
    await expect(body).toHaveText('Editable body copy first');
    await expect(body.locator('[style]')).toHaveCount(0);
    await expect(headline).toHaveCSS('font-style', 'italic');

    // The edits that landed are one saved step, so undo takes them all back.
    await page.locator('body').click({ position: { x: 4, y: 4 } });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(() => readSlideSource(slideId)).not.toContain('Editable body copy first');
    const reverted = await readSlideSource(slideId);
    expect(reverted).not.toContain("fontStyle: 'italic'");
    expect(reverted).not.toContain("textAlign: 'center'");
    await expect(body).toHaveText('Editable body copy');
  });
});
