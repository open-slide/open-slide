import { describe, expect, it } from 'vitest';
import type { PageLayoutText } from '../app/lib/structure.ts';
import { insertPageInSource } from './page-layouts.ts';

const copy: PageLayoutText = {
  title: 'Title',
  subtitle: 'Subtitle',
  body: 'Body',
  quote: 'Quote',
  attribution: 'Someone',
  imageHint: 'Image',
};

const deck = [
  "import type { Page } from '@open-slide/core';",
  '',
  'const A: Page = () => <div>A</div>;',
  'const B: Page = () => <div>B</div>;',
  '',
  "export const notes = ['a', 'b'];",
  '',
  'export default [',
  '  A,',
  '  B,',
  '] satisfies Page[];',
  '',
].join('\n');

describe('insertPageInSource', () => {
  it('adds a typed page component after the given page', () => {
    const r = insertPageInSource(deck, 0, 'title', copy);
    if (!r.ok) throw new Error(r.error);
    expect(r.index).toBe(1);
    expect(r.source).toContain('const Slide3: Page = () => (');
    expect(r.source).toContain('export default [\n  A,\n  Slide3,\n  B,\n] satisfies Page[];');
    expect(r.source).toContain('>Title</h1>');
    expect(r.source).toContain("export const notes = [\n  'a',\n  undefined,\n  'b',\n];");
  });

  it('appends after the last page and prepends with -1', () => {
    const last = insertPageInSource(deck, 1, 'blank', copy);
    if (!last.ok) throw new Error(last.error);
    expect(last.source).toContain('  A,\n  B,\n  Slide3,\n]');
    const first = insertPageInSource(deck, -1, 'blank', copy);
    if (!first.ok) throw new Error(first.error);
    expect(first.source).toContain('[\n  Slide3, A,');
    expect(first.index).toBe(0);
  });

  it('imports ImagePlaceholder for the image layout', () => {
    const r = insertPageInSource(deck, 1, 'image', copy);
    if (!r.ok) throw new Error(r.error);
    expect(r.source).toContain("import { ImagePlaceholder } from '@open-slide/core';");
    expect(r.source).toContain('<ImagePlaceholder hint="Image" width={960} height={720}');
  });

  it('picks a free component name and escapes copy', () => {
    const taken = deck.replace('const B:', 'const Slide3 = 1;\nconst B:');
    const r = insertPageInSource(taken, 1, 'quote', { ...copy, quote: 'a {b}' });
    if (!r.ok) throw new Error(r.error);
    expect(r.source).toContain('const Slide4: Page');
    expect(r.source).toContain("{'a {b}'}");
  });

  it('works without a Page type import', () => {
    const plain = 'const A = () => <div />;\nexport default [A];\n';
    const r = insertPageInSource(plain, 0, 'blank', copy);
    if (!r.ok) throw new Error(r.error);
    expect(r.source).toContain('const Slide2 = () => (');
    expect(r.source).toContain('export default [A, Slide2];');
  });
});
