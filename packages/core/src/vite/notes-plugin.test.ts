import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  reorderDefaultExportPagesInSource,
  reorderNotesArrayInSource,
} from '../editing/slide-ops.ts';
import { withFileLock } from './file-lock.ts';
import { applyNotesEdit, renderNoteLiteral, saveNotes } from './notes-plugin.ts';
import { hasRecentWrite, RECENT_WRITE_WINDOW_MS, recordWrite } from './recent-writes.ts';

describe('renderNoteLiteral', () => {
  it('returns undefined for empty strings', () => {
    expect(renderNoteLiteral('')).toBe('undefined');
  });

  it('uses JSON-quoted strings for single-line text', () => {
    expect(renderNoteLiteral('hello')).toBe('"hello"');
    expect(renderNoteLiteral('with "quotes"')).toBe('"with \\"quotes\\""');
  });

  it('uses template literals for multi-line text and escapes specials', () => {
    expect(renderNoteLiteral('a\nb')).toBe('`a\nb`');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
    expect(renderNoteLiteral('back`tick\nand ${interp}')).toBe('`back\\`tick\nand \\${interp}`');
    expect(renderNoteLiteral('back\\slash\nhere')).toBe('`back\\\\slash\nhere`');
  });
});

describe('applyNotesEdit / no existing export', () => {
  it('inserts a new notes export padded to the target index', () => {
    const source = `import type { Page } from '@open-slide/core';\n\nexport default [];\n`;
    const result = applyNotesEdit(source, 2, 'hello');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain(
      'export const notes: (string | undefined)[] = [\n' +
        '  undefined,\n' +
        '  undefined,\n' +
        '  "hello",\n' +
        '];',
    );
  });

  it('places the export after the last import', () => {
    const source = `import a from 'a';\nimport b from 'b';\n\nexport default [];\n`;
    const result = applyNotesEdit(source, 0, 'first');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const importEnd = result.source.indexOf("import b from 'b';") + "import b from 'b';".length;
    const exportStart = result.source.indexOf('export const notes');
    expect(exportStart).toBeGreaterThan(importEnd);
    expect(result.source.indexOf('export default [];')).toBeGreaterThan(exportStart);
  });

  it('is a no-op when text is empty and there is no export', () => {
    const source = `export default [];\n`;
    const result = applyNotesEdit(source, 3, '');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toBe(source);
  });
});

describe('applyNotesEdit / existing export', () => {
  it('updates an existing slot in place', () => {
    const source = [
      "import type { Page } from '@open-slide/core';",
      '',
      'export default [];',
      '',
      'export const notes = [',
      '  "old",',
      '  undefined,',
      '];',
      '',
    ].join('\n');
    const result = applyNotesEdit(source, 0, 'new');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('"new"');
    expect(result.source).not.toContain('"old"');
  });

  it('pads with undefined when extending past current length', () => {
    const source = `export const notes = ["a"];\nexport default [];\n`;
    const result = applyNotesEdit(source, 3, 'd');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('[\n  "a",\n  undefined,\n  undefined,\n  "d",\n]');
  });

  it('clears a slot back to undefined and trims trailing undefined entries', () => {
    const source = `export const notes = ["a", "b", "c"];\nexport default [];\n`;
    const result = applyNotesEdit(source, 2, '');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('[\n  "a",\n  "b",\n]');
    expect(result.source).not.toContain('"c"');
  });

  it('preserves existing element source formatting (template literals, comments)', () => {
    const original = '`multi\nline old`';
    const source = `export const notes = [\n  ${original},\n  "kept",\n];\n`;
    const result = applyNotesEdit(source, 0, 'replaced');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain('"replaced"');
    expect(result.source).toContain('"kept"');
    expect(result.source).not.toContain('multi\nline old');
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
  it('round-trips strings with backticks and ${} via template literals', () => {
    const source = `export const notes = [];\n`;
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
    const text = 'has `backticks` and ${vars}\nover lines';
    const result = applyNotesEdit(source, 0, text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal `${}` is the test input
    expect(result.source).toContain('`has \\`backticks\\` and \\${vars}\nover lines`');
  });

  it('rejects non-array notes export', () => {
    const source = `export const notes = "oops";\n`;
    const result = applyNotesEdit(source, 0, 'x');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
  });
});

describe('applyNotesEdit / unparseable source', () => {
  it('rejects a source whose syntax error the parser only recovered from', () => {
    // `notes` itself is well-formed; the damage is elsewhere in the module, so
    // errorRecovery would still hand back offsets to splice by.
    const source = [
      "export const notes = ['first'];",
      'const a = 1 const b = 2',
      'export default [];',
      '',
    ].join('\n');
    const r = applyNotesEdit(source, 0, 'second');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(422);
  });
});

describe('recent-writes window', () => {
  it('reports a freshly recorded write as recent for the whole window', () => {
    const file = '/slides/recent-a/index.tsx';
    const now = 1_000_000;
    recordWrite(file, now);
    expect(hasRecentWrite(file, now)).toBe(true);
    expect(hasRecentWrite(file, now + RECENT_WRITE_WINDOW_MS - 1)).toBe(true);
  });

  it('treats an unrecorded file as not recent', () => {
    expect(hasRecentWrite('/slides/never-written/index.tsx', 1)).toBe(false);
  });

  it('expires entries after the window so a later genuine edit is not suppressed', () => {
    const file = '/slides/recent-b/index.tsx';
    const now = 2_000_000;
    recordWrite(file, now);
    expect(hasRecentWrite(file, now + RECENT_WRITE_WINDOW_MS)).toBe(false);
    // The expired entry is pruned, so a subsequent check stays false too.
    expect(hasRecentWrite(file, now + RECENT_WRITE_WINDOW_MS + 5_000)).toBe(false);
  });
});

describe('saveNotes', () => {
  async function slideFile(source: string) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-notes-'));
    const file = path.join(dir, 'index.tsx');
    await fs.writeFile(file, source, 'utf8');
    return file;
  }

  it('keeps every edit when saves to one file run in parallel', async () => {
    const file = await slideFile('export default [A, B, C];\n');
    const results = await Promise.all([
      saveNotes(file, 0, 'zero'),
      saveNotes(file, 1, 'one'),
      saveNotes(file, 2, 'two'),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    const source = await fs.readFile(file, 'utf8');
    expect(source).toContain('"zero",\n  "one",\n  "two",');
  });

  it('applies a save queued behind a page reorder to the reordered file', async () => {
    const file = await slideFile('export default [A, B];\n\nexport const notes = ["a", "b"];\n');
    let release = () => {};
    let read = () => {};
    const sourceRead = new Promise<void>((resolve) => (read = resolve));
    const reorder = withFileLock(file, async () => {
      const source = await fs.readFile(file, 'utf8');
      const released = new Promise<void>((resolve) => (release = resolve));
      read();
      await released;
      const pages = reorderDefaultExportPagesInSource(source, [1, 0]);
      const next = pages && reorderNotesArrayInSource(pages, [1, 0]);
      if (next) await fs.writeFile(file, next, 'utf8');
    });
    const save = saveNotes(file, 0, 'b2');
    await sourceRead;
    release();
    await Promise.all([reorder, save]);
    const source = await fs.readFile(file, 'utf8');
    expect(source).toContain('export default [B, A]');
    expect(source).toContain('"b2",\n  "a",');
  });
});
