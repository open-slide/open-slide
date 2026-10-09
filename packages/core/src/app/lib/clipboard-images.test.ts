import { describe, expect, it, vi } from 'vitest';
import {
  imageFilesFromClipboard,
  isEditableTarget,
  namePastedImages,
  pastedImageStem,
} from './clipboard-images.ts';

vi.mock('virtual:open-slide/slides', () => ({
  slideIds: [],
  slideThemes: {},
  slideCreatedAt: {},
  loadSlide: async () => ({}),
}));

const png = (name: string) => new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });

function clipboard({
  files = [],
  items = [],
}: {
  files?: File[];
  items?: { kind: string; type: string; file: File | null }[];
}): DataTransfer {
  return {
    files: Object.assign([...files], { item: (i: number) => files[i] ?? null }),
    items: items.map((it) => ({ kind: it.kind, type: it.type, getAsFile: () => it.file })),
  } as unknown as DataTransfer;
}

describe('imageFilesFromClipboard', () => {
  it('returns image files and skips other types', () => {
    const text = new File(['hi'], 'notes.txt', { type: 'text/plain' });
    const shot = png('image.png');
    expect(imageFilesFromClipboard(clipboard({ files: [text, shot] }))).toEqual([shot]);
  });

  it('does not read items when files already has the image', () => {
    const shot = png('image.png');
    const data = clipboard({
      files: [shot],
      items: [{ kind: 'file', type: 'image/png', file: shot }],
    });
    expect(imageFilesFromClipboard(data)).toHaveLength(1);
  });

  it('falls back to items when files is empty', () => {
    const shot = png('image.png');
    const data = clipboard({
      items: [
        { kind: 'string', type: 'text/plain', file: null },
        { kind: 'file', type: 'image/png', file: shot },
      ],
    });
    expect(imageFilesFromClipboard(data)).toEqual([shot]);
  });

  it('handles a missing payload', () => {
    expect(imageFilesFromClipboard(null)).toEqual([]);
  });
});

describe('isEditableTarget', () => {
  const el = (tagName: string, extra: Record<string, unknown> = {}) =>
    ({ tagName, ...extra }) as unknown as EventTarget;

  it('treats text fields and contenteditable as editable', () => {
    expect(isEditableTarget(el('INPUT'))).toBe(true);
    expect(isEditableTarget(el('input', { type: 'search' }))).toBe(true);
    expect(isEditableTarget(el('TEXTAREA'))).toBe(true);
    expect(isEditableTarget(el('DIV', { isContentEditable: true }))).toBe(true);
  });

  it('does not treat buttons, file inputs or the body as editable', () => {
    expect(isEditableTarget(el('INPUT', { type: 'file' }))).toBe(false);
    expect(isEditableTarget(el('BUTTON'))).toBe(false);
    expect(isEditableTarget(el('BODY'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe('pastedImageStem', () => {
  it('formats a sortable local timestamp', () => {
    expect(pastedImageStem(new Date(2026, 7, 27, 9, 5, 3))).toBe('pasted-20260827-090503');
  });
});

describe('namePastedImages', () => {
  it('gives placeholder names a timestamped name', () => {
    const [file] = namePastedImages([png('image.png')]);
    expect(file.name).toMatch(/^pasted-\d{8}-\d{6}\.png$/);
  });

  it('keeps a real filename and lowercases its extension', () => {
    const [file] = namePastedImages([png('Brand Hero.PNG')]);
    expect(file.name).toBe('Brand Hero.png');
  });

  it('suffixes collisions within one paste and with existing assets', () => {
    const names = namePastedImages([png('logo.png'), png('logo.png')], ['logo.png']).map(
      (f) => f.name,
    );
    expect(names).toEqual(['logo-1.png', 'logo-2.png']);
  });
});
