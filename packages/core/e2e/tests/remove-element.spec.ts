import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  readSlideSource,
  slideSourcePath,
} from './helpers.ts';

test.describe('remove selected elements', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  async function openEditable(page: Page, request: APIRequestContext, slideId: string) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
  }

  for (const key of ['Backspace', 'Delete']) {
    test(`${key} removes the selected JSX child only after Save`, async ({ page, request }) => {
      const slideId = `remove-${key.toLowerCase()}`;
      await openEditable(page, request, slideId);
      const headline = editorCanvas(page).getByText('Editable headline', { exact: true });
      const body = editorCanvas(page).getByText('Editable body copy', { exact: true });
      const source = await readSlideSource(slideId);
      await expect(headline).toHaveAttribute('data-slide-delete', /^[a-f0-9]{64}$/);
      await headline.click();
      await page.keyboard.press(key);
      await expect(headline).toBeHidden();
      await expect(body).toBeVisible();
      await expect(page.getByText('1 unsaved change')).toBeVisible();
      expect(await readSlideSource(slideId)).toBe(source);

      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect(headline).toBeVisible();
      await page.getByRole('button', { name: 'Redo', exact: true }).click();
      await expect(headline).toBeHidden();
      await page.getByRole('button', { name: 'Discard', exact: true }).click();
      await expect(headline).toBeVisible();
      expect(await readSlideSource(slideId)).toBe(source);

      await headline.click();
      await page.keyboard.press(key);
      const saved = page.waitForResponse(
        (response) =>
          response.url().endsWith('/__edit/batch') && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      const response = await saved;
      expect(response.status()).toBe(200);
      expect((await response.json()).results).toEqual([{ ok: true }]);
      await expect.poll(() => readSlideSource(slideId)).not.toContain('<h1');
      await page.reload();
      await expect(headline).toHaveCount(0);
      await expect(body).toBeVisible();
    });
  }

  test('removes independent selections together and keeps the page root', async ({
    page,
    request,
  }) => {
    const slideId = 'remove-multiple';
    await openEditable(page, request, slideId);
    const headline = editorCanvas(page).getByText('Editable headline', { exact: true });
    const body = editorCanvas(page).getByText('Editable body copy', { exact: true });
    await headline.click();
    await body.click({ modifiers: ['Shift'] });
    await expect(
      page.locator('aside[data-inspector-ui]').getByText('2 elements selected'),
    ).toBeVisible();
    await page.keyboard.press('Backspace');
    await expect(headline).toBeHidden();
    await expect(body).toBeHidden();
    await expect(page.getByText('2 unsaved changes')).toBeVisible();
    const saved = page.waitForResponse((response) => response.url().endsWith('/__edit/batch'));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await (await saved).json()).results).toEqual([{ ok: true }, { ok: true }]);
    const source = await readSlideSource(slideId);
    expect(source).toContain('<div style={fill}>');
    expect(source).not.toContain('<h1');
    expect(source).not.toContain('<p');
    await page.reload();
    await expect(headline).toHaveCount(0);
    await expect(body).toHaveCount(0);
  });

  test('saves a child edit followed by removal of its parent', async ({ page, request }) => {
    const slideId = 'remove-edited-parent';
    await openEditable(page, request, slideId);
    await writeFile(
      slideSourcePath(slideId),
      (await readSlideSource(slideId)).replace(
        '<h1 style={{ fontSize: 96, margin: 0 }}>Editable headline</h1>',
        '<section style={{ padding: 24 }}><h1 style={{ fontSize: 96, margin: 0 }}>Editable headline</h1></section>',
      ),
    );
    const headline = editorCanvas(page).getByText('Editable headline', { exact: true });
    const parent = editorCanvas(page).locator('section');
    const source = await readSlideSource(slideId);
    await expect(parent).toHaveAttribute(
      'data-slide-delete',
      createHash('sha256').update(source).digest('hex'),
    );
    await headline.click();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('1 unsaved change')).toBeVisible();
    await page.getByRole('tab', { name: 'Arrange', exact: true }).click();
    await page.getByRole('button', { name: 'Select parent' }).click();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Backspace');
    await expect(parent).toBeHidden();
    const saved = page.waitForResponse((response) => response.url().endsWith('/__edit/batch'));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await (await saved).json()).results).toEqual([{ ok: true }, { ok: true }]);
    expect(await readSlideSource(slideId)).not.toContain('<section');
    await page.reload();
    await expect(parent).toHaveCount(0);
  });

  test('a pending removal survives page navigation and remains undoable', async ({
    page,
    request,
  }) => {
    const slideId = 'remove-remount';
    await openEditable(page, request, slideId);
    await writeFile(
      slideSourcePath(slideId),
      (await readSlideSource(slideId)).replace(
        'export default [Only] satisfies Page[];',
        'const Another: Page = () => <div>Another page</div>;\nexport default [Only, Another] satisfies Page[];',
      ),
    );
    const headline = editorCanvas(page).getByText('Editable headline', { exact: true });
    const source = await readSlideSource(slideId);
    await expect(headline).toHaveAttribute(
      'data-slide-delete',
      createHash('sha256').update(source).digest('hex'),
    );
    await headline.click();
    await page.keyboard.press('Backspace');
    await expect(headline).toBeHidden();
    await page.getByRole('button', { name: 'Go to page 2' }).click();
    await expect(editorCanvas(page).getByText('Another page')).toBeVisible();
    await page.getByRole('button', { name: 'Go to page 1' }).click();
    await expect(headline).toBeHidden();
    expect(await readSlideSource(slideId)).toBe(source);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(headline).toBeVisible();
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(headline).toBeHidden();
  });

  test('a React style update does not reveal a pending removal', async ({ page, request }) => {
    const slideId = 'remove-rerender';
    await openEditable(page, request, slideId);
    const source = `import { useEffect, useState } from 'react';
import type { Page } from '@open-slide/core';
const Only: Page = () => {
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    const update = () => setChanged(true);
    window.addEventListener('update-slide-style', update);
    return () => window.removeEventListener('update-slide-style', update);
  }, []);
  return <section><h1 style={{ display: changed ? 'inline-block' : 'block' }}>Editable headline</h1>{changed && <small>Style updated</small>}</section>;
};
export default [Only] satisfies Page[];
`;
    await writeFile(slideSourcePath(slideId), source);
    const headline = editorCanvas(page).getByText('Editable headline', { exact: true });
    await expect(headline).toHaveAttribute(
      'data-slide-delete',
      createHash('sha256').update(source).digest('hex'),
    );
    await headline.click();
    await page.keyboard.press('Delete');
    await expect(headline).toBeHidden();
    await page.evaluate(() => window.dispatchEvent(new Event('update-slide-style')));
    await expect.poll(() => headline.evaluate((el) => el.style.display)).toBe('inline-block');
    await expect(headline).toHaveCSS('display', 'none');
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await expect(headline).toHaveCSS('display', 'inline-block');
  });

  test('typing and inspector controls do not remove the selected element', async ({
    page,
    request,
  }) => {
    const slideId = 'remove-typing';
    await openEditable(page, request, slideId);
    const headline = editorCanvas(page).locator('h1');
    const source = await readSlideSource(slideId);
    await headline.click();
    await headline.dblclick();
    await expect(headline).toHaveAttribute('contenteditable', 'true');
    await headline.fill('Typing');
    await page.keyboard.press('Backspace');
    await expect(headline).toHaveText('Typin');
    await page.keyboard.press('Home');
    await page.keyboard.press('Delete');
    await expect(headline).toHaveText('ypin');
    await page.keyboard.press('Escape');
    const panel = page.locator('aside[data-inspector-ui]');
    const input = panel.getByPlaceholder('Element text');
    await input.fill('Input value');
    await input.press('Backspace');
    await expect(input).toHaveValue('Input valu');
    await input.press('Home');
    await input.press('Delete');
    await expect(input).toHaveValue('nput valu');
    await panel.getByRole('tab', { name: 'Arrange', exact: true }).click();
    await page.keyboard.press('Delete');
    await expect(headline).toBeVisible();
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    expect(await readSlideSource(slideId)).toBe(source);
  });

  test('stale source prevents removal through either edit route', async ({ page, request }) => {
    const slideId = 'remove-stale-route';
    await openEditable(page, request, slideId);
    const headline = editorCanvas(page).locator('h1');
    const loc = await headline.getAttribute('data-slide-loc');
    const revision = await headline.getAttribute('data-slide-delete');
    if (!loc || !revision) throw new Error('Expected a removable JSX child');
    const [line, column] = loc.split(':').map(Number);
    const changed = (await readSlideSource(slideId)).replace('Editable body copy', 'Revised body');
    await writeFile(slideSourcePath(slideId), changed);
    const edit = { line, column, ops: [{ kind: 'remove-element', revision }] };
    const direct = await request.post('/__edit', { data: { slideId, ...edit } });
    expect(direct.status()).toBe(422);
    expect(await direct.json()).toMatchObject({ error: 'slide source changed since selection' });
    const batch = await request.post('/__edit/batch', { data: { slideId, edits: [edit] } });
    expect(batch.status()).toBe(200);
    expect(await batch.json()).toMatchObject({
      changed: false,
      results: [{ ok: false, error: 'slide source changed since selection' }],
    });
    expect(await readSlideSource(slideId)).toBe(changed);
  });

  test('an external source change restores the hidden preview and rejects Save', async ({
    page,
    request,
  }) => {
    const slideId = 'remove-stale-preview';
    await openEditable(page, request, slideId);
    const headline = editorCanvas(page).getByText('Editable headline', { exact: true });
    await headline.click();
    await page.keyboard.press('Delete');
    await expect(headline).toBeHidden();
    const changed = (await readSlideSource(slideId)).replace('Editable body copy', 'Revised body');
    await writeFile(slideSourcePath(slideId), changed);
    await expect(editorCanvas(page).getByText('Revised body', { exact: true })).toBeVisible();
    await expect(headline).toBeVisible();
    const saved = page.waitForResponse((response) => response.url().endsWith('/__edit/batch'));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await (await saved).json()).results).toEqual([
      { ok: false, error: 'slide source changed since selection' },
    ]);
    expect(await readSlideSource(slideId)).toBe(changed);
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await expect(headline).toBeVisible();
  });

  test('rejects page roots and shared component instances', async ({ page, request }) => {
    const slideId = 'remove-shared';
    await openEditable(page, request, slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import type { Page } from '@open-slide/core';
function Shared() { return <p>Shared body</p>; }
const Only: Page = () => <section><Shared /><Shared /><h1>Unique title</h1></section>;
export default [Only] satisfies Page[];
`,
    );
    await expect(editorCanvas(page).getByText('Unique title')).toBeVisible();
    const source = await readSlideSource(slideId);
    const root = editorCanvas(page).locator('section');
    const shared = editorCanvas(page).getByText('Shared body').first();
    await expect(root).not.toHaveAttribute('data-slide-delete', /./);
    await expect(shared).not.toHaveAttribute('data-slide-delete', /./);
    for (const target of [root, shared]) {
      await target.click();
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Delete');
      await expect(target).toBeVisible();
    }
    expect(await readSlideSource(slideId)).toBe(source);
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  });
});
