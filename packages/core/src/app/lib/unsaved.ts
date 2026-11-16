import { useEffect, useRef } from 'react';
import type { UnsavedAction, UnsavedOutcome, UnsavedStatus } from './desktop-host';

export type UnsavedSource = {
  // A draft waits for the user to save it; autosaved work is unsaved only until its write lands.
  kind: 'draft' | 'autosave';
  dirty: () => boolean;
  save: () => Promise<void>;
  discard: () => void;
};

type Write = () => Promise<unknown>;

const sources = new Set<UnsavedSource>();
const writes = new Map<unknown, Promise<unknown>>();
const failed = new Map<unknown, Write>();
const abandonListeners = new Set<() => void>();

export function registerUnsaved(source: UnsavedSource): () => void {
  sources.add(source);
  return () => {
    sources.delete(source);
  };
}

// For a write that outlives the component that started it, such as a flush on
// unmount. A failed one is retried on the next save until it lands or the work
// is abandoned; a newer write under the same key replaces it.
export function trackWrite(key: unknown, write: Write): void {
  const attempt = write();
  writes.set(key, attempt);
  failed.delete(key);
  const finish = (retry?: Write) => {
    if (writes.get(key) !== attempt) return;
    writes.delete(key);
    if (retry) failed.set(key, retry);
  };
  attempt.then(
    () => finish(),
    () => finish(write),
  );
}

export function onAbandon(listener: () => void): () => void {
  abandonListeners.add(listener);
  return () => {
    abandonListeners.delete(listener);
  };
}

// For work that reached disk some other way after its tracked write failed.
export function forgetWrite(key: unknown): void {
  failed.delete(key);
}

export function unsavedStatus(): UnsavedStatus {
  let drafts = false;
  let pending = writes.size > 0 || failed.size > 0;
  for (const source of sources) {
    if (!source.dirty()) continue;
    if (source.kind === 'draft') drafts = true;
    else pending = true;
  }
  return { drafts, pending };
}

export function hasUnsaved(): boolean {
  const { drafts, pending } = unsavedStatus();
  return drafts || pending;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function settleUnsaved(action: UnsavedAction): Promise<UnsavedOutcome> {
  const errors: string[] = [];
  for (const source of [...sources]) {
    if (!source.dirty()) continue;
    if (action === 'abandon' || (action === 'discard' && source.kind === 'draft')) {
      source.discard();
      continue;
    }
    try {
      await source.save();
    } catch (err) {
      errors.push(describe(err));
    }
  }
  if (action === 'abandon') {
    // In-flight writes too, so one that fails later is not kept for a retry.
    writes.clear();
    failed.clear();
    for (const listener of abandonListeners) listener();
    return { ok: true };
  }
  for (const [key, write] of [...failed]) trackWrite(key, write);
  for (const result of await Promise.allSettled([...writes.values()])) {
    if (result.status === 'rejected') errors.push(describe(result.reason));
  }
  if (errors.length > 0) return { ok: false, error: errors.join(' ') };
  if (hasUnsaved()) {
    return { ok: false, error: 'More changes were made while saving.' };
  }
  return { ok: true };
}

export function useUnsavedSource(source: UnsavedSource) {
  const latest = useRef(source);
  latest.current = source;
  const { kind } = source;
  useEffect(
    () =>
      registerUnsaved({
        kind,
        dirty: () => latest.current.dirty(),
        save: () => latest.current.save(),
        discard: () => latest.current.discard(),
      }),
    [kind],
  );
}

// Runs saves one after another, each starting once the previous one settles.
export function createSaveQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  let size = 0;
  return {
    run<T>(task: () => Promise<T>, onIdle?: () => void): Promise<T> {
      size++;
      const result = tail.then(task).finally(() => {
        if (--size === 0) onIdle?.();
      });
      tail = result.catch(() => {});
      return result;
    },
    busy: () => size > 0,
  };
}
