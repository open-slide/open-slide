import { describe, expect, it } from 'vitest';
import {
  b64urlDecode,
  b64urlEncode,
  buildMarker,
  findInsertion,
  parseMarkers,
  removeMarker,
  resolveTargets,
  updateMarkerNote,
} from './comments.ts';

describe('b64url encoding', () => {
  it('round-trips arbitrary unicode strings', () => {
    const samples = ['hello', '안녕하세요', '🎉🎊', 'a/b+c=d', JSON.stringify({ note: 'hi' })];
    for (const s of samples) {
      expect(b64urlDecode(b64urlEncode(s))).toBe(s);
    }
  });

  it('produces url-safe output (no +, /, or =)', () => {
    const encoded = b64urlEncode('subject?with/lots+of==special chars');
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('decodes the empty string', () => {
    expect(b64urlDecode('')).toBe('');
  });
});

describe('parseMarkers', () => {
  it('returns no comments when the source has no markers', () => {
    expect(parseMarkers('const a = 1;\nexport default [];\n')).toEqual([]);
  });

  it('extracts a single marker with its line number and decoded note', () => {
    const payload = b64urlEncode(JSON.stringify({ note: 'tighten this' }));
    const ts = '2026-04-25T00:00:00.000Z';
    const id = 'c-deadbeef';
    const source = [
      'export default [() => (',
      '  <div>',
      `    {/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`,
      '    hi',
      '  </div>',
      ')];',
      '',
    ].join('\n');

    const comments = parseMarkers(source);
    expect(comments).toEqual([{ id, line: 3, ts, note: 'tighten this', hint: undefined }]);
  });

  it('extracts a hint when the marker payload includes one', () => {
    const payload = b64urlEncode(JSON.stringify({ note: 'fix', hint: 'h1' }));
    const source = `{/* @slide-comment id="c-12345678" ts="2026-04-25T00:00:00.000Z" text="${payload}" */}`;
    const [c] = parseMarkers(source);
    expect(c.hint).toBe('h1');
    expect(c.note).toBe('fix');
  });

  it('skips markers whose payload is malformed', () => {
    const source =
      '{/* @slide-comment id="c-12345678" ts="2026-04-25T00:00:00.000Z" text="not_json" */}';
    expect(parseMarkers(source)).toEqual([]);
  });

  it('extracts multiple markers from different lines', () => {
    const p1 = b64urlEncode(JSON.stringify({ note: 'one' }));
    const p2 = b64urlEncode(JSON.stringify({ note: 'two' }));
    const source = [
      `{/* @slide-comment id="c-aaaaaaaa" ts="2026-04-25T00:00:00.000Z" text="${p1}" */}`,
      'const x = 1;',
      `{/* @slide-comment id="c-bbbbbbbb" ts="2026-04-25T00:00:00.000Z" text="${p2}" */}`,
    ].join('\n');

    const comments = parseMarkers(source);
    expect(comments.map((c) => c.note)).toEqual(['one', 'two']);
    expect(comments.map((c) => c.line)).toEqual([1, 3]);
  });
});

describe('region and page payloads', () => {
  const ts = '2026-04-25T00:00:00.000Z';
  const marker = (payload: Record<string, unknown>) =>
    `{/* @slide-comment id="c-abcdef01" ts="${ts}" text="${b64urlEncode(JSON.stringify(payload))}" */}`;

  it('reads a rounded rect and page index from the payload', () => {
    const [c] = parseMarkers(
      marker({ note: 'here', rect: { x: 10.4, y: 20.6, w: 300, h: 80 }, page: 2 }),
    );
    expect(c.rect).toEqual({ x: 10, y: 21, w: 300, h: 80 });
    expect(c.page).toBe(2);
  });

  it('drops malformed rects and pages', () => {
    const [c] = parseMarkers(marker({ note: 'here', rect: { x: 1, y: 2, w: 0, h: 5 }, page: -1 }));
    expect(c.rect).toBeUndefined();
    expect(c.page).toBeUndefined();
  });
});

describe('resolveTargets', () => {
  it('points each marker at the loc of its enclosing JSX element', () => {
    const payload = b64urlEncode(JSON.stringify({ note: 'x' }));
    const source = [
      'export default [() => (',
      '  <div>',
      '    <section style={{ padding: 4 }}>',
      `      {/* @slide-comment id="c-00000001" ts="t" text="${payload}" */}`,
      '      <img src="a.png" />',
      '    </section>',
      '  </div>',
      ')];',
    ].join('\n');
    const [c] = resolveTargets(source, parseMarkers(source), 'pages/01-a.tsx');
    expect(c.target).toEqual({ file: 'pages/01-a.tsx', line: 3, column: 4 });
  });

  it('skips fragments and resolves to the nearest JSX element', () => {
    const payload = b64urlEncode(JSON.stringify({ note: 'x' }));
    const source = [
      'export default [() => (',
      '  <main>',
      '    <>',
      `      {/* @slide-comment id="c-00000002" ts="t" text="${payload}" */}`,
      '      <p>hi</p>',
      '    </>',
      '  </main>',
      ')];',
    ].join('\n');
    const [c] = resolveTargets(source, parseMarkers(source), 'pages/01-a.tsx');
    expect(c.target).toEqual({ file: 'pages/01-a.tsx', line: 2, column: 2 });
  });

  it('yields a null target when no element encloses the marker', () => {
    const payload = b64urlEncode(JSON.stringify({ note: 'x' }));
    const source = `{/* @slide-comment id="c-00000003" ts="t" text="${payload}" */}\nconst a = 1;`;
    const [c] = resolveTargets(source, parseMarkers(source), 'pages/01-a.tsx');
    expect(c.target).toBeNull();
    expect(c.file).toBe('pages/01-a.tsx');
  });
});

describe('marker insertion and removal', () => {
  const ts = '2026-04-25T00:00:00.000Z';
  const encoded = b64urlEncode(JSON.stringify({ note: 'x' }));

  it('gives the marker its own line when content follows the opening tag', () => {
    const source = ['export default [() => (', '  <h1>Hello</h1>', ')];'].join('\n');
    const plan = findInsertion(source, 2, 2);
    expect(plan?.breakAfter).toBe(true);
    const marker = buildMarker(plan as NonNullable<typeof plan>, 'c-00000001', ts, encoded);
    const next = source.slice(0, plan?.offset) + marker + source.slice(plan?.offset);
    expect(next.split('\n')).toEqual([
      'export default [() => (',
      '  <h1>',
      `    {/* @slide-comment id="c-00000001" ts="${ts}" text="${encoded}" */}`,
      '    Hello</h1>',
      ')];',
    ]);
    expect(removeMarker(next, 'c-00000001')?.split('\n')).toEqual([
      'export default [() => (',
      '  <h1>',
      '    Hello</h1>',
      ')];',
    ]);
  });

  it('does not add a break when the opening tag already ends its line', () => {
    const source = ['export default [() => (', '  <div>', '    hi', '  </div>', ')];'].join('\n');
    const plan = findInsertion(source, 2, 2);
    expect(plan?.breakAfter).toBe(false);
    const marker = buildMarker(plan as NonNullable<typeof plan>, 'c-00000002', ts, encoded);
    const next = source.slice(0, plan?.offset) + marker + source.slice(plan?.offset);
    expect(next.split('\n')[2]).toMatch(/^ {4}\{\/\* @slide-comment/);
    expect(removeMarker(next, 'c-00000002')).toBe(source);
  });

  it('keeps content that shares a line with a legacy marker', () => {
    const source = `  <h1>\n    {/* @slide-comment id="c-00000003" ts="${ts}" text="${encoded}" */}Hello</h1>`;
    expect(removeMarker(source, 'c-00000003')).toBe('  <h1>\n    Hello</h1>');
    expect(removeMarker(source, 'c-ffffffff')).toBeNull();
  });
});

describe('updateMarkerNote', () => {
  it('replaces the note while keeping the rest of the payload', () => {
    const encoded = b64urlEncode(
      JSON.stringify({ note: 'old', rect: { x: 1, y: 2, w: 3, h: 4 }, page: 1 }),
    );
    const source = `<div>\n  {/* @slide-comment id="c-00000009" ts="t" text="${encoded}" */}\n</div>`;
    const next = updateMarkerNote(source, 'c-00000009', 'new');
    expect(next).not.toBeNull();
    const [c] = parseMarkers(next as string);
    expect(c).toMatchObject({
      id: 'c-00000009',
      note: 'new',
      rect: { x: 1, y: 2, w: 3, h: 4 },
      page: 1,
    });
    expect(updateMarkerNote(source, 'c-ffffffff', 'new')).toBeNull();
  });
});
