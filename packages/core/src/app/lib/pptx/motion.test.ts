import { describe, expect, it } from 'vitest';
import { mapSlideTransition, parseAnimationDataset, stepAnimation } from './motion';

describe('parseAnimationDataset', () => {
  it('defaults to a fade that plays with the previous beat', () => {
    expect(parseAnimationDataset({ osAnim: 'fade' }, false, 1)).toEqual({
      id: 1,
      effect: 'fade',
      trigger: 'with-previous',
      durationMs: 500,
      delayMs: 0,
      direction: 'bottom',
    });
  });

  it('normalizes aliases and explicit options', () => {
    expect(
      parseAnimationDataset(
        {
          osAnim: 'fly-in',
          osAnimTrigger: 'click',
          osAnimDuration: '750',
          osAnimDelay: '120',
          osAnimDirection: 'left',
        },
        false,
        2,
      ),
    ).toEqual({
      id: 2,
      effect: 'fly',
      trigger: 'click',
      durationMs: 750,
      delayMs: 120,
      direction: 'left',
    });
  });

  it('defaults to click inside a step', () => {
    expect(parseAnimationDataset({ osAnim: 'zoom' }, true, 3)?.trigger).toBe('click');
  });

  it('returns null for an unknown effect', () => {
    expect(parseAnimationDataset({ osAnim: 'spin' }, false, 4)).toBeNull();
  });

  it('returns null when no effect is declared', () => {
    expect(parseAnimationDataset({}, false, 5)).toBeNull();
  });

  it('clamps invalid timing values to the defaults', () => {
    expect(
      parseAnimationDataset(
        { osAnim: 'fade', osAnimDuration: '-20', osAnimDelay: 'nope' },
        false,
        6,
      ),
    ).toMatchObject({ durationMs: 500, delayMs: 0 });
  });

  it('rejects partially numeric timing values', () => {
    expect(
      parseAnimationDataset(
        { osAnim: 'fade', osAnimDuration: '250ms', osAnimDelay: '1e3' },
        false,
        8,
      ),
    ).toMatchObject({ durationMs: 500, delayMs: 0 });
  });

  it('forces appear to an instant effect', () => {
    expect(
      parseAnimationDataset({ osAnim: 'appear', osAnimDuration: '900' }, false, 7),
    ).toMatchObject({
      effect: 'appear',
      durationMs: 1,
    });
  });
});

describe('stepAnimation', () => {
  it('uses the step duration and a click trigger', () => {
    expect(stepAnimation(240, 6)).toEqual({
      id: 6,
      effect: 'fade',
      trigger: 'click',
      durationMs: 240,
      delayMs: 0,
      direction: 'bottom',
    });
  });

  it('rounds a fractional step duration to integer milliseconds', () => {
    expect(stepAnimation(240.5, 7).durationMs).toBe(241);
  });

  it('falls back to the 180ms default', () => {
    expect(stepAnimation(Number.NaN, 8).durationMs).toBe(180);
  });

  it('clamps zero to an instant 1ms effect', () => {
    expect(stepAnimation(0, 9).durationMs).toBe(1);
  });
});

describe('mapSlideTransition', () => {
  it('maps an opacity-only enter to fade', () => {
    expect(
      mapSlideTransition({
        duration: 320,
        enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
      }),
    ).toEqual({ effect: 'fade', durationMs: 320, direction: null });
  });

  it('rounds a fractional duration to integer milliseconds', () => {
    expect(
      mapSlideTransition({
        duration: 320.7,
        enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
      })?.durationMs,
    ).toBe(321);
  });

  it('keeps the documented fade-plus-lift as fade', () => {
    expect(
      mapSlideTransition({
        duration: 260,
        enter: {
          keyframes: [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
        },
      })?.effect,
    ).toBe('fade');
  });

  it('maps a large upward travel to push up', () => {
    expect(
      mapSlideTransition({
        duration: 400,
        enter: {
          keyframes: [
            { opacity: 0, transform: 'translateY(80px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
        },
      }),
    ).toEqual({ effect: 'push', durationMs: 400, direction: 'up' });
  });

  it('maps horizontal travel to the direction of movement', () => {
    expect(
      mapSlideTransition({
        duration: 400,
        enter: { keyframes: [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }] },
      }),
    ).toEqual({ effect: 'push', durationMs: 400, direction: 'left' });
  });

  it('sums every translation in a transform list', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translateX(100px) translate(0)' },
            { transform: 'translate(0)' },
          ],
        },
      }),
    ).toEqual({ effect: 'push', durationMs: 300, direction: 'left' });
  });

  it('combines the translate property with transform translations', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { translate: '-80px', transform: 'translateX(100px)' },
            { translate: '0px', transform: 'translateX(0px)' },
          ],
        },
      }),
    ).toEqual({ effect: 'fade', durationMs: 300, direction: null });
  });

  it('keeps a valid pixel z argument in translate3d', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translate3d(100px, 0px, 10px)' },
            { transform: 'translate3d(0px, 0px, 0px)' },
          ],
        },
      }),
    ).toEqual({ effect: 'push', durationMs: 300, direction: 'left' });
  });

  it('rejects a percentage z argument in translate3d', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translate3d(100px, 0px, 10%)' },
            { transform: 'translate3d(0px, 0px, 0%)' },
          ],
        },
      }),
    ).toEqual({ effect: 'fade', durationMs: 300, direction: null });
  });

  it('rejects a unitless nonzero z argument in translate3d', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translate3d(100px, 0px, 10)' },
            { transform: 'translate3d(0px, 0px, 0)' },
          ],
        },
      }),
    ).toEqual({ effect: 'fade', durationMs: 300, direction: null });
  });

  it('accepts a unitless zero z argument in translate3d', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translate3d(100px, 0px, 0)' },
            { transform: 'translate3d(0px, 0px, 0)' },
          ],
        },
      }),
    ).toEqual({ effect: 'push', durationMs: 300, direction: 'left' });
  });

  it('sums translations that all precede a composition function', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translateX(10px) translateX(20px) translateY(5px) scale(2)' },
            { transform: 'translateX(0px) translateX(0px) translateY(5px) scale(2)' },
          ],
        },
      }),
    ).toEqual({ effect: 'push', durationMs: 300, direction: 'left' });
  });

  it('selects the vertical axis for a composed transform with larger Y motion', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translateX(10px) translateY(100px) scale(2)' },
            { transform: 'translateX(0px) translateY(0px) scale(2)' },
          ],
        },
      }),
    ).toEqual({ effect: 'push', durationMs: 300, direction: 'up' });
  });

  it('falls back to fade for a translation after a composition function', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'rotate(90deg) translateX(100px)' },
            { transform: 'rotate(90deg) translateX(0px)' },
          ],
        },
      }),
    ).toEqual({ effect: 'fade', durationMs: 300, direction: null });
  });

  it('keeps a translation that precedes a composition function', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translateX(100px) scale(2)' },
            { transform: 'translateX(0px) scale(2)' },
          ],
        },
      }),
    ).toEqual({ effect: 'push', durationMs: 300, direction: 'left' });
  });

  it('rejects translateX and translateY values with extra arguments', () => {
    const effect = (first: string, last: string) =>
      mapSlideTransition({
        duration: 300,
        enter: { keyframes: [{ transform: first }, { transform: last }] },
      })?.effect;
    expect(effect('translateX(100px, 20px)', 'translateX(0px)')).toBe('fade');
    expect(effect('translateY(100px, 20px)', 'translateY(0px)')).toBe('fade');
  });

  it('falls back to fade when translations are composed with a scale', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [
            { transform: 'translateX(100px) scale(2) translateX(100px)' },
            { transform: 'translateX(0)' },
          ],
        },
      })?.effect,
    ).toBe('fade');
  });

  it('falls back to fade for mixed-unit translation endpoints', () => {
    expect(
      mapSlideTransition({
        duration: 300,
        enter: {
          keyframes: [{ transform: 'translateX(30px)' }, { transform: 'translateX(2%)' }],
        },
      }),
    ).toEqual({ effect: 'fade', durationMs: 300, direction: null });
  });

  it('maps an enter that returns to its starting value to fade', () => {
    expect(
      mapSlideTransition({
        duration: 200,
        enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }] },
      }),
    ).toEqual({ effect: 'fade', durationMs: 200, direction: null });
  });

  it('maps morph and uses the morph duration', () => {
    expect(mapSlideTransition({ duration: 300, morph: { duration: 900 } })).toEqual({
      effect: 'morph',
      durationMs: 900,
      direction: null,
    });
  });

  it('approximates an exit-only transition as fade', () => {
    expect(
      mapSlideTransition({
        duration: 250,
        exit: {
          keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(-80px)' }],
        },
      }),
    ).toEqual({ effect: 'fade', durationMs: 250, direction: null });
  });

  it('returns null for a deliberate hold on exit', () => {
    expect(
      mapSlideTransition({
        duration: 250,
        exit: { keyframes: [{ opacity: 1 }, { opacity: 1 }] },
      }),
    ).toBeNull();
  });

  it('returns null for a no-change enter', () => {
    expect(
      mapSlideTransition({
        duration: 250,
        enter: { keyframes: [{ opacity: 1 }, { opacity: 1 }] },
      }),
    ).toBeNull();
  });

  it('does not fall through to exit when the enter is a no-op', () => {
    expect(
      mapSlideTransition({
        duration: 200,
        enter: { keyframes: [{ opacity: 1 }, { opacity: 1 }] },
        exit: { keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(80px)' }] },
      }),
    ).toBeNull();
  });

  it('prefers the incoming enter over the incoming exit', () => {
    expect(
      mapSlideTransition({
        duration: 200,
        enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
        exit: { keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(80px)' }] },
      })?.effect,
    ).toBe('fade');
  });

  it('returns null when there is no transition', () => {
    expect(mapSlideTransition(undefined)).toBeNull();
    expect(mapSlideTransition({ duration: 250 })).toBeNull();
  });

  it('uses the top-level duration for a boolean morph', () => {
    expect(mapSlideTransition({ duration: 300, morph: true })).toEqual({
      effect: 'morph',
      durationMs: 300,
      direction: null,
    });
  });

  it('falls back to fade for a scale-only change', () => {
    expect(
      mapSlideTransition({
        duration: 200,
        enter: { keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }] },
      }),
    ).toEqual({ effect: 'fade', durationMs: 200, direction: null });
  });

  it('falls back to fade for a clipPath-only change', () => {
    expect(
      mapSlideTransition({
        duration: 200,
        enter: { keyframes: [{ clipPath: 'inset(0)' }, { clipPath: 'inset(50%)' }] },
      }),
    ).toEqual({ effect: 'fade', durationMs: 200, direction: null });
  });

  it('falls back to fade for an unrecognised change', () => {
    expect(
      mapSlideTransition({
        duration: 200,
        enter: { keyframes: [{ filter: 'blur(10px)' }, { filter: 'blur(0px)' }] },
      }),
    ).toEqual({ effect: 'fade', durationMs: 200, direction: null });
  });
});
