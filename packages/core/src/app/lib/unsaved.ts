import { useEffect, useRef } from 'react';
import type { UnsavedAction, UnsavedOutcome, UnsavedStatus } from './desktop-host';

export type UnsavedSource = {
  // A draft waits for the user to save it; autosaved work is written on its
  // own and is only unsaved until that write lands.
  kind: 'draft' | 'autosave';
  dirty: () => boolean;
  // Rejects when the work could not be written.
  save: () => Promise<void>;
  discard: () => void;
};

type Write = () => Promise<unknown>;

const sources = new Set<UnsavedSource>();
const writes = new Map<unknown, Promise<unknown>>();
const failed = new Map<unknown, Write>();

export function registerUnsaved(source: UnsavedSource): () => void {
  sources.add(source);
  return () => {
    sources.delete(source);
  };
}

// For a write that outlives the component that started it, such as a flush on
// unmount: nothing else would still report it as unsaved. One that fails is
// kept and run again the next time the page is asked to save, until it lands
// or the work is abandoned. A newer write under the same key takes its place.
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

// For work that reached disk some other way since its tracked write failed.
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
    failed.clear();
    return { ok: true };
  }
  for (const [key, write] of [...failed]) trackWrite(key, write);
  for (const result of await Promise.allSettled([...writes.values()])) {
    if (result.status === 'rejected') errors.push(describe(result.reason));
  }
  if (errors.length > 0) return { ok: false, error: errors.join(' ') };
  const after = unsavedStatus();
  if (after.drafts || after.pending) {
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
