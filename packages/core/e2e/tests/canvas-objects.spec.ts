import { expect, type Page, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  readSlideSource,
} from './helpers.ts';

test.describe('canvas objects', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  async function openEditable(
    page: Page,
    request: import('@playwright/test').APIRequestContext,
    slideId: string,
  ) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
  }

  test('inserts a text box, autosaves it, and undo removes it after the save', async ({
    page,
    request,
  }) => {
    await openEditable(page, request, 'obj-insert-text');
    await page.getByRole('button', { name: 'Text box', exact: true }).click();

    await expect.poll(() => readSlideSource('obj-insert-text')).toContain('>Text</div>');
    const canvas = editorCanvas(page);
    await expect(canvas.getByText('Text', { exact: true })).toBeVisible();
    const src = await readSlideSource('obj-insert-text');
    expect(src).toMatch(/<div style=\{\{ position: 'absolute', left: \d+, top: \d+, width: 720/);

    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => readSlideSource('obj-insert-text')).not.toContain('>Text</div>');
    await expect(canvas.getByText('Text', { exact: true })).toHaveCount(0);

    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect.poll(() => readSlideSource('obj-insert-text')).toContain('>Text</div>');
  });

  test('inserts a shape from the shape menu with a Shape import', async ({ page, request }) => {
    await openEditable(page, request, 'obj-insert-shape');
    await page.getByRole('button', { name: 'Shape', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Star', exact: true }).click();

    await expect.poll(() => readSlideSource('obj-insert-shape')).toContain('<Shape kind="star"');
    const src = await readSlideSource('obj-insert-shape');
    expect(src).toContain("import { Shape } from '@open-slide/core';");
    await expect(editorCanvas(page).locator('[data-os-shape="star"] svg path')).toBeVisible();
  });

  test('autosaves a style edit and keeps it undoable after the write', async ({
    page,
    request,
  }) => {
    await openEditable(page, request, 'obj-autosave');
    await editorCanvas(page).getByText('Editable headline').click();
    await page
      .locator('aside[data-inspector-ui]')
      .getByPlaceholder('Element text')
      .fill('Autosaved headline');

    await expect.poll(() => readSlideSource('obj-autosave')).toContain('Autosaved headline');
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);

    await page.locator('body').click({ position: { x: 4, y: 4 } });
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => readSlideSource('obj-autosave')).toContain('Editable headline');
  });

  test('deletes the selected element with Backspace', async ({ page, request }) => {
    await openEditable(page, request, 'obj-delete');
    await editorCanvas(page).getByText('Editable body copy').click();
    await page.keyboard.press('Backspace');

    await expect.poll(() => readSlideSource('obj-delete')).not.toContain('Editable body copy');
    await expect(editorCanvas(page).getByText('Editable body copy')).toHaveCount(0);
  });

  test('duplicates the selection with ⌘D and offsets the copy', async ({ page, request }) => {
    await openEditable(page, request, 'obj-duplicate');
    await editorCanvas(page).getByText('Editable body copy').click();
    await page.keyboard.press('ControlOrMeta+d');

    await expect
      .poll(async () => (await readSlideSource('obj-duplicate')).split('Editable body copy').length)
      .toBe(3);
    await expect(editorCanvas(page).getByText('Editable body copy')).toHaveCount(2);
    const boxes = await editorCanvas(page)
      .getByText('Editable body copy')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    expect(Math.abs(boxes[1] - boxes[0])).toBeGreaterThan(1);
  });

  test('copies and pastes an element onto the slide', async ({ page, request, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openEditable(page, request, 'obj-paste');
    await editorCanvas(page).getByText('Editable headline').click();
    await page.keyboard.press('ControlOrMeta+c');
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('Editable headline');
    await page.keyboard.press('ControlOrMeta+v');

    await expect
      .poll(async () => (await readSlideSource('obj-paste')).split('Editable headline').length)
      .toBe(3);
  });
});
