import type { Page } from './sdk';

export type TransitionPhase = {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  easing?: string;
  duration?: number;
  delay?: number;
};

export type SlideTransition = {
  duration: number;
  easing?: string;
  enter?: TransitionPhase;
  exit?: TransitionPhase;
  morph?: boolean | MorphTransition;
  throughBackground?: boolean;
};

export type MorphTransition = {
  duration?: number;
  easing?: string;
  delay?: number;
};

export function resolveTransition(
  pages: Page[],
  index: number,
  moduleDefault?: SlideTransition,
): SlideTransition | undefined {
  return pages[index]?.transition ?? moduleDefault;
}

export function holdOpacity(phase: TransitionPhase | undefined): TransitionPhase | undefined {
  if (!phase) return phase;
  if (Array.isArray(phase.keyframes)) {
    return {
      ...phase,
      keyframes: phase.keyframes.map(({ opacity: _opacity, ...frame }) => frame),
    };
  }
  const { opacity: _opacity, ...keyframes } = phase.keyframes;
  return { ...phase, keyframes };
}

export type TransitionKind = 'morph' | 'fade' | 'slide' | 'zoom' | 'wipe' | 'custom';

export function describeTransition(transition: SlideTransition): {
  kind: TransitionKind;
  duration: number;
} {
  const duration = Math.max(
    transition.duration,
    phaseLength(transition.enter),
    phaseLength(transition.exit),
    typeof transition.morph === 'object' ? phaseLength(transition.morph) : 0,
  );
  if (transition.morph) return { kind: 'morph', duration };
  const frames = keyframeList(transition.enter?.keyframes ?? transition.exit?.keyframes);
  const props = new Set(frames.flatMap((frame) => Object.keys(frame)));
  for (const meta of ['offset', 'easing', 'composite']) props.delete(meta);
  const transforms = frames.map((frame) => String(frame.transform ?? '')).join(' ');
  let kind: TransitionKind = 'custom';
  if (props.has('clipPath')) kind = 'wipe';
  else if (/scale/.test(transforms)) kind = 'zoom';
  else if (/translate/.test(transforms)) kind = 'slide';
  else if (props.size === 1 && props.has('opacity')) kind = 'fade';
  return { kind, duration };
}

function phaseLength(phase: { duration?: number; delay?: number } | undefined): number {
  return phase ? (phase.duration ?? 0) + (phase.delay ?? 0) : 0;
}

function keyframeList(keyframes: TransitionPhase['keyframes'] | undefined): Keyframe[] {
  if (!keyframes) return [];
  if (Array.isArray(keyframes)) return keyframes;
  const frame: Keyframe = {};
  for (const [key, value] of Object.entries(keyframes)) {
    frame[key] = Array.isArray(value) ? value.join(' ') : value;
  }
  return [frame];
}
