import type { AnimationEffect, AnimationOrigin, AnimationTrigger, ElementAnimation } from './scene';

export type {
  AnimationEffect,
  AnimationOrigin,
  AnimationTrigger,
  ElementAnimation,
  PptxTransition,
} from './scene';

const EFFECT_ALIASES: Record<string, AnimationEffect> = {
  appear: 'appear',
  fade: 'fade',
  'fade-in': 'fade',
  fly: 'fly',
  'fly-in': 'fly',
  zoom: 'zoom',
  'zoom-in': 'zoom',
  wipe: 'wipe',
  'wipe-in': 'wipe',
};

const TRIGGERS: AnimationTrigger[] = ['click', 'with-previous', 'after-previous'];
const DIRECTIONS: AnimationOrigin[] = ['top', 'bottom', 'left', 'right'];

function parseTimingMs(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return Math.min(Math.max(n, min), max);
}

export function parseAnimationDataset(
  dataset: Record<string, string | undefined>,
  inStep: boolean,
  id: number,
): ElementAnimation | null {
  const effect = dataset.osAnim === undefined ? undefined : EFFECT_ALIASES[dataset.osAnim];
  if (!effect) return null;

  const defaultTrigger: AnimationTrigger = inStep ? 'click' : 'with-previous';
  const rawTrigger = dataset.osAnimTrigger;
  const trigger = TRIGGERS.includes(rawTrigger as AnimationTrigger)
    ? (rawTrigger as AnimationTrigger)
    : defaultTrigger;

  const rawDirection = dataset.osAnimDirection;
  const direction = DIRECTIONS.includes(rawDirection as AnimationOrigin)
    ? (rawDirection as AnimationOrigin)
    : 'bottom';

  const durationMs = effect === 'appear' ? 1 : parseTimingMs(dataset.osAnimDuration, 500, 1, 60000);

  return {
    id,
    effect,
    trigger,
    durationMs,
    delayMs: parseTimingMs(dataset.osAnimDelay, 0, 0, 60000),
    direction,
  };
}

export function stepAnimation(durationMs: number, id: number): ElementAnimation {
  const d = Number.isFinite(durationMs) ? durationMs : 180;
  return {
    id,
    effect: 'fade',
    trigger: 'click',
    durationMs: Math.min(Math.max(d, 1), 60000),
    delayMs: 0,
    direction: 'bottom',
  };
}
