import { describe, expect, it } from 'vitest';
import { applyEditBatch } from './batch-edit.ts';
import { applyEdit } from './edit-ops.ts';
import { applyElementOp, type ElementEditResult, type ElementRefusal } from './remove-element.ts';

function locate(source: string, marker: string) {
  const offset = source.indexOf(marker);
  if (offset < 0) throw new Error(`Missing target: ${marker}`);
  const before = source.slice(0, offset);
  return { line: before.split('\n').length, column: offset - before.lastIndexOf('\n') - 1 };
}

function remove(source: string, marker: string, instanceCount?: number): ElementEditResult {
  const { line, column } = locate(source, marker);
  return applyElementOp(source, line, column, { kind: 'remove-element', instanceCount });
}

function removed(source: string, marker: string, instanceCount?: number): string {
  const result = remove(source, marker, instanceCount);
  if (!result.ok) throw new Error(result.error);
  return result.source;
}

function refusal(source: string, marker: string, instanceCount?: number): ElementRefusal | null {
  const result = remove(source, marker, instanceCount);
  return result.ok ? null : (result.code ?? null);
}

const page = (body: string) => `import type { Page } from '@open-slide/core';

const Cover: Page = () => (
  <section>
${body}
  </section>
);

export default [Cover] satisfies Page[];
`;

describe('remove-element', () => {
  it('removes an element on its own line with its indentation and newline', () => {
    const source = page('    <h1>Title</h1>\n    <p>Body</p>\n    <footer>End</footer>');
    expect(removed(source, '<p>')).toBe(page('    <h1>Title</h1>\n    <footer>End</footer>'));
  });

  it('removes a multi-line element and leaves bytes outside its lines untouched', () => {
    const before = page('    <h1>Title</h1>');
    const target =
      '    <div\n      style={{ color: "red" }}\n    >\n      <span>Inner</span>\n    </div>\n';
    const source = before.replace('    <h1>Title</h1>\n', `    <h1>Title</h1>\n${target}`);
    const result = remove(source, '<div');
    if (!result.ok) throw new Error(result.error);
    expect(result.source).toBe(before);
    expect(result.removed).toEqual({ offset: source.indexOf(target), text: target });
  });

  it('removes an inline element with one of its surrounding spaces', () => {
    const source = page('    <p>Before <b>bold</b> after</p>');
    expect(removed(source, '<b>')).toBe(page('    <p>Before after</p>'));
  });

  it('removes an inline element without adjacent spaces exactly', () => {
    const source = page('    <p><b>bold</b>after</p>');
    expect(removed(source, '<b>')).toBe(page('    <p>after</p>'));
  });

  it('joins surrounding text lines so their rendered spacing is unchanged', () => {
    const source = page('    <p>\n      Hello\n      <b>x</b>\n      world\n    </p>');
    expect(removed(source, '<b>')).toBe(page('    <p>\n      Helloworld\n    </p>'));
  });

  it('removes the last child of a fragment', () => {
    const source = 'const Cover = () => (\n  <>\n    <h1>Title</h1>\n  </>\n);\n';
    expect(removed(source, '<h1>')).toBe('const Cover = () => (\n  <>\n  </>\n);\n');
  });

  it('refuses a location with no element', () => {
    expect(refusal(page('    <h1>Title</h1>'), 'Title')).toBe('not-found');
  });

  it('refuses the page root', () => {
    expect(refusal(page('    <h1>Title</h1>'), '<section>')).toBe('root');
  });

  it('refuses a component root returned from a block body', () => {
    const source = 'function Card() {\n  return <div>Card</div>;\n}\n';
    expect(refusal(source, '<div>')).toBe('root');
  });

  it('refuses the sole child of an expression', () => {
    expect(refusal(page('    <Frame icon={<Star />} />'), '<Star')).toBe('expression');
    expect(refusal(page('    {<b>bold</b>}'), '<b>')).toBe('expression');
  });

  it('refuses conditional elements', () => {
    expect(refusal(page('    {show && <p>Maybe</p>}'), '<p>')).toBe('conditional');
    expect(refusal(page('    {show ? <p>Yes</p> : <p>No</p>}'), '<p>No')).toBe('conditional');
  });

  it('refuses elements inside a .map() callback', () => {
    const source = page(
      '    <ul>\n      {items.map((item) => (\n        <li key={item}>\n          <b>{item}</b>\n        </li>\n      ))}\n    </ul>',
    );
    expect(refusal(source, '<li')).toBe('map');
    expect(refusal(source, '<b>')).toBe('map');
  });

  it('refuses an element the client saw rendered more than once', () => {
    const source = page('    <h1>Title</h1>');
    expect(refusal(source, '<h1>', 2)).toBe('shared');
    expect(refusal(source, '<h1>', 1)).toBeNull();
  });

  it('refuses elements of a component used at several call sites', () => {
    const source = `const Badge = () => (
  <span>
    <b>New</b>
  </span>
);
const Cover = () => (
  <div>
    <Badge />
    <Badge />
  </div>
);
`;
    expect(refusal(source, '<b>')).toBe('shared');
  });

  it('refuses an element holding an inspector comment', () => {
    const source = page(
      '    <div>\n      {/* @slide-comment id="c-1a2b" ts="2026-01-01T00:00:00.000Z" text="aGk=" */}\n      <p>Body</p>\n    </div>',
    );
    expect(refusal(source, '<div>')).toBe('comment');
    expect(refusal(source, '<p>')).toBeNull();
  });

  it('restores the removed bytes at their offset', () => {
    const source = page('    <h1>Title</h1>\n    <p>Body</p>\n    <footer>End</footer>');
    const at = locate(source, '<p>');
    const result = remove(source, '<p>');
    if (!result.ok || !result.removed) throw new Error('remove failed');
    const restored = applyElementOp(result.source, at.line, at.column, {
      kind: 'restore-element',
      ...result.removed,
    });
    expect(restored).toEqual({ ok: true, source });
  });

  it('refuses a restore that would not put an element back at its location', () => {
    const source = page('    <h1>Title</h1>\n    <p>Body</p>');
    const at = locate(source, '<p>');
    const result = remove(source, '<p>');
    if (!result.ok || !result.removed) throw new Error('remove failed');
    const shifted = `// edited\n${result.source}`;
    expect(
      applyElementOp(shifted, at.line, at.column, { kind: 'restore-element', ...result.removed }),
    ).toMatchObject({ ok: false, status: 409, code: 'stale' });
    expect(
      applyElementOp(result.source, at.line, at.column, {
        kind: 'restore-element',
        offset: result.source.length + 1,
        text: result.removed.text,
      }),
    ).toMatchObject({ ok: false, code: 'stale' });
  });

  it('is never applied through the buffered edit paths', () => {
    const source = page('    <h1>Title</h1>');
    const { line, column } = locate(source, '<h1>');
    const op = { kind: 'remove-element' } as never;
    expect(applyEdit(source, line, column, [op])).toMatchObject({ ok: false, status: 400 });
    const batch = applyEditBatch(source, [{ line, column, ops: [op] }]);
    expect(batch.source).toBe(source);
    expect(batch.results[0].ok).toBe(false);
  });
});
