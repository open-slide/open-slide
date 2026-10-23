import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  duplicatePageAlignedElementInSource,
  duplicatePageInDefaultExportInSource,
  duplicateSlideDir,
  removePageAlignedElementInSource,
  removePageFromDefaultExportInSource,
  reorderDefaultExportPagesInSource,
  reorderPageAlignedArrayInSource,
  updateMetaTitleInSource,
  validateSlideName,
} from './slide-ops.ts';

async function withSlidesRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-test-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeSlide(root: string, id: string, title = id): Promise<void> {
  await fs.mkdir(path.join(root, id, 'assets'), { recursive: true });
  await fs.writeFile(
    path.join(root, id, 'index.tsx'),
    `export const meta = { title: '${title}' };\nexport default [];\n`,
    'utf8',
  );
  await fs.writeFile(path.join(root, id, 'assets', 'hero.txt'), 'hero', 'utf8');
}

describe('duplicateSlideDir', () => {
  it('duplicates a slide directory with an automatic copy id', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'cover', 'Cover');

      const result = await duplicateSlideDir(root, 'cover');

      expect(result).toEqual({ ok: true, slideId: 'cover-copy' });
      await expect(fs.readFile(path.join(root, 'cover-copy', 'index.tsx'), 'utf8')).resolves.toBe(
        `export const meta = { title: 'Cover (copy)' };\nexport default [];\n`,
      );
      await expect(
        fs.readFile(path.join(root, 'cover-copy', 'assets', 'hero.txt'), 'utf8'),
      ).resolves.toBe('hero');
    });
  });

  it('increments the automatic copy id when a copy already exists', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'cover');

      expect(await duplicateSlideDir(root, 'cover')).toEqual({ ok: true, slideId: 'cover-copy' });
      expect(await duplicateSlideDir(root, 'cover')).toEqual({
        ok: true,
        slideId: 'cover-copy-2',
      });
    });
  });

  it('rejects source slide ids with bad characters', async () => {
    await withSlidesRoot(async (root) => {
      expect(await duplicateSlideDir(root, 'bad id')).toMatchObject({ ok: false, status: 400 });
    });
  });

  it('rejects a desired id that differs only by case', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'cover');

      expect(await duplicateSlideDir(root, 'cover', 'Cover')).toMatchObject({
        ok: false,
        status: 409,
      });
      expect(await fs.readdir(root)).toEqual(['cover']);
    });
  });

  it('skips an automatic copy id that differs only by case', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'Cover');
      await writeSlide(root, 'cover-copy');

      expect(await duplicateSlideDir(root, 'Cover')).toEqual({
        ok: true,
        slideId: 'Cover-copy-2',
      });
      const names = await fs.readdir(root);
      expect(names.filter((name) => name.toLowerCase() === 'cover-copy')).toEqual(['cover-copy']);
      expect(names).toContain('Cover-copy-2');
    });
  });

  it('rejects an existing desired id', async () => {
    await withSlidesRoot(async (root) => {
      await writeSlide(root, 'cover');
      await writeSlide(root, 'target');

      expect(await duplicateSlideDir(root, 'cover', 'target')).toMatchObject({
        ok: false,
        status: 409,
      });
    });
  });

  it('rejects path traversal in the source slide id', async () => {
    await withSlidesRoot(async (root) => {
      expect(await duplicateSlideDir(root, '..')).toMatchObject({ ok: false, status: 400 });
    });
  });

  it('returns not found when the source slide does not exist', async () => {
    await withSlidesRoot(async (root) => {
      expect(await duplicateSlideDir(root, 'missing')).toMatchObject({ ok: false, status: 404 });
    });
  });
});

describe('validateSlideName', () => {
  it('accepts longer slide names than folder names', () => {
    expect(validateSlideName('x'.repeat(80))).toBe('x'.repeat(80));
    expect(validateSlideName('x'.repeat(81))).toBeNull();
  });

  it('rejects empty input', () => {
    expect(validateSlideName('')).toBeNull();
    expect(validateSlideName('   ')).toBeNull();
  });
});

describe('updateMetaTitleInSource', () => {
  it('replaces an existing single-quoted title literal', () => {
    const source = `export const meta: SlideMeta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
    expect(out).not.toContain("'old'");
  });

  it('replaces an existing double-quoted title literal', () => {
    const source = `export const meta = { title: "old" };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
  });

  it('escapes single quotes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, "it's new");
    expect(out).toContain("title: 'it\\'s new'");
  });

  it('escapes backslashes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'a\\b');
    expect(out).toContain("title: 'a\\\\b'");
  });

  it('injects a title into a meta object that lacks one', () => {
    const source = `export const meta = {\n  notes: 'x',\n};\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'first');
    expect(out).toMatch(/title:\s*'first'/);
    expect(out).toContain("notes: 'x'");
  });

  it('injects a fresh meta export when none exists', () => {
    const source = `export default [];\n`;
    const out = updateMetaTitleInSource(source, 'fresh');
    expect(out).toContain("export const meta: SlideMeta = { title: 'fresh' };");
    expect(out).toContain('export default []');
  });

  it('returns null if there is no meta and no default export', () => {
    expect(updateMetaTitleInSource('// nothing here', 'x')).toBeNull();
  });
});

describe('reorderDefaultExportPagesInSource', () => {
  const withSatisfies = `import type { Page } from '@open-slide/core';
const A = () => null;
const B = () => null;
const C = () => null;
export const meta = { title: 't' };
export default [
  A,
  B,
  C,
] satisfies Page[];
`;

  const withoutSatisfies = `const A = () => null;
const B = () => null;
const C = () => null;
export default [A, B, C];
`;

  it('reorders a 3-element multi-line array', () => {
    const out = reorderDefaultExportPagesInSource(withSatisfies, [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  C,\n  A,\n  B,\n] satisfies Page[];');
    // surrounding source untouched
    expect(out).toContain("import type { Page } from '@open-slide/core';");
    expect(out).toContain("export const meta = { title: 't' };");
  });

  it('reorders an inline array without satisfies', () => {
    const out = reorderDefaultExportPagesInSource(withoutSatisfies, [1, 2, 0]);
    expect(out).toContain('export default [B, C, A];');
  });

  it('is a no-op for the identity permutation (returns input unchanged)', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1, 2])).toBe(withSatisfies);
  });

  it('returns null on length mismatch', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1])).toBeNull();
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1, 2, 3])).toBeNull();
  });

  it('returns null on duplicate indices', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 0, 2])).toBeNull();
  });

  it('returns null on out-of-range indices', () => {
    expect(reorderDefaultExportPagesInSource(withSatisfies, [0, 1, 5])).toBeNull();
    expect(reorderDefaultExportPagesInSource(withSatisfies, [-1, 1, 2])).toBeNull();
  });

  it('returns null when the default export is not an array', () => {
    const source = `const A = () => null;\nexport default A;\n`;
    expect(reorderDefaultExportPagesInSource(source, [0])).toBeNull();
  });

  it('returns null when there is no default export', () => {
    expect(reorderDefaultExportPagesInSource('// nothing\n', [])).toBeNull();
  });

  it('returns the input unchanged for an empty array (zero-length identity)', () => {
    const empty = `export default [];\n`;
    expect(reorderDefaultExportPagesInSource(empty, [])).toBe(empty);
  });

  it('preserves the rest of the file (component bodies, imports, meta)', () => {
    const out = reorderDefaultExportPagesInSource(withSatisfies, [2, 1, 0]);
    expect(out).not.toBeNull();
    expect(out).toContain('const A = () => null;');
    expect(out).toContain('const B = () => null;');
    expect(out).toContain('const C = () => null;');
  });
});

describe('reorderPageAlignedArrayInSource', () => {
  it('returns the source unchanged when there is no notes export', () => {
    const source = `export default [];\n`;
    expect(reorderPageAlignedArrayInSource(source, 'notes', [])).toBe(source);
  });

  it('reorders notes alongside pages', () => {
    const source = [
      'export const notes: (string | undefined)[] = [',
      '  "first",',
      '  "second",',
      '  "third",',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'notes', [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain(
      'export const notes: (string | undefined)[] = [\n  "third",\n  "first",\n  "second",\n];',
    );
  });

  it('preserves template-literal notes verbatim', () => {
    const source = [
      'export const notes = [',
      '  `multi',
      'line`,',
      '  "second",',
      '];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'notes', [1, 0]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  "second",\n  `multi\nline`,\n];');
  });

  it('pads with undefined when notes is shorter than pages', () => {
    const source = ['export const notes = ["only"];', 'export default [A, B, C];', ''].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'notes', [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  undefined,\n  "only",\n];');
  });

  it('trims trailing undefined entries', () => {
    const source = [
      'export const notes = [',
      '  undefined,',
      '  "kept",',
      '  undefined,',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'notes', [2, 0, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  undefined,\n  undefined,\n  "kept",\n];');
  });

  it('collapses to [] when reorder leaves only undefineds', () => {
    const source = ['export const notes = [', '  "x",', '];', 'export default [A, B];', ''].join(
      '\n',
    );
    const out = reorderPageAlignedArrayInSource(source, 'notes', [1, 1]);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [];');
  });

  it('returns the source unchanged for an identity-like reorder of an empty notes array', () => {
    const source = `export const notes = [];\nexport default [A, B];\n`;
    expect(reorderPageAlignedArrayInSource(source, 'notes', [0, 1])).toBe(source);
  });

  it('returns null on out-of-range indices', () => {
    const source = `export const notes = ["a", "b"];\nexport default [A, B];\n`;
    expect(reorderPageAlignedArrayInSource(source, 'notes', [-1, 0])).toBeNull();
  });

  it('returns null when notes is not an array literal', () => {
    const source = `export const notes = "oops";\nexport default [A];\n`;
    expect(reorderPageAlignedArrayInSource(source, 'notes', [0])).toBeNull();
  });

  it('reorders durations and leaves notes to its own pass', () => {
    const source = [
      'export const notes = ["a", "b"];',
      'export const durations: (number | undefined)[] = [30, 60];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'durations', [1, 0]);
    expect(out).toContain('export const notes = ["a", "b"];');
    expect(out).toContain('export const durations: (number | undefined)[] = [\n  60,\n  30,\n];');
  });

  it('moves same-line and own-line comments with their entry', () => {
    const source = [
      'export const durations = [',
      '  // Part 1',
      '  30, // Cover',
      '  undefined, // Agenda',
      '  // Part 2',
      '  /* wrap-up */',
      '  90 /* mid */, // Closing',
      '  // end of talk',
      '];',
      'export default [Cover, Agenda, Closing];',
      '',
    ].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'durations', [2, 0, 1]);
    expect(out).toContain(
      [
        'export const durations = [',
        '  // Part 2',
        '  /* wrap-up */',
        '  90, /* mid */ // Closing',
        '  // Part 1',
        '  30, // Cover',
        '  undefined, // Agenda',
        '  // end of talk',
        '];',
      ].join('\n'),
    );
  });

  it('keeps comments inside an entry as part of its text', () => {
    const source = [
      'export const notes = [',
      '  `first`,',
      '  t(/* inline */ "second"),',
      '];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'notes', [1, 0]);
    expect(out).toContain('export const notes = [\n  t(/* inline */ "second"),\n  `first`,\n];');
  });

  it('keeps a commented trailing undefined', () => {
    const source = [
      'export const durations = [',
      '  30,',
      '  // TODO: budget the demo',
      '  undefined,',
      '];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = reorderPageAlignedArrayInSource(source, 'durations', [1, 0]);
    expect(out).toContain(
      'export const durations = [\n  // TODO: budget the demo\n  undefined,\n  30,\n];',
    );
  });

  it('is a no-op for an identity reorder of a commented array', () => {
    const source = [
      'export const durations = [',
      '  // Part 1',
      '  30, // Cover',
      '  45, // Agenda',
      '];',
      'export default [Cover, Agenda];',
      '',
    ].join('\n');
    expect(reorderPageAlignedArrayInSource(source, 'durations', [0, 1])).toBe(source);
  });
});

describe('removePageFromDefaultExportInSource', () => {
  const multiline = `import type { Page } from '@open-slide/core';
const A = () => null;
const B = () => null;
const C = () => null;
export default [
  A,
  B,
  C,
] satisfies Page[];
`;

  const inline = `const A = () => null;
const B = () => null;
const C = () => null;
export default [A, B, C];
`;

  it('removes the first element', () => {
    const out = removePageFromDefaultExportInSource(multiline, 0);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  B,\n  C,\n] satisfies Page[];');
  });

  it('removes a middle element', () => {
    const out = removePageFromDefaultExportInSource(multiline, 1);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  A,\n  C,\n] satisfies Page[];');
  });

  it('removes the last element', () => {
    const out = removePageFromDefaultExportInSource(multiline, 2);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  A,\n  B,\n] satisfies Page[];');
  });

  it('handles inline arrays', () => {
    expect(removePageFromDefaultExportInSource(inline, 1)).toContain('export default [A, C];');
  });

  it('collapses to an empty array when removing the only element', () => {
    const single = `const A = () => null;\nexport default [A];\n`;
    const out = removePageFromDefaultExportInSource(single, 0);
    expect(out).toContain('export default [];');
  });

  it('returns null on out-of-range indices', () => {
    expect(removePageFromDefaultExportInSource(multiline, -1)).toBeNull();
    expect(removePageFromDefaultExportInSource(multiline, 3)).toBeNull();
  });

  it('returns null when the default export is not an array', () => {
    expect(removePageFromDefaultExportInSource(`export default A;\n`, 0)).toBeNull();
  });
});

describe('duplicatePageInDefaultExportInSource', () => {
  const multiline = `import type { Page } from '@open-slide/core';
const A = () => null;
const B = () => null;
const C = () => null;
export default [
  A,
  B,
  C,
] satisfies Page[];
`;

  const inline = `const A = () => null;\nconst B = () => null;\nexport default [A, B];\n`;

  it('duplicates a middle element after itself', () => {
    const out = duplicatePageInDefaultExportInSource(multiline, 1);
    expect(out).not.toBeNull();
    expect(out).toContain('export default [\n  A,\n  B,\n  B,\n  C,\n] satisfies Page[];');
  });

  it('duplicates the first element', () => {
    const out = duplicatePageInDefaultExportInSource(multiline, 0);
    expect(out).toContain('export default [\n  A,\n  A,\n  B,\n  C,\n] satisfies Page[];');
  });

  it('duplicates the last element', () => {
    const out = duplicatePageInDefaultExportInSource(multiline, 2);
    expect(out).toContain('export default [\n  A,\n  B,\n  C,\n  C,\n] satisfies Page[];');
  });

  it('handles inline arrays', () => {
    expect(duplicatePageInDefaultExportInSource(inline, 0)).toContain('export default [A, A, B];');
  });

  it('duplicates the only element in a single-element array', () => {
    const single = `const A = () => null;\nexport default [A];\n`;
    const out = duplicatePageInDefaultExportInSource(single, 0);
    expect(out).toContain('export default [A, A];');
  });

  it('returns null on out-of-range indices', () => {
    expect(duplicatePageInDefaultExportInSource(multiline, -1)).toBeNull();
    expect(duplicatePageInDefaultExportInSource(multiline, 3)).toBeNull();
  });

  it('returns null when the default export is not an array', () => {
    expect(duplicatePageInDefaultExportInSource(`export default A;\n`, 0)).toBeNull();
  });
});

describe('removePageAlignedElementInSource', () => {
  it('returns the source unchanged when there is no notes export', () => {
    const source = `export default [A, B];\n`;
    expect(removePageAlignedElementInSource(source, 'notes', 0)).toBe(source);
  });

  it('removes the note aligned with the deleted page', () => {
    const source = [
      'export const notes = [',
      '  "first",',
      '  "second",',
      '  "third",',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = removePageAlignedElementInSource(source, 'notes', 1);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [\n  "first",\n  "third",\n];');
  });

  it('leaves notes untouched when the deleted page is past the recorded notes', () => {
    const source = ['export const notes = ["only"];', 'export default [A, B, C];', ''].join('\n');
    expect(removePageAlignedElementInSource(source, 'notes', 2)).toBe(source);
  });

  it('collapses to [] when the last remaining note is removed', () => {
    const source = ['export const notes = ["x"];', 'export default [A, B];', ''].join('\n');
    const out = removePageAlignedElementInSource(source, 'notes', 0);
    expect(out).not.toBeNull();
    expect(out).toContain('export const notes = [];');
  });

  it('returns null on a negative index', () => {
    const source = `export const notes = ["a", "b"];\nexport default [A, B];\n`;
    expect(removePageAlignedElementInSource(source, 'notes', -1)).toBeNull();
  });

  it('returns null when notes is not an array literal', () => {
    const source = `export const notes = "oops";\nexport default [A];\n`;
    expect(removePageAlignedElementInSource(source, 'notes', 0)).toBeNull();
  });

  it('removes a duration and its comment', () => {
    const source = [
      'export const durations = [',
      '  30, // Cover',
      '  45, // Agenda',
      '  90, // Demo',
      '];',
      'export default [Cover, Agenda, Demo];',
      '',
    ].join('\n');
    const out = removePageAlignedElementInSource(source, 'durations', 1);
    expect(out).toContain('export const durations = [\n  30, // Cover\n  90, // Demo\n];');
  });

  it('hands own-line comments of the removed entry to the next one', () => {
    const source = [
      'export const durations = [',
      '  30, // Cover',
      '  // Part 2',
      '  45, // Agenda',
      '  90, // Demo',
      '];',
      'export default [Cover, Agenda, Demo];',
      '',
    ].join('\n');
    const out = removePageAlignedElementInSource(source, 'durations', 1);
    expect(out).toContain(
      'export const durations = [\n  30, // Cover\n  // Part 2\n  90, // Demo\n];',
    );
  });

  it('keeps own-line comments of a removed last entry at the end', () => {
    const source = [
      'export const durations = [',
      '  30,',
      '  // Closing',
      '  90,',
      '];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = removePageAlignedElementInSource(source, 'durations', 1);
    expect(out).toContain('export const durations = [\n  30,\n  // Closing\n];');
  });
});

describe('duplicatePageAlignedElementInSource', () => {
  it('returns the source unchanged when there is no notes export', () => {
    const source = `export default [A, B];\n`;
    expect(duplicatePageAlignedElementInSource(source, 'notes', 0)).toBe(source);
  });

  it('inserts a copy of the duplicated page note right after it', () => {
    const source = [
      'export const notes = [',
      '  "first",',
      '  "second",',
      '  "third",',
      '];',
      'export default [A, B, C];',
      '',
    ].join('\n');
    const out = duplicatePageAlignedElementInSource(source, 'notes', 1);
    expect(out).not.toBeNull();
    expect(out).toContain(
      'export const notes = [\n  "first",\n  "second",\n  "second",\n  "third",\n];',
    );
  });

  it('preserves template-literal notes verbatim when duplicating', () => {
    const source = [
      'export const notes = [',
      '  `multi',
      'line`,',
      '  "second",',
      '];',
      'export default [A, B];',
      '',
    ].join('\n');
    const out = duplicatePageAlignedElementInSource(source, 'notes', 0);
    expect(out).not.toBeNull();
    expect(out).toContain(
      'export const notes = [\n  `multi\nline`,\n  `multi\nline`,\n  "second",\n];',
    );
  });

  it('leaves notes untouched when the duplicated page is past the recorded notes', () => {
    const source = ['export const notes = ["only"];', 'export default [A, B, C];', ''].join('\n');
    expect(duplicatePageAlignedElementInSource(source, 'notes', 2)).toBe(source);
  });

  it('returns null on a negative index', () => {
    const source = `export const notes = ["a", "b"];\nexport default [A, B];\n`;
    expect(duplicatePageAlignedElementInSource(source, 'notes', -1)).toBeNull();
  });

  it('returns null when notes is not an array literal', () => {
    const source = `export const notes = "oops";\nexport default [A];\n`;
    expect(duplicatePageAlignedElementInSource(source, 'notes', 0)).toBeNull();
  });

  it('duplicates a duration along with its comment', () => {
    const source = [
      'export const durations = [',
      '  30, // Cover',
      '  90, // Demo',
      '];',
      'export default [Cover, Demo];',
      '',
    ].join('\n');
    const out = duplicatePageAlignedElementInSource(source, 'durations', 1);
    expect(out).toContain(
      'export const durations = [\n  30, // Cover\n  90, // Demo\n  90, // Demo\n];',
    );
  });

  it('does not copy own-line comments onto the duplicate', () => {
    const source = [
      'export const durations = [',
      '  // Part 1',
      '  30, // Cover',
      '];',
      'export default [Cover];',
      '',
    ].join('\n');
    const out = duplicatePageAlignedElementInSource(source, 'durations', 0);
    expect(out).toContain(
      'export const durations = [\n  // Part 1\n  30, // Cover\n  30, // Cover\n];',
    );
  });
});
