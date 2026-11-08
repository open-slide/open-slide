import { describe, expect, it } from 'vitest';
import { applyStructureOp, copyElements, type StructureResult } from './structure-ops.ts';

function ok(result: StructureResult) {
  if (!result.ok) throw new Error(`expected ok, got ${result.error}`);
  return result;
}

function lineAt(source: string, line: number): string {
  return source.split('\n')[line - 1] ?? '';
}

const deck = [
  "import type { Page } from '@open-slide/core';",
  '',
  'const Cover: Page = () => (',
  "  <div style={{ width: '100%', height: '100%' }}>",
  '    <h1>Hello</h1>',
  '    <p>World</p>',
  '  </div>',
  ');',
  '',
  'export default [Cover] satisfies Page[];',
  '',
].join('\n');

describe('insert', () => {
  it('appends a text box as the last child of the page root', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'insert',
        pageIndex: 0,
        element: {
          type: 'text',
          text: 'New text',
          style: { position: 'absolute', left: 100, top: 80, fontSize: 48 },
        },
      }),
    );
    expect(r.source).toContain(
      [
        '    <p>World</p>',
        "    <div style={{ position: 'absolute', left: 100, top: 80, fontSize: 48 }}>New text</div>",
        '  </div>',
      ].join('\n'),
    );
    expect(r.created).toEqual([{ line: 7, column: 4 }]);
    expect(lineAt(r.source, 7).slice(4, 8)).toBe('<div');
  });

  it('opens a self-closing host root to append into it', () => {
    const src = [
      "import type { Page } from '@open-slide/core';",
      "const Blank: Page = () => <div style={{ width: '100%', height: '100%', background: '#ffffff' }} />;",
      'export default [Blank] satisfies Page[];',
      '',
    ].join('\n');
    const r = ok(
      applyStructureOp(src, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'text', text: 'Hi', style: { position: 'absolute' } },
      }),
    );
    expect(r.source).toContain(
      [
        "const Blank: Page = () => <div style={{ width: '100%', height: '100%', background: '#ffffff' }}>",
        "  <div style={{ position: 'absolute' }}>Hi</div>",
        '</div>;',
      ].join('\n'),
    );
    expect(r.created).toEqual([{ line: 3, column: 2 }]);
  });

  it('appends into a component root with children', () => {
    const src = [
      'const Slide: Page = () => {',
      '  const x = 1;',
      '  return (',
      '    <Stage>',
      '      <h1>Title</h1>',
      '    </Stage>',
      '  );',
      '};',
      'export default [Slide];',
      '',
    ].join('\n');
    const r = ok(
      applyStructureOp(src, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'text', text: 'Body', style: {} },
      }),
    );
    expect(r.source).toContain(
      ['      <h1>Title</h1>', '      <div style={{}}>Body</div>', '    </Stage>'].join('\n'),
    );
    expect(r.created).toEqual([{ line: 6, column: 6 }]);
  });

  it('wraps a self-closing component root in a fragment', () => {
    const src = ['const Slide = () => <Hero title="x" />;', 'export default [Slide];', ''].join(
      '\n',
    );
    const r = ok(
      applyStructureOp(src, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'text', text: 'Note', style: {} },
      }),
    );
    expect(r.source).toBe(
      [
        'const Slide = () => <>',
        '  <Hero title="x" />',
        '  <div style={{}}>Note</div>',
        '</>;',
        'export default [Slide];',
        '',
      ].join('\n'),
    );
    expect(r.created).toEqual([{ line: 3, column: 2 }]);
  });

  it('targets the requested page and inline page functions', () => {
    const src = [
      'const A = () => <div>A</div>;',
      'export default [A, () => <section>B</section>];',
      '',
    ].join('\n');
    const r = ok(
      applyStructureOp(src, {
        kind: 'insert',
        pageIndex: 1,
        element: { type: 'text', text: 'C', style: {} },
      }),
    );
    expect(r.source).toContain('const A = () => <div>A</div>;');
    expect(r.source).toContain('<section>B\n  <div style={{}}>C</div>\n</section>');
  });

  it('escapes text that JSX cannot hold literally and keeps line breaks', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'text', text: 'a {b}\nnext', style: {} },
      }),
    );
    expect(r.source).toContain("<div style={{}}>{'a {b}'}<br />next</div>");
  });

  it('adds Shape to an existing @open-slide/core value import', () => {
    const src = [
      "import { type Page, Steps } from '@open-slide/core';",
      'const A: Page = () => <div />;',
      'export default [A];',
      '',
    ].join('\n');
    const r = ok(
      applyStructureOp(src, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'shape', kind: 'star', fill: '#ff0000', style: { width: 200 } },
      }),
    );
    expect(r.source).toContain("import { type Page, Steps, Shape } from '@open-slide/core';");
    expect(r.source).toContain('<Shape kind="star" fill="#ff0000" style={{ width: 200 }} />');
    expect(r.created).toHaveLength(1);
    const line = lineAt(r.source, r.created[0].line);
    expect(line.slice(r.created[0].column)).toMatch(/^<Shape /);
  });

  it('adds a new import when only type imports exist', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'shape', kind: 'rect', style: {} },
      }),
    );
    expect(
      r.source.startsWith(
        "import type { Page } from '@open-slide/core';\nimport { Shape } from '@open-slide/core';\n",
      ),
    ).toBe(true);
    const line = lineAt(r.source, r.created[0].line);
    expect(line.slice(r.created[0].column)).toMatch(/^<Shape kind="rect"/);
  });

  it('refuses a Shape import that would collide with a local binding', () => {
    const src = ['const Shape = 1;', 'const A = () => <div />;', 'export default [A];', ''].join(
      '\n',
    );
    const r = applyStructureOp(src, {
      kind: 'insert',
      pageIndex: 0,
      element: { type: 'shape', kind: 'rect', style: {} },
    });
    expect(r.ok).toBe(false);
  });

  it('imports an image asset and references it', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'image', assetPath: './assets/hero-shot.png', style: { width: 400 } },
      }),
    );
    expect(r.source).toContain("import heroShot from './assets/hero-shot.png';");
    expect(r.source).toContain('<img src={heroShot} alt="" style={{ width: 400 }} />');
    const line = lineAt(r.source, r.created[0].line);
    expect(line.slice(r.created[0].column)).toMatch(/^<img /);
  });

  it('pastes a JSX snippet re-indented, with a style override', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'insert',
        pageIndex: 0,
        element: {
          type: 'jsx',
          code: '<section style={{ left: 10 }}>\n  <b>x</b>\n</section>',
          style: { left: '30px' },
        },
      }),
    );
    expect(r.source).toContain(
      [
        "    <section style={{ left: '30px' }}>",
        '      <b>x</b>',
        '    </section>',
        '  </div>',
      ].join('\n'),
    );
  });

  it('rejects a pasted snippet that reads identifiers the deck lacks', () => {
    const r = applyStructureOp(deck, {
      kind: 'insert',
      pageIndex: 0,
      element: { type: 'jsx', code: '<p style={{ color: C.accent }}>{item.title}</p>' },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/C, item|item, C/);
  });

  it('accepts a pasted snippet whose identifiers resolve or are local', () => {
    const src = [
      'const C = { accent: "red" };',
      'const A = () => <div />;',
      'export default [A];',
      '',
    ].join('\n');
    const r = applyStructureOp(src, {
      kind: 'insert',
      pageIndex: 0,
      element: {
        type: 'jsx',
        code: '<ul style={{ color: C.accent }}>{[1, 2].map((n) => <li key={n}>{Math.max(n, 1)}</li>)}</ul>',
      },
    });
    expect(r.ok).toBe(true);
  });

  it('leaves template literal contents untouched when re-indenting', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'insert',
        pageIndex: 0,
        element: { type: 'jsx', code: '<pre>\n  {`a\nb`}\n</pre>' },
      }),
    );
    expect(r.source).toContain('    <pre>\n      {`a\nb`}\n    </pre>');
  });
});

describe('delete', () => {
  it('removes an element along with its line', () => {
    const r = ok(applyStructureOp(deck, { kind: 'delete', targets: [{ line: 5, column: 4 }] }));
    expect(r.source).toContain(
      ["  <div style={{ width: '100%', height: '100%' }}>", '    <p>World</p>', '  </div>'].join(
        '\n',
      ),
    );
  });

  it('removes several elements and skips descendants of removed ones', () => {
    const src = [
      'const A = () => (',
      '  <div>',
      '    <section>',
      '      <h1>x</h1>',
      '    </section>',
      '    <p>y</p>',
      '    <i>z</i>',
      '  </div>',
      ');',
      'export default [A];',
      '',
    ].join('\n');
    const r = ok(
      applyStructureOp(src, {
        kind: 'delete',
        targets: [
          { line: 4, column: 6 },
          { line: 3, column: 4 },
          { line: 7, column: 4 },
        ],
      }),
    );
    expect(r.source).toBe(
      [
        'const A = () => (',
        '  <div>',
        '    <p>y</p>',
        '  </div>',
        ');',
        'export default [A];',
        '',
      ].join('\n'),
    );
  });

  it('removes an inline element without touching its siblings', () => {
    const src = ['const A = () => <div><b>x</b><i>y</i></div>;', 'export default [A];', ''].join(
      '\n',
    );
    const r = ok(applyStructureOp(src, { kind: 'delete', targets: [{ line: 1, column: 21 }] }));
    expect(r.source).toContain('<div><i>y</i></div>');
  });

  it('refuses elements that are not direct JSX children', () => {
    const src = ['const A = () => <div>{show && <b>x</b>}</div>;', 'export default [A];', ''].join(
      '\n',
    );
    const r = applyStructureOp(src, { kind: 'delete', targets: [{ line: 1, column: 30 }] });
    expect(r.ok).toBe(false);
  });

  it('refuses the page root', () => {
    const r = applyStructureOp(deck, { kind: 'delete', targets: [{ line: 4, column: 2 }] });
    expect(r.ok).toBe(false);
  });
});

describe('locked elements', () => {
  const locked = deck.replace('<p>World</p>', '<p data-locked>World</p>');

  it('refuses to delete them', () => {
    const r = applyStructureOp(locked, { kind: 'delete', targets: [{ line: 6, column: 4 }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('element is locked');
  });

  it('still duplicates them', () => {
    const r = applyStructureOp(locked, { kind: 'duplicate', targets: [{ line: 6, column: 4 }] });
    expect(r.ok).toBe(true);
  });
});

describe('duplicate', () => {
  it('inserts a copy after the original with a style override', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'duplicate',
        targets: [{ line: 6, column: 4 }],
        style: { translate: '20px 20px' },
      }),
    );
    expect(r.source).toContain(
      ['    <p>World</p>', "    <p style={{ translate: '20px 20px' }}>World</p>", '  </div>'].join(
        '\n',
      ),
    );
    expect(r.created).toEqual([{ line: 7, column: 4 }]);
  });

  it('reports every copy location when duplicating several elements', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'duplicate',
        targets: [
          { line: 5, column: 4 },
          { line: 6, column: 4 },
        ],
      }),
    );
    const lines = r.source.split('\n');
    expect(lines.slice(4, 8)).toEqual([
      '    <h1>Hello</h1>',
      '    <h1>Hello</h1>',
      '    <p>World</p>',
      '    <p>World</p>',
    ]);
    expect(r.created).toEqual([
      { line: 6, column: 4 },
      { line: 8, column: 4 },
    ]);
  });
});

describe('group and ungroup', () => {
  it('wraps siblings in a positioned div and restyles each child', () => {
    const r = ok(
      applyStructureOp(deck, {
        kind: 'group',
        targets: [
          { line: 6, column: 4 },
          { line: 5, column: 4 },
        ],
        style: { position: 'absolute', left: 10, top: 20, width: 300, height: 200 },
        childStyles: [{ left: '0px' }, { left: '5px' }],
      }),
    );
    expect(r.source).toContain(
      [
        "  <div style={{ width: '100%', height: '100%' }}>",
        "    <div data-slide-group style={{ position: 'absolute', left: 10, top: 20, width: 300, height: 200 }}>",
        "      <h1 style={{ left: '5px' }}>Hello</h1>",
        "      <p style={{ left: '0px' }}>World</p>",
        '    </div>',
        '  </div>',
      ].join('\n'),
    );
    expect(r.created).toEqual([{ line: 5, column: 4 }]);
  });

  it('refuses to group elements with different parents', () => {
    const src = [
      'const A = () => (',
      '  <div>',
      '    <section>',
      '      <h1>x</h1>',
      '    </section>',
      '    <p>y</p>',
      '  </div>',
      ');',
      'export default [A];',
      '',
    ].join('\n');
    const r = applyStructureOp(src, {
      kind: 'group',
      targets: [
        { line: 4, column: 6 },
        { line: 6, column: 4 },
      ],
      style: {},
    });
    expect(r.ok).toBe(false);
  });

  it('round-trips a group back to its children', () => {
    const grouped = ok(
      applyStructureOp(deck, {
        kind: 'group',
        targets: [
          { line: 5, column: 4 },
          { line: 6, column: 4 },
        ],
        style: { position: 'absolute' },
      }),
    );
    const r = ok(
      applyStructureOp(grouped.source, {
        kind: 'ungroup',
        target: grouped.created[0],
        childStyles: [{ color: 'red' }],
      }),
    );
    expect(r.source).toContain(
      [
        "  <div style={{ width: '100%', height: '100%' }}>",
        "    <h1 style={{ color: 'red' }}>Hello</h1>",
        '    <p>World</p>',
        '  </div>',
      ].join('\n'),
    );
    expect(r.created).toEqual([
      { line: 5, column: 4 },
      { line: 6, column: 4 },
    ]);
  });
});

describe('copyElements', () => {
  it('returns each element dedented to column zero', () => {
    const src = [
      'const A = () => (',
      '  <div>',
      '    <section>',
      '      <b>x</b>',
      '    </section>',
      '  </div>',
      ');',
      'export default [A];',
      '',
    ].join('\n');
    const r = copyElements(src, [{ line: 3, column: 4 }]);
    if (!r.ok) throw new Error(r.error);
    expect(r.snippets).toEqual(['<section>\n  <b>x</b>\n</section>']);
  });
});
