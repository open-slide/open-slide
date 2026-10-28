import { describe, expect, it } from 'vitest';
import { parseAnimationDataset, stepAnimation } from './motion';

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

  it('falls back to the 180ms default', () => {
    expect(stepAnimation(Number.NaN, 8).durationMs).toBe(180);
  });

  it('clamps zero to an instant 1ms effect', () => {
    expect(stepAnimation(0, 9).durationMs).toBe(1);
  });
});
