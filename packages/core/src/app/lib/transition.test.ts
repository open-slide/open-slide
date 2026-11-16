import { describe, expect, it } from 'vitest';
import { describeTransition, holdOpacity } from './transition';

describe('holdOpacity', () => {
  it('drops opacity from array keyframes and keeps everything else', () => {
    const phase = holdOpacity({
      duration: 140,
      keyframes: [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-4px)', offset: 1 },
      ],
    });

    expect(phase).toEqual({
      duration: 140,
      keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)', offset: 1 }],
    });
  });

  it('drops opacity from property-indexed keyframes', () => {
    const phase = holdOpacity({
      keyframes: { opacity: [1, 0], transform: ['scale(1)', 'scale(1.01)'] },
    });

    expect(phase?.keyframes).toEqual({ transform: ['scale(1)', 'scale(1.01)'] });
  });

  it('passes an undefined phase through', () => {
    expect(holdOpacity(undefined)).toBeUndefined();
  });
});

describe('describeTransition', () => {
  it('names a cross-fade and reports its longest phase', () => {
    expect(
      describeTransition({
        duration: 200,
        enter: { duration: 320, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
        exit: { duration: 240, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
      }),
    ).toEqual({ kind: 'fade', duration: 320 });
  });

  it('calls a translating entrance a slide', () => {
    expect(
      describeTransition({
        duration: 240,
        enter: {
          keyframes: [
            { opacity: 0, transform: 'translateX(10px)' },
            { opacity: 1, transform: 'translateX(0)' },
          ],
        },
      }).kind,
    ).toBe('slide');
  });

  it('reads property-indexed keyframes', () => {
    expect(
      describeTransition({
        duration: 300,
        enter: { keyframes: { opacity: [0, 1], transform: ['scale(0.96)', 'scale(1)'] } },
      }).kind,
    ).toBe('zoom');
  });

  it('prefers morph and counts its duration', () => {
    expect(
      describeTransition({
        duration: 300,
        enter: { duration: 320, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
        morph: { duration: 600, delay: 40 },
      }),
    ).toEqual({ kind: 'morph', duration: 640 });
  });

  it('falls back to custom for anything else', () => {
    expect(
      describeTransition({
        duration: 300,
        enter: { keyframes: [{ filter: 'blur(8px)' }, { filter: 'blur(0)' }] },
      }).kind,
    ).toBe('custom');
  });
});
