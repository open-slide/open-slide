import type { SlideTransition, TransitionPhase } from '../transition';
import type {
  AnimationEffect,
  AnimationOrigin,
  AnimationTrigger,
  ElementAnimation,
  PptxTransition,
} from './scene';

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

type Length = { value: number; unit: 'px' | 'percent' };
type FrameTranslation = { tx?: Length; ty?: Length };
type Axis = 'x' | 'y';
type Translation = { axis: Axis; delta: number; isPercent: boolean };
type PhaseEffect =
  | { effect: 'push'; direction: 'up' | 'down' | 'left' | 'right' }
  | { effect: 'fade' };
type RawFrame = Record<string, string | number | null | undefined>;
type KeyframeValue = string | number | null | undefined;

const PUSH_MIN_PX = 24;
const PUSH_MIN_PERCENT = 2;
const TRANSITION_FALLBACK_MS = 250;
const IGNORED_KEYFRAME_KEYS = new Set(['offset', 'easing', 'composite']);
const ZERO_LENGTH: Length = { value: 0, unit: 'px' };

function toRawFrames(keyframes: Keyframe[] | PropertyIndexedKeyframes): RawFrame[] {
  if (Array.isArray(keyframes)) return keyframes;
  const entries = Object.entries(keyframes) as [string, KeyframeValue | KeyframeValue[]][];
  const length = entries.reduce(
    (max, [, value]) => (Array.isArray(value) ? Math.max(max, value.length) : Math.max(max, 1)),
    0,
  );
  const frames: RawFrame[] = Array.from({ length }, () => ({}));
  for (const [name, value] of entries) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item !== undefined) frames[i][name] = item;
      }
    } else {
      for (const frame of frames) frame[name] = value;
    }
  }
  return frames;
}

function hasAnyChange(first: RawFrame, last: RawFrame): boolean {
  const keys = new Set([...Object.keys(first), ...Object.keys(last)]);
  for (const key of keys) {
    if (IGNORED_KEYFRAME_KEYS.has(key)) continue;
    if (first[key] !== last[key]) return true;
  }
  return false;
}

function parseLength(raw: KeyframeValue): Length | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'number') return { value: raw, unit: 'px' };
  const match = /^(-?\d*\.?\d+)(px|%)?$/.exec(raw.trim());
  if (!match) return undefined;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return undefined;
  return { value, unit: match[2] === '%' ? 'percent' : 'px' };
}

function parseTranslateProperty(raw: KeyframeValue): FrameTranslation | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  if (value === '' || value === 'none') {
    return { tx: ZERO_LENGTH, ty: ZERO_LENGTH };
  }
  const parts = value.split(/\s+/);
  const tx = parseLength(parts[0]);
  if (!tx) return undefined;
  const ty = parts.length > 1 ? parseLength(parts[1]) : ZERO_LENGTH;
  if (!ty) return undefined;
  return { tx, ty };
}

function transformTranslate(transform: string): FrameTranslation {
  const t3d = /translate3d\(([^)]+)\)/.exec(transform);
  if (t3d) {
    const parts = t3d[1].split(',');
    return { tx: parseLength(parts[0]), ty: parseLength(parts[1]) };
  }
  const t = /translate\(([^)]+)\)/.exec(transform);
  if (t) {
    const parts = t[1].split(',');
    return {
      tx: parseLength(parts[0]),
      ty: parts.length > 1 ? parseLength(parts[1]) : ZERO_LENGTH,
    };
  }
  const txMatch = /translateX\(([^)]+)\)/.exec(transform);
  const tyMatch = /translateY\(([^)]+)\)/.exec(transform);
  return {
    tx: txMatch ? parseLength(txMatch[1]) : undefined,
    ty: tyMatch ? parseLength(tyMatch[1]) : undefined,
  };
}

function extractTranslation(raw: RawFrame): FrameTranslation {
  if (typeof raw.translate === 'string') {
    const parsed = parseTranslateProperty(raw.translate);
    if (parsed) return parsed;
  }
  if (typeof raw.transform === 'string') return transformTranslate(raw.transform);
  return {};
}

function axisDelta(
  first: Length | undefined,
  last: Length | undefined,
): { delta: number; isPercent: boolean } | null {
  if (first === undefined && last === undefined) return null;
  const from = first ?? { value: 0, unit: last?.unit ?? 'px' };
  const to = last ?? { value: 0, unit: first?.unit ?? 'px' };
  return {
    delta: to.value - from.value,
    isPercent: from.unit === 'percent' || to.unit === 'percent',
  };
}

function dominantTranslation(first: FrameTranslation, last: FrameTranslation): Translation | null {
  const dx = axisDelta(first.tx, last.tx);
  const dy = axisDelta(first.ty, last.ty);
  if (dx !== null && dy !== null) {
    return Math.abs(dx.delta) >= Math.abs(dy.delta)
      ? { axis: 'x', delta: dx.delta, isPercent: dx.isPercent }
      : { axis: 'y', delta: dy.delta, isPercent: dy.isPercent };
  }
  if (dx !== null) return { axis: 'x', delta: dx.delta, isPercent: dx.isPercent };
  if (dy !== null) return { axis: 'y', delta: dy.delta, isPercent: dy.isPercent };
  return null;
}

function classifyPhase(phase: TransitionPhase): PhaseEffect | null {
  const frames = toRawFrames(phase.keyframes);
  if (frames.length < 2) return null;
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (!hasAnyChange(first, last)) return null;

  const translation = dominantTranslation(extractTranslation(first), extractTranslation(last));
  if (translation !== null && translation.delta !== 0) {
    const threshold = translation.isPercent ? PUSH_MIN_PERCENT : PUSH_MIN_PX;
    if (Math.abs(translation.delta) >= threshold) {
      if (translation.axis === 'x') {
        return { effect: 'push', direction: translation.delta < 0 ? 'left' : 'right' };
      }
      return { effect: 'push', direction: translation.delta < 0 ? 'up' : 'down' };
    }
  }
  return { effect: 'fade' };
}

function normalizeDuration(raw: number | undefined): number {
  if (raw === undefined || !Number.isFinite(raw)) return TRANSITION_FALLBACK_MS;
  return Math.min(Math.max(raw, 1), 60000);
}

function transitionFromPhase(phase: TransitionPhase, fallbackDuration: number): PptxTransition {
  const durationMs = normalizeDuration(phase.duration ?? fallbackDuration);
  const classified = classifyPhase(phase);
  if (classified !== null && classified.effect === 'push') {
    return { effect: 'push', durationMs, direction: classified.direction };
  }
  return { effect: 'fade', durationMs, direction: null };
}

export function mapSlideTransition(
  current: SlideTransition | undefined,
  previous: SlideTransition | undefined,
): PptxTransition | null {
  if (current?.morph) {
    const rawDuration =
      typeof current.morph === 'object' && current.morph.duration !== undefined
        ? current.morph.duration
        : current.duration;
    return { effect: 'morph', durationMs: normalizeDuration(rawDuration), direction: null };
  }
  if (current?.enter) return transitionFromPhase(current.enter, current.duration);
  if (previous?.exit) return transitionFromPhase(previous.exit, previous.duration);
  return null;
}
