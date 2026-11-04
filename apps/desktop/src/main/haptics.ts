import { createRequire } from 'node:module';
import path from 'node:path';
import type { HapticPattern } from '../shared/types';

// NSHapticFeedbackPattern values.
const PATTERNS: Record<HapticPattern, number> = { generic: 0, alignment: 1, levelChange: 2 };
const MIN_INTERVAL_MS = 40;

type Native = { perform(pattern: number): void };

function load(): Native | null {
  if (process.platform !== 'darwin') return null;
  try {
    return createRequire(import.meta.url)(path.join(import.meta.dirname, '../native/haptics.node'));
  } catch (error) {
    console.warn('[haptics] unavailable:', error);
    return null;
  }
}

const native = load();
let last = 0;

export function performHaptic(pattern: unknown) {
  if (!native || typeof pattern !== 'string' || !Object.hasOwn(PATTERNS, pattern)) return;
  const now = performance.now();
  if (now - last < MIN_INTERVAL_MS) return;
  last = now;
  native.perform(PATTERNS[pattern as HapticPattern]);
}
