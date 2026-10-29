import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportSlideAsImagePptx, exportSlideAsPptx, type PptxExportProgress } from './export-pptx';
import type { SlideModule } from './sdk';

const dispose = vi.fn();

vi.mock('./pptx/render', () => ({
  mountDeckOffscreen: vi.fn(async () => ({ frames: [{ querySelectorAll: () => [] }], dispose })),
}));

vi.mock('./pptx/measure', () => ({
  measurePage: vi.fn(async () => {
    throw new Error('measure failed');
  }),
}));

vi.mock('./pptx/color', () => ({ createColorNormalizer: vi.fn(() => ({})) }));

vi.mock('./pptx/raster', () => ({ Rasterizer: class {} }));

vi.mock('html-to-image', () => ({
  toBlob: vi.fn(async () => {
    throw new Error('capture failed');
  }),
}));

const slide = { default: [() => null] } as unknown as SlideModule;

describe('pptx export progress', () => {
  beforeEach(() => {
    dispose.mockClear();
  });

  it.each([
    ['editable', exportSlideAsPptx, 'measure failed'],
    ['image', exportSlideAsImagePptx, 'capture failed'],
  ] as const)('does not report done when the %s export fails', async (_kind, run, message) => {
    const progress: PptxExportProgress[] = [];

    await expect(run(slide, 'deck', (p) => progress.push(p))).rejects.toThrow(message);

    expect(progress.map((p) => p.phase)).not.toContain('done');
    expect(dispose).toHaveBeenCalledOnce();
  });
});
