import { PAGE_LAYOUTS, type PageLayout, type PageLayoutText } from '../app/lib/structure.ts';
import { parseSource } from './babel-walk.ts';
import { applySplices, jsString, type Splice } from './edit-ops.ts';
import { findDefaultExportArray, insertNotesElementInSource } from './slide-ops.ts';
import { coreImportSplice, formatStyleObject, type StyleMap } from './structure-ops.ts';

const ROOT: StyleMap = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  background: 'var(--osd-bg, #ffffff)',
  color: 'var(--osd-text, #111111)',
};

const DISPLAY = 'var(--osd-font-display, inherit)';
const BODY = 'var(--osd-font-body, inherit)';

function box(left: number, top: number, width: number, style: StyleMap): StyleMap {
  return { position: 'absolute', left, top, width, margin: 0, ...style };
}

function text(tag: string, style: StyleMap, value: string): string {
  const content =
    /^[^{}<>]*$/.test(value) && value.trim() === value ? value : `{${jsString(value)}}`;
  return `<${tag} style={${formatStyleObject(style)}}>${content}</${tag}>`;
}

const heading = (left: number, top: number, width: number, fontSize: number) =>
  box(left, top, width, { fontFamily: DISPLAY, fontSize, fontWeight: 700, lineHeight: 1.05 });

const paragraph = (left: number, top: number, width: number, fontSize = 44) =>
  box(left, top, width, { fontFamily: BODY, fontSize, lineHeight: 1.4 });

function layoutChildren(layout: PageLayout, copy: PageLayoutText): string[] {
  switch (layout) {
    case 'title':
      return [
        text('h1', heading(160, 380, 1600, 128), copy.title),
        text('p', { ...paragraph(160, 560, 1600), opacity: 0.7 }, copy.subtitle),
      ];
    case 'title-body':
      return [
        text('h2', heading(160, 140, 1600, 80), copy.title),
        text('p', paragraph(160, 300, 1600), copy.body),
      ];
    case 'section':
      return [
        `<div style={${formatStyleObject({ position: 'absolute', left: 160, top: 430, width: 120, height: 12, background: 'var(--osd-accent, #3b82f6)' })}} />`,
        text('h2', heading(160, 480, 1600, 104), copy.title),
      ];
    case 'two-column':
      return [
        text('h2', heading(160, 140, 1600, 80), copy.title),
        text('p', paragraph(160, 300, 760), copy.body),
        text('p', paragraph(1000, 300, 760), copy.body),
      ];
    case 'image':
      return [
        `<ImagePlaceholder hint=${JSON.stringify(copy.imageHint)} width={960} height={720} style={${formatStyleObject({ position: 'absolute', left: 160, top: 180 })}} />`,
        text('h2', heading(1200, 300, 560, 72), copy.title),
        text('p', paragraph(1200, 460, 560, 36), copy.body),
      ];
    case 'quote':
      return [
        text(
          'p',
          box(160, 300, 1600, {
            fontFamily: DISPLAY,
            fontSize: 88,
            fontStyle: 'italic',
            lineHeight: 1.2,
          }),
          copy.quote,
        ),
        text('p', { ...paragraph(160, 700, 1600, 40), opacity: 0.7 }, copy.attribution),
      ];
    default:
      return [];
  }
}

export function pageLayoutJsx(layout: PageLayout, copy: PageLayoutText, indent: string): string {
  const children = layoutChildren(layout, copy);
  const open = `<div style={${formatStyleObject(ROOT)}}>`;
  if (children.length === 0) return `<div style={${formatStyleObject(ROOT)}} />`;
  return [open, ...children.map((child) => `${indent}  ${child}`), `${indent}</div>`].join('\n');
}

function uniqueName(source: string, start: number): string {
  for (let n = start; ; n++) {
    const name = `Slide${n}`;
    if (!new RegExp(`\\b${name}\\b`).test(source)) return name;
  }
}

export type InsertPageResult =
  | { ok: true; source: string; index: number }
  | { ok: false; status: number; error: string };

// Adds a new page component built from `layout` and lists it in the default
// export right after page `after` (-1 puts it first).
export function insertPageInSource(
  source: string,
  after: number,
  layout: PageLayout,
  copy: PageLayoutText,
): InsertPageResult {
  if (!PAGE_LAYOUTS.includes(layout)) return { ok: false, status: 400, error: 'unknown layout' };
  const ast = parseSource(source);
  const found = findDefaultExportArray(source);
  if (!ast || !found) {
    return { ok: false, status: 422, error: 'default export must be an array of pages' };
  }
  const { elements, arrayStart } = found;
  if (!Number.isInteger(after) || after < -1 || after >= elements.length) {
    return { ok: false, status: 400, error: 'invalid page index' };
  }
  const exportStatement = ast.program.body.find((node) => node.type === 'ExportDefaultDeclaration');
  if (!exportStatement || exportStatement.start == null) {
    return { ok: false, status: 422, error: 'could not find the default export' };
  }

  const name = uniqueName(source, elements.length + 1);
  const typed = /\bPage\b/.test(
    ast.program.body
      .filter((node) => node.type === 'ImportDeclaration')
      .map((node) => source.slice(node.start ?? 0, node.end ?? 0))
      .join('\n'),
  );
  const component = `const ${name}${typed ? ': Page' : ''} = () => (\n  ${pageLayoutJsx(layout, copy, '  ')}\n);\n\n`;
  const splices: Splice[] = [
    { from: exportStatement.start, to: exportStatement.start, text: component },
  ];

  if (elements.length === 0) {
    splices.push({ from: arrayStart + 1, to: arrayStart + 1, text: name });
  } else if (after === -1) {
    splices.push({ from: elements[0].start, to: elements[0].start, text: `${name}, ` });
  } else {
    const prev = elements[after];
    const separator =
      after + 1 < elements.length
        ? source.slice(prev.end, elements[after + 1].start)
        : elements.length > 1
          ? source.slice(elements[0].end, elements[1].start)
          : ', ';
    splices.push({ from: prev.end, to: prev.end, text: `${separator}${name}` });
  }

  if (layout === 'image') {
    const importSplice = coreImportSplice(ast, source, 'ImagePlaceholder');
    if (importSplice && 'error' in importSplice) {
      return { ok: false, status: 422, error: importSplice.error };
    }
    if (importSplice) splices.push(importSplice);
  }

  const applied = applySplices(source, splices);
  if (!applied.ok) return applied;
  const index = after + 1;
  const withNotes = insertNotesElementInSource(applied.source, index);
  if (withNotes === null) {
    return { ok: false, status: 422, error: 'could not keep speaker notes aligned' };
  }
  return { ok: true, source: withNotes, index };
}
