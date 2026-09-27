import { writeFile } from 'node:fs/promises';
import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import {
  deleteSlide,
  duplicateSlide,
  editorCanvas,
  openSlide,
  slideSourcePath,
} from './helpers.ts';

test.describe('inspector history target resolution', () => {
  const createdSlides: string[] = [];

  test.afterEach(async ({ page, request }) => {
    await page.close();
    for (const id of createdSlides.splice(0)) await deleteSlide(request, id);
  });

  async function openHistoryFixture(page: Page, request: APIRequestContext, slideId: string) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import { createElement, useRef } from 'react';
import { type Page, type SlideMeta, useIsActivePage } from '@open-slide/core';
import { useHistory } from '@/components/history-provider';
import { useInspector } from '@/components/inspector/inspector-provider';
import type { EditOp } from '@/lib/inspector/use-editor';
export const meta: SlideMeta = { title: 'Inspector history', createdAt: '2026-01-01T00:00:00.000Z' };
function Harness() {
  const childRef = useRef<HTMLSpanElement>(null);
  const { bufferOps } = useInspector();
  const { undo, redo } = useHistory();
  const edit = (op: EditOp) => {
    const child = childRef.current;
    const parent = child?.parentElement;
    if (!child || !parent?.dataset.slideLoc) throw new Error('Missing history fixture target');
    const [line, column] = parent.dataset.slideLoc.split(':').map(Number);
    bufferOps(line, column, child, [op]);
  };
  return (
    <div style={{ padding: 80, fontFamily: 'system-ui', fontSize: 32, fontWeight: 400 }}>
      <p data-testid="history-text">Before {createElement('span', { ref: childRef }, 'tail')}</p>
      <div data-inspector-ui style={{ display: 'flex', gap: 24 }}>
        <button type="button" onClick={() => edit({ kind: 'set-text', value: 'After tail', prevText: 'Before tail' })}>Change text</button>
        <button type="button" onClick={() => edit({ kind: 'set-text-range-style', start: 0, end: 6, key: 'fontWeight', value: '700' })}>Format prefix</button>
        <button type="button" onClick={undo}>Undo fixture edit</button>
        <button type="button" onClick={redo}>Redo fixture edit</button>
      </div>
    </div>
  );
}
const Only: Page = () => useIsActivePage() ? <Harness /> : null;
export default [Only] satisfies Page[];
`,
    );
    await openSlide(page, slideId);
    const text = editorCanvas(page).getByTestId('history-text');
    await expect(text).toHaveText('Before tail');
    await page.waitForLoadState('networkidle');
    return text;
  }

  async function openStyleHistoryFixture(page: Page, request: APIRequestContext, slideId: string) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import { type RefObject, useRef } from 'react';
import { type Page, type SlideMeta, useIsActivePage } from '@open-slide/core';
import { useHistory } from '@/components/history-provider';
import { readEditableText, useInspector } from '@/components/inspector/inspector-provider';
import type { EditOp } from '@/lib/inspector/use-editor';
export const meta: SlideMeta = { title: 'Style history', createdAt: '2026-01-01T00:00:00.000Z' };
function Text({ value, nodeRef }: { value: string; nodeRef: RefObject<HTMLParagraphElement | null> }) {
  return <p ref={nodeRef}>{value}</p>;
}
function Harness() {
  const firstRef = useRef<HTMLParagraphElement>(null);
  const secondRef = useRef<HTMLParagraphElement>(null);
  const { bufferOps } = useInspector();
  const { undo } = useHistory();
  const edit = (node: HTMLParagraphElement | null, op: Extract<EditOp, { kind: 'set-style' | 'set-text' }>) => {
    if (!node?.dataset.slideLoc) throw new Error('Missing style fixture target');
    const [line, column] = node.dataset.slideLoc.split(':').map(Number);
    bufferOps(line, column, node, [{ ...op, prevText: readEditableText(node) }]);
  };
  return (
    <div style={{ padding: 80, fontFamily: 'system-ui', fontSize: 32, fontStyle: 'normal' }}>
      <Text nodeRef={firstRef} value="Before first" />
      <Text nodeRef={secondRef} value="Second" />
      <div data-inspector-ui style={{ display: 'flex', gap: 12, fontSize: 20 }}>
        <button type="button" onClick={() => edit(firstRef.current, { kind: 'set-style', key: 'fontSize', value: '40px' })}>Set first size</button>
        <button type="button" onClick={() => edit(firstRef.current, { kind: 'set-text', value: 'After first' })}>Rename first</button>
        <button type="button" onClick={() => edit(secondRef.current, { kind: 'set-style', key: 'fontStyle', value: 'italic' })}>Italicize shared text</button>
        <button type="button" onClick={() => edit(firstRef.current, { kind: 'set-style', key: 'fontSize', value: '60px' })}>Replace first size</button>
        <button type="button" onClick={undo}>Undo fixture edit</button>
      </div>
    </div>
  );
}
const Only: Page = () => useIsActivePage() ? <Harness /> : null;
export default [Only] satisfies Page[];
`,
    );
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    const paragraphs = editorCanvas(page).locator('p');
    await expect(paragraphs).toHaveText(['Before first', 'Second']);
    await page.waitForLoadState('networkidle');
    return paragraphs;
  }

  async function openPagedHistoryFixture(
    page: Page,
    request: APIRequestContext,
    slideId: string,
    withTransition: boolean,
  ) {
    createdSlides.push(slideId);
    await duplicateSlide(request, 'edit-target', slideId);
    await writeFile(
      slideSourcePath(slideId),
      `import { type RefObject, useRef } from 'react';
import { type Page, type SlideMeta, useIsActivePage } from '@open-slide/core';
import { readEditableText, useInspector } from '@/components/inspector/inspector-provider';
export const meta: SlideMeta = { title: 'Paged history', createdAt: '2026-01-01T00:00:00.000Z' };
function Title({ value, nodeRef }: { value: string; nodeRef: RefObject<HTMLHeadingElement | null> }) {
  return <h2 data-testid="paged-title" ref={nodeRef}>{value}</h2>;
}
function Controls({ value, titleRef }: { value: string; titleRef: RefObject<HTMLHeadingElement | null> }) {
  const { bufferOps, selected } = useInspector();
  const rename = () => {
    const node = titleRef.current;
    if (!node?.dataset.slideLoc) throw new Error('Missing paged fixture target');
    const [line, column] = node.dataset.slideLoc.split(':').map(Number);
    bufferOps(line, column, node, [{ kind: 'set-text', value: \`\${value} edited\`, prevText: readEditableText(node) }]);
  };
  return (
    <div data-inspector-ui>
      <button type="button" onClick={rename}>Rename title</button>
      <output data-testid="paged-selection">{selected?.anchor === titleRef.current ? 'title' : 'none'}</output>
    </div>
  );
}
function Harness({ value }: { value: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <div style={{ padding: 80, fontFamily: 'system-ui', fontSize: 32 }}>
      <Title nodeRef={titleRef} value={value} />
      {useIsActivePage() && <Controls value={value} titleRef={titleRef} />}
    </div>
  );
}
const One: Page = () => <Harness value="Page one" />;
const Two: Page = () => <Harness value="Page two" />;
export default [One, Two] satisfies Page[];
${
  withTransition
    ? `export const transition = {
  duration: 2000,
  exit: { duration: 2000, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 2000, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};
`
    : ''
}`,
    );
    // The suite runs with reduced motion, which skips page transitions.
    if (withTransition) await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openSlide(page, slideId);
    await expect(page.locator('[data-inspector-ready]')).toBeVisible();
    // During a transition the outgoing page still renders its title first.
    const title = editorCanvas(page).getByTestId('paged-title').last();
    await expect(title).toHaveText('Page one');
    await page.waitForLoadState('networkidle');
    return title;
  }

  for (const withTransition of [false, true]) {
    test(`undo and redo bring the edited page back into view and select the edit${withTransition ? ' mid-transition' : ''}`, async ({
      page,
      request,
    }) => {
      const title = await openPagedHistoryFixture(
        page,
        request,
        withTransition ? 'history-cross-page-transition' : 'history-cross-page',
        withTransition,
      );
      const rename = editorCanvas(page).getByRole('button', { name: 'Rename title', exact: true });
      const selection = editorCanvas(page).getByTestId('paged-selection');
      const releaseFocus = () =>
        page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      const expectRevealed = async (url: RegExp, text: string) => {
        await expect(page).toHaveURL(url);
        await expect(title).toHaveText(text);
        await expect(selection).toHaveText('title');
        await expect(page.locator('[data-selection-frame]')).toHaveCount(1);
      };
      // Read once, without retrying: the reveal must land while the page we
      // left is still animating out, not after it unmounts.
      const expectMidTransition = async () => {
        if (withTransition)
          expect(await editorCanvas(page).getByTestId('paged-title').count()).toBe(2);
      };

      await rename.click();
      await expect(title).toHaveText('Page one edited');
      await releaseFocus();
      await page.keyboard.press('ArrowRight');
      await expect(page).toHaveURL(/[?&]p=2/);
      await expect(title).toHaveText('Page two');
      await rename.click();
      await expect(title).toHaveText('Page two edited');
      await expect(selection).toHaveText('none');
      await releaseFocus();

      await page.keyboard.press('ControlOrMeta+z');
      await expectRevealed(/[?&]p=2/, 'Page two');
      await page.keyboard.press('ControlOrMeta+z');
      await expectRevealed(/[?&]p=1/, 'Page one');
      await expectMidTransition();

      await page.keyboard.press('ControlOrMeta+Shift+z');
      await expectRevealed(/[?&]p=1/, 'Page one edited');
      await page.keyboard.press('ControlOrMeta+Shift+z');
      await expectRevealed(/[?&]p=2/, 'Page two edited');
      await expectMidTransition();
    });
  }

  test('text redo uses the resolved parent when buffering from an untagged child', async ({
    page,
    request,
  }) => {
    const text = await openHistoryFixture(page, request, 'history-resolved-text');

    await editorCanvas(page).getByRole('button', { name: 'Change text', exact: true }).click();
    await expect(text).toHaveText('After tail');
    await expect(text.locator('span')).toHaveText('tail');

    await editorCanvas(page)
      .getByRole('button', { name: 'Undo fixture edit', exact: true })
      .click();
    await expect(text).toHaveText('Before tail');
    await editorCanvas(page)
      .getByRole('button', { name: 'Redo fixture edit', exact: true })
      .click();
    await expect(text).toHaveText('After tail');
    await expect(text.locator('span')).toHaveText('tail');
  });

  test('range-style redo restores the same parent text range', async ({ page, request }) => {
    const text = await openHistoryFixture(page, request, 'history-resolved-range-style');
    const prefix = text.getByText('Before', { exact: true });
    const tail = text.getByText('tail', { exact: true });

    await editorCanvas(page).getByRole('button', { name: 'Format prefix', exact: true }).click();
    await expect(prefix).toHaveCSS('font-weight', '700');
    await expect(tail).toHaveCSS('font-weight', '400');

    await editorCanvas(page)
      .getByRole('button', { name: 'Undo fixture edit', exact: true })
      .click();
    await expect(text.locator('[style]')).toHaveCount(0);
    await editorCanvas(page)
      .getByRole('button', { name: 'Redo fixture edit', exact: true })
      .click();
    await expect(prefix).toHaveCSS('font-weight', '700');
    await expect(tail).toHaveCSS('font-weight', '400');
    await expect(text).toHaveText('Before tail');
  });

  for (const sharedStyle of [false, true]) {
    test(
      sharedStyle
        ? 'undo preserves style chronology across text edits and shared component instances'
        : 'undo restores a prior style before the text edit that followed it',
      async ({ page, request }) => {
        const slideId = sharedStyle ? 'history-shared-style-order' : 'history-style-text-order';
        const paragraphs = await openStyleHistoryFixture(page, request, slideId);
        const controls = editorCanvas(page);
        await controls.getByRole('button', { name: 'Set first size', exact: true }).click();
        await expect(paragraphs.first()).toHaveCSS('font-size', '40px');
        await controls.getByRole('button', { name: 'Rename first', exact: true }).click();
        await expect(paragraphs.first()).toHaveText('After first');
        if (sharedStyle) {
          await controls
            .getByRole('button', { name: 'Italicize shared text', exact: true })
            .click();
          await expect(paragraphs.last()).toHaveCSS('font-style', 'italic');
        }
        await controls.getByRole('button', { name: 'Replace first size', exact: true }).click();
        await expect(paragraphs.first()).toHaveCSS('font-size', '60px');
        await controls.getByRole('button', { name: 'Undo fixture edit', exact: true }).click();
        await expect(paragraphs.first()).toHaveCSS('font-size', '40px');
        await expect(paragraphs.first()).toHaveText('After first');

        const saved = page.waitForResponse(
          (response) =>
            response.url().endsWith('/__edit/batch') && response.request().method() === 'POST',
        );
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        const response = await saved;
        expect(response.status()).toBe(200);
        const result = (await response.json()) as { results: { ok: boolean; error?: string }[] };
        expect(result.results.filter((entry) => !entry.ok)).toEqual([]);
        const sent = response.request().postDataJSON() as {
          edits: { line: number; column: number; ops: unknown[] }[];
        };
        expect(sent.edits.flatMap((edit) => edit.ops)).toEqual([
          { kind: 'set-style', key: 'fontSize', value: '40px', prevText: 'Before first' },
          { kind: 'set-text', value: 'After first', prevText: 'Before first' },
          ...(sharedStyle
            ? [{ kind: 'set-style', key: 'fontStyle', value: 'italic', prevText: 'Second' }]
            : []),
        ]);
        expect(new Set(sent.edits.map((edit) => `${edit.line}:${edit.column}`)).size).toBe(1);

        await page.reload();
        await expect(paragraphs).toHaveText(['After first', 'Second']);
        for (const paragraph of await paragraphs.all()) {
          await expect(paragraph).toHaveCSS('font-size', '40px');
          await expect(paragraph).toHaveCSS('font-style', sharedStyle ? 'italic' : 'normal');
        }
      },
    );
  }
});
