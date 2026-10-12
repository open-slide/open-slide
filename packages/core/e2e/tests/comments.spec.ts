import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  readSlideSource,
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

    await expect(page.getByRole('button', { name: 'Comment 1', exact: true })).toBeVisible();
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
    await expect(page.getByRole('button', { name: 'Comment 2', exact: true })).toBeVisible();

    // The region marker lands in the page wrapper, which precedes the
    // headline in source, so pins are numbered by file order.
    const notes = payloads(await readSlideSource('cm-pins'));
    expect(notes.map((payload) => payload.note).sort()).toEqual([
      'Make it pop',
      'Tighten this area',
    ]);
    const elementIndex = notes.findIndex((payload) => payload.note === 'Make it pop');
    const element = notes[elementIndex];
    const region = notes.find((payload) => payload.note === 'Tighten this area');
    expect(element.rect).toBeUndefined();
    expect(element.page).toBe(0);
    const rect = region?.rect as { x: number; y: number; w: number; h: number };
    expect(rect).toMatchObject({ x: expect.any(Number), w: expect.any(Number) });
    expect(rect.w).toBeGreaterThan(600);

    const elementPin = page.getByRole('button', {
      name: `Comment ${elementIndex + 1}`,
      exact: true,
    });
    await elementPin.click();
    const card = page.locator('[data-comment-layer]').getByText('Make it pop');
    await expect(card).toBeVisible();
    await page.locator('[data-comment-layer]').getByRole('button', { name: 'Delete' }).click();
    await expect(card).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Comment 1', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comment 2', exact: true })).toHaveCount(0);
    const afterDelete = await readSlideSource('cm-pins');
    expect(payloads(afterDelete).map((p) => p.note)).toEqual(['Tighten this area']);
    expect(afterDelete).toContain('Editable headline</h1>');

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-comment-layer]')).toHaveCount(0);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
  });
});
