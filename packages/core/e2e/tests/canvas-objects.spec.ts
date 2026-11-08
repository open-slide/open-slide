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

  test('edits a shape fill and type, saving them as props', async ({ page, request }) => {
    await openEditable(page, request, 'obj-shape-format');
    await page.getByRole('button', { name: 'Shape', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Rectangle', exact: true }).click();
    await expect.poll(() => readSlideSource('obj-shape-format')).toContain('<Shape kind="rect"');

    const panel = page.locator('aside[data-inspector-ui]');
    await panel.locator('input[type="text"][aria-label="Fill"]').fill('#ff5a1f');
    await expect.poll(() => readSlideSource('obj-shape-format')).toContain('fill="#ff5a1f"');

    await panel.getByRole('combobox', { name: 'Type' }).click();
    await page.getByRole('option', { name: 'Star', exact: true }).click();
    await expect.poll(() => readSlideSource('obj-shape-format')).toContain('kind="star"');
    await expect(editorCanvas(page).locator('[data-os-shape="star"]')).toBeVisible();
  });

  test('sets opacity and a shadow on every selected element', async ({ page, request }) => {
    await openEditable(page, request, 'obj-multi-format');
    const canvas = editorCanvas(page);
    await canvas.getByText('Editable headline').click();
    await canvas.getByText('Editable body copy').click({ modifiers: ['Shift'] });

    const panel = page.locator('aside[data-inspector-ui]');
    await panel.getByRole('tab').first().click();
    await panel.getByRole('spinbutton', { name: 'Opacity' }).fill('50');
    await panel.getByRole('combobox', { name: 'Shadow' }).click();
    await page.getByRole('option', { name: 'Soft', exact: true }).click();

    await expect
      .poll(async () => (await readSlideSource('obj-multi-format')).split("opacity: '0.5'").length)
      .toBe(3);
    const src = await readSlideSource('obj-multi-format');
    expect(src.split('drop-shadow(').length).toBe(3);
  });

  test('groups, ungroups and locks shapes without moving them', async ({ page, request }) => {
    await openEditable(page, request, 'obj-group');
    const canvas = editorCanvas(page);
    const insert = async (name: string, count: number) => {
      await page.getByRole('button', { name: 'Shape', exact: true }).click();
      await page.getByRole('menuitem', { name, exact: true }).click();
      await expect
        .poll(async () => (await readSlideSource('obj-group')).split('<Shape ').length)
        .toBe(count + 1);
      await expect(canvas.locator('[data-os-shape]')).toHaveCount(count);
      await expect(
        page.locator('aside[data-inspector-ui]').getByRole('combobox', { name: 'Type' }),
      ).toContainText(name);
    };
    await insert('Rectangle', 1);
    for (let i = 0; i < 20; i++) await page.keyboard.press('Shift+ArrowLeft');
    await expect.poll(() => readSlideSource('obj-group')).toContain("left: '580px'");
    await insert('Ellipse', 2);

    const frames = () =>
      canvas
        .locator('[data-os-shape]')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
    const before = await frames();

    const rect = canvas.locator('[data-os-shape="rect"]');
    const box = await rect.boundingBox();
    if (!box) throw new Error('rect not visible');
    await page.keyboard.down('Shift');
    await page.mouse.click(box.x + 8, box.y + box.height / 2);
    await page.keyboard.up('Shift');
    await expect(page.getByText('2 elements selected', { exact: true })).toBeVisible();
    await page.keyboard.press('ControlOrMeta+Alt+g');

    await expect.poll(() => readSlideSource('obj-group')).toContain('<div data-slide-group');
    await expect(canvas.locator('[data-slide-group] [data-os-shape]')).toHaveCount(2);
    await expect
      .poll(async () => {
        const after = await frames();
        return after.every(
          (frame, i) =>
            Math.abs(frame.x - before[i].x) < 1.5 && Math.abs(frame.y - before[i].y) < 1.5,
        );
      })
      .toBe(true);

    await expect(page.getByText('2 elements selected', { exact: true })).toHaveCount(0);
    await page.keyboard.press('ControlOrMeta+l');
    await expect.poll(() => readSlideSource('obj-group')).toContain('data-locked');
    await expect(canvas.locator('[data-slide-group][data-locked]')).toBeVisible();
    await page.keyboard.press('Backspace');
    await expect(page.getByText('Unlock this element to move, delete or group it.')).toBeVisible();
    await page.keyboard.press('ControlOrMeta+l');
    await expect.poll(() => readSlideSource('obj-group')).not.toContain('data-locked');
    await expect(canvas.locator('[data-slide-group][data-locked]')).toHaveCount(0);

    await page.keyboard.press('ControlOrMeta+Alt+Shift+g');
    await expect.poll(() => readSlideSource('obj-group')).not.toContain('data-slide-group');
    await expect
      .poll(async () => {
        const after = await frames();
        return after.every(
          (frame, i) =>
            Math.abs(frame.x - before[i].x) < 1.5 && Math.abs(frame.y - before[i].y) < 1.5,
        );
      })
      .toBe(true);
  });
});
