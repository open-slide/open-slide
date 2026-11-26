import { describe, expect, it } from 'vitest';
import { charBulletGapPx, charBulletWidthPx } from './measure';

/**
 * Regression for #637: PPTX list text sat only `indent - 0.30 em` after the
 * Arial bullet, so with Open Sans at 22 px the gap measured 3.6 px in Google
 * Slides against 15 px in the open-slide preview.
 */
describe('char bullet indentation', () => {
  it('derives the Chrome disc gap from the rounded font ascent', () => {
    // o = floor(ascent * 2 / 3); gap = o + 7 - floor((o + 1) / 2).
    expect(charBulletGapPx(3)).toBe(8);
    expect(charBulletGapPx(21)).toBe(14);
    expect(charBulletGapPx(24)).toBe(15);
    expect(charBulletGapPx(33)).toBe(18);
  });

  it('leaves the preview gap after the Arial bullet ink', () => {
    const size = 22;
    const ascent = 24;
    const width = charBulletWidthPx(size, ascent);

    expect(width).toBeCloseTo(15 + 0.3 * size, 6);
    // The 3.6 px post-export gap came from the old fixed 0.5 em width.
    expect(width - 0.3 * size).toBeGreaterThan(10);
    expect(width).toBeGreaterThan(size * 0.5);
  });

  it('grows with the ascent so larger fonts keep the same optical gap', () => {
    const size = 40;
    const small = charBulletWidthPx(size, 12);
    const large = charBulletWidthPx(size, 40);

    expect(large).toBeGreaterThan(small);
    expect(large - small).toBeCloseTo(charBulletGapPx(40) - charBulletGapPx(12), 6);
  });
});
