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
  if (!/^\d+$/.test(raw)) return fallback;
  const n = Number.parseInt(raw, 10);
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
  const d = Number.isFinite(durationMs) ? Math.round(durationMs) : 180;
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
type FrameTranslation = { tx?: Length; ty?: Length; unsupported?: boolean };
type Axis = 'x' | 'y';
type Translation =
  | { kind: 'translation'; axis: Axis; delta: number; isPercent: boolean }
  | { kind: 'unsupported' };
type PhaseEffect =
  | { effect: 'push'; direction: 'up' | 'down' | 'left' | 'right' }
  | { effect: 'fade' }
  | { effect: 'none' };
type RawFrame = Record<string, string | number | null | undefined>;
type KeyframeValue = string | number | null | undefined;

const PUSH_MIN_PX = 24;
const PUSH_MIN_PERCENT = 2;
const TRANSITION_FALLBACK_MS = 250;
const IGNORED_KEYFRAME_KEYS = new Set(['offset', 'easing', 'composite']);
const RECOGNIZED_KEYFRAME_KEYS = new Set([
  'opacity',
  'transform',
  'translate',
  'scale',
  'rotate',
  'clipPath',
  'clip-path',
]);
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

function hasRecognizedChange(first: RawFrame, last: RawFrame): boolean {
  const keys = new Set([...Object.keys(first), ...Object.keys(last)]);
  for (const key of keys) {
    if (IGNORED_KEYFRAME_KEYS.has(key)) continue;
    if (first[key] !== last[key] && RECOGNIZED_KEYFRAME_KEYS.has(key)) return true;
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

const TRANSFORM_FUNCTIONS = /([a-zA-Z0-9]+)\(([^)]*)\)/g;
const TRANSLATION_FUNCTIONS = new Set(['translate', 'translate3d', 'translateX', 'translateY']);
const TRANSFORM_COMPOSITION_FUNCTIONS = new Set([
  'matrix',
  'matrix3d',
  'perspective',
  'rotate',
  'rotate3d',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scale',
  'scale3d',
  'scaleX',
  'scaleY',
  'scaleZ',
  'skew',
  'skewX',
  'skewY',
]);

function parseTransformTranslation(name: string, args: string): FrameTranslation {
  const parts = args.split(',').map((part) => part.trim());
  switch (name) {
    case 'translate3d': {
      if (parts.length !== 3) return { unsupported: true };
      const tx = parseLength(parts[0]);
      const ty = parseLength(parts[1]);
      const tz = parseLength(parts[2]);
      // CSS requires a length for the z argument. Unitless nonzero values are invalid.
      const zIsLength =
        tz !== undefined && tz.unit === 'px' && (tz.value === 0 || parts[2].endsWith('px'));
      return tx && ty && zIsLength ? { tx, ty } : { unsupported: true };
    }
    case 'translate': {
      if (parts.length < 1 || parts.length > 2) return { unsupported: true };
      const tx = parseLength(parts[0]);
      if (!tx) return { unsupported: true };
      if (parts.length === 1) return { tx };
      const ty = parseLength(parts[1]);
      return ty ? { tx, ty } : { unsupported: true };
    }
    case 'translateX': {
      if (parts.length !== 1) return { unsupported: true };
      const tx = parseLength(parts[0]);
      return tx ? { tx } : { unsupported: true };
    }
    case 'translateY': {
      if (parts.length !== 1) return { unsupported: true };
      const ty = parseLength(parts[0]);
      return ty ? { ty } : { unsupported: true };
    }
    default:
      return {};
  }
}

function addLength(total: Length, term: Length): Length | null {
  if (total.unit === term.unit) return { value: total.value + term.value, unit: total.unit };
  if (total.value === 0) return { value: term.value, unit: term.unit };
  if (term.value === 0) return total;
  return null;
}

function sumAxis(terms: Length[]): Length | undefined | null {
  let total: Length | undefined;
  for (const term of terms) {
    if (total === undefined) {
      total = term;
      continue;
    }
    const sum = addLength(total, term);
    if (sum === null) return null;
    total = sum;
  }
  return total;
}

function combineAxis(
  first: Length | undefined,
  second: Length | undefined,
): Length | undefined | null {
  if (first === undefined) return second;
  if (second === undefined) return first;
  return addLength(first, second);
}

function combineTranslations(first: FrameTranslation, second: FrameTranslation): FrameTranslation {
  if (first.unsupported || second.unsupported) return { unsupported: true };
  const tx = combineAxis(first.tx, second.tx);
  const ty = combineAxis(first.ty, second.ty);
  if (tx === null || ty === null) return { unsupported: true };
  return { tx, ty };
}

function transformTranslate(transform: string): FrameTranslation {
  const xTerms: Length[] = [];
  const yTerms: Length[] = [];
  let translationCount = 0;
  let hasComposition = false;

  for (const match of transform.matchAll(TRANSFORM_FUNCTIONS)) {
    const name = match[1];
    if (TRANSLATION_FUNCTIONS.has(name)) {
      // A translation after a composition function runs in the transformed
      // coordinate space, so its axis delta is no longer reliable.
      if (hasComposition) return { unsupported: true };
      translationCount += 1;
      const parsed = parseTransformTranslation(name, match[2]);
      if (parsed.unsupported) return { unsupported: true };
      if (parsed.tx) xTerms.push(parsed.tx);
      if (parsed.ty) yTerms.push(parsed.ty);
    } else if (TRANSFORM_COMPOSITION_FUNCTIONS.has(name)) {
      hasComposition = true;
    }
  }

  if (translationCount === 0) return {};

  const tx = sumAxis(xTerms);
  const ty = sumAxis(yTerms);
  if (tx === null || ty === null) return { unsupported: true };
  return { tx, ty };
}

function extractTranslation(raw: RawFrame): FrameTranslation {
  const translate =
    typeof raw.translate === 'string'
      ? (parseTranslateProperty(raw.translate) ?? { unsupported: true })
      : undefined;
  const transform =
    typeof raw.transform === 'string' ? transformTranslate(raw.transform) : undefined;
  if (translate === undefined) return transform ?? {};
  if (transform === undefined) return translate;
  // The translate property is applied before transform, so their translation
  // terms add up when the transform itself stays translation-only.
  return combineTranslations(translate, transform);
}

function axisDelta(
  first: Length | undefined,
  last: Length | undefined,
): { delta: number; isPercent: boolean } | null | 'unsupported' {
  if (first === undefined && last === undefined) return null;
  // A zero length is unitless, so `translateX(0)` can settle a percentage move.
  if (
    first !== undefined &&
    last !== undefined &&
    first.unit !== last.unit &&
    first.value !== 0 &&
    last.value !== 0
  ) {
    return 'unsupported';
  }
  const from = first ?? ZERO_LENGTH;
  const to = last ?? ZERO_LENGTH;
  return {
    delta: to.value - from.value,
    isPercent:
      (from.value !== 0 && from.unit === 'percent') || (to.value !== 0 && to.unit === 'percent'),
  };
}

function dominantTranslation(first: FrameTranslation, last: FrameTranslation): Translation | null {
  if (first.unsupported || last.unsupported) return { kind: 'unsupported' };
  const dx = axisDelta(first.tx, last.tx);
  const dy = axisDelta(first.ty, last.ty);
  if (dx === 'unsupported' || dy === 'unsupported') return { kind: 'unsupported' };

  const x = dx === null ? null : { axis: 'x' as const, delta: dx.delta, isPercent: dx.isPercent };
  const y = dy === null ? null : { axis: 'y' as const, delta: dy.delta, isPercent: dy.isPercent };
  if (x !== null && y !== null) {
    return {
      kind: 'translation',
      ...(Math.abs(x.delta) >= Math.abs(y.delta) ? x : y),
    };
  }
  if (x !== null) return { kind: 'translation', ...x };
  if (y !== null) return { kind: 'translation', ...y };
  return null;
}

function classifyPhase(phase: TransitionPhase): PhaseEffect | null {
  const frames = toRawFrames(phase.keyframes);
  if (frames.length < 2) return { effect: 'none' };
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (!hasAnyChange(first, last)) {
    const hasIntermediateChange = frames.slice(1, -1).some((frame) => hasAnyChange(first, frame));
    return hasIntermediateChange ? { effect: 'fade' } : { effect: 'none' };
  }
  if (!hasRecognizedChange(first, last)) return null;

  const translation = dominantTranslation(extractTranslation(first), extractTranslation(last));
  if (translation !== null) {
    if (translation.kind === 'unsupported') return { effect: 'fade' };
    if (translation.delta !== 0) {
      const threshold = translation.isPercent ? PUSH_MIN_PERCENT : PUSH_MIN_PX;
      if (Math.abs(translation.delta) >= threshold) {
        if (translation.axis === 'x') {
          return { effect: 'push', direction: translation.delta < 0 ? 'left' : 'right' };
        }
        return { effect: 'push', direction: translation.delta < 0 ? 'up' : 'down' };
      }
    }
  }
  return { effect: 'fade' };
}

function normalizeDuration(raw: number | undefined): number {
  if (raw === undefined || !Number.isFinite(raw)) return TRANSITION_FALLBACK_MS;
  return Math.min(Math.max(Math.round(raw), 1), 60000);
}

function transitionFromPhase(
  phase: TransitionPhase,
  fallbackDuration: number,
): PptxTransition | null {
  const durationMs = normalizeDuration(phase.duration ?? fallbackDuration);
  const classified = classifyPhase(phase);
  if (classified === null) {
    return { effect: 'fade', durationMs, direction: null };
  }
  if (classified.effect === 'none') return null;
  if (classified.effect === 'push') {
    return { effect: 'push', durationMs, direction: classified.direction };
  }
  return { effect: 'fade', durationMs, direction: null };
}

export function mapSlideTransition(current: SlideTransition | undefined): PptxTransition | null {
  if (!current) return null;
  if (current.morph) {
    const rawDuration =
      typeof current.morph === 'object' && current.morph.duration !== undefined
        ? current.morph.duration
        : current.duration;
    return { effect: 'morph', durationMs: normalizeDuration(rawDuration), direction: null };
  }
  if (current.enter) return transitionFromPhase(current.enter, current.duration);
  if (current.exit) {
    const exit = transitionFromPhase(current.exit, current.duration);
    if (exit === null) return null;
    return { effect: 'fade', durationMs: exit.durationMs, direction: null };
  }
  return null;
}
