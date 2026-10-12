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

const MARKER_RE =
  /\{\/\*\s*@slide-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_-]+={0,2})"\s*\*\/\}/g;

function decodePayload(encoded: string): { note: string; rect?: unknown; page?: number } {
  const pad = encoded.length % 4 === 0 ? '' : '='.repeat(4 - (encoded.length % 4));
  const text = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString(
    'utf8',
  );
  return JSON.parse(text);
}

function payloads(source: string) {
  return [...source.matchAll(MARKER_RE)].map((match) => decodePayload(match[3]));
}

test.describe('comment mode', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  async function openCommentMode(page: Page, request: APIRequestContext, slideId: string) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await openSlide(page, slideId);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    await page.locator('[data-inspector-mode="comment"]').click();
    await expect(page.locator('[data-comment-layer]')).toBeVisible();
    await expect(page.locator('[data-inspector-ready]')).toHaveCount(0);
  }

  test('element and region comments float beside their targets', async ({ page, request }) => {
    await openCommentMode(page, request, 'cm-pins');

    await editorCanvas(page).getByText('Editable headline', { exact: true }).click();
    const composer = page.getByPlaceholder('Describe a change for the agent…');
    await expect(composer).toBeFocused();
    await composer.fill('Make it pop');
    await page.keyboard.press('ControlOrMeta+Enter');

    const elementPin = page.getByRole('button', { name: 'Make it pop', exact: true });
    await expect(elementPin).toBeVisible();
    await expect(composer).toHaveCount(0);
    await expect(page.getByText('1 comment')).toBeVisible();

    const canvas = await editorCanvas(page).locator('[data-osd-canvas]').boundingBox();
    if (!canvas) throw new Error('canvas not laid out');
    await page.mouse.move(canvas.x + canvas.width * 0.1, canvas.y + canvas.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(canvas.x + canvas.width * 0.5, canvas.y + canvas.height * 0.8, {
      steps: 8,
    });
    await page.mouse.up();
    await composer.fill('Tighten this area');
    await page.getByRole('button', { name: 'Post', exact: true }).click();
    const regionPin = page.getByRole('button', { name: 'Tighten this area', exact: true });
    await expect(regionPin).toBeVisible();
    // The hidden mobile rail renders a badge too, so scope to the first (desktop) one.
    await expect(page.locator('[data-page-comments="2"]').first()).toBeVisible();

    // The region marker lands in the page wrapper, which precedes the
    // headline in source, so pins are numbered by file order.
    const notes = payloads(await readSlideSource('cm-pins'));
    expect(notes.map((payload) => payload.note).sort()).toEqual([
      'Make it pop',
      'Tighten this area',
    ]);
    const element = notes.find((payload) => payload.note === 'Make it pop');
    const region = notes.find((payload) => payload.note === 'Tighten this area');
    expect(element?.rect).toBeUndefined();
    expect(element?.page).toBe(0);
    const rect = region?.rect as { x: number; y: number; w: number; h: number };
    expect(rect).toMatchObject({ x: expect.any(Number), w: expect.any(Number) });
    expect(rect.w).toBeGreaterThan(600);

    const layer = page.locator('[data-comment-layer]');
    await elementPin.hover();
    await expect(layer.locator('[data-comment-preview]')).toContainText('Make it pop');
    await expect(layer.locator('[data-comment-editor]')).toHaveCount(0);

    await elementPin.click();
    const editor = layer.locator('[data-comment-editor]');
    await expect(editor.getByRole('textbox')).toHaveValue('Make it pop');
    await editor.getByRole('textbox').fill('Make it pop more');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page.getByRole('button', { name: 'Make it pop more', exact: true })).toBeVisible();
    expect(
      payloads(await readSlideSource('cm-pins'))
        .map((p) => p.note)
        .sort(),
    ).toEqual(['Make it pop more', 'Tighten this area']);

    await page.getByRole('button', { name: 'Make it pop more', exact: true }).click();
    await editor.getByRole('button', { name: 'Delete' }).click();
    await expect(editor).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Make it pop more', exact: true })).toHaveCount(
      0,
    );
    await expect(regionPin).toBeVisible();
    await expect(page.locator('[data-page-comments="1"]').first()).toBeVisible();
    const afterDelete = await readSlideSource('cm-pins');
    expect(payloads(afterDelete).map((p) => p.note)).toEqual(['Tighten this area']);
    expect(afterDelete).toContain('Editable headline</h1>');

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-comment-layer]')).toHaveCount(0);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
  });

  test('region comments stay on the page they were left on', async ({ page, request }) => {
    createdSlides.push('cm-pages');
    await duplicateSlide(request, 'edit-target', 'cm-pages');
    await writeFile(
      slideSourcePath('cm-pages'),
      `import type { Page, SlideMeta } from '@open-slide/core';
export const meta: SlideMeta = { title: 'Paged', createdAt: '2026-01-01T00:00:00.000Z' };
const Frame = ({ title }: { title: string }) => (
  <div style={{ width: '100%', height: '100%', background: '#14213d', color: 'white', padding: 120 }}>
    <h1 style={{ fontSize: 96, margin: 0 }}>{title}</h1>
  </div>
);
const One: Page = () => <Frame title="First page" />;
const Two: Page = () => <Frame title="Second page" />;
export default [One, Two] satisfies Page[];
`,
    );
    await openSlide(page, 'cm-pages');
    await page.waitForLoadState('networkidle');
    await expect(editorCanvas(page).getByText('First page')).toBeVisible();
    await page.locator('[data-inspector-mode="comment"]').click();

    const canvas = await editorCanvas(page).locator('[data-osd-canvas]').boundingBox();
    if (!canvas) throw new Error('canvas not laid out');
    await page.mouse.move(canvas.x + canvas.width * 0.2, canvas.y + canvas.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(canvas.x + canvas.width * 0.6, canvas.y + canvas.height * 0.8, {
      steps: 8,
    });
    await page.mouse.up();
    await page.getByPlaceholder('Describe a change for the agent…').fill('Only here');
    await page.getByRole('button', { name: 'Post', exact: true }).click();
    const pin = page.getByRole('button', { name: 'Only here', exact: true });
    await expect(pin).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(editorCanvas(page).getByText('Second page')).toBeVisible();
    await expect(pin).toHaveCount(0);
    await expect(page.locator('[data-page-comments="1"]').first()).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(editorCanvas(page).getByText('First page')).toBeVisible();
    await expect(pin).toBeVisible();
  });
});
