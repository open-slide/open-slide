import { useSyncExternalStore } from 'react';

let now = Date.now();
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

// One wall-clock-aligned ticker shared by every subscriber, re-armed each
// second so it never drifts and visibly skips seconds over a long talk.
function arm() {
  timer = setTimeout(
    () => {
      now = Date.now();
      for (const listener of listeners) listener();
      arm();
    },
    1000 - (Date.now() % 1000),
  );
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    now = Date.now();
    arm();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

function subscribeNever() {
  return () => {};
}

function getNow() {
  return now;
}

export function useNow(active = true): number {
  return useSyncExternalStore(active ? subscribe : subscribeNever, getNow, getNow);
}
