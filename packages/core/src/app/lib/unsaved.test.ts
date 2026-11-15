import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  registerUnsaved,
  settleUnsaved,
  trackWrite,
  type UnsavedSource,
  unsavedStatus,
} from './unsaved';

const cleanups: (() => void)[] = [];

function source(kind: UnsavedSource['kind'], opts: { fail?: string } = {}) {
  const state = { dirty: true };
  const entry = {
    kind,
    dirty: () => state.dirty,
    save: vi.fn(async () => {
      if (opts.fail) throw new Error(opts.fail);
      state.dirty = false;
    }),
    discard: vi.fn(() => {
      state.dirty = false;
    }),
  };
  cleanups.push(registerUnsaved(entry));
  return Object.assign(entry, { state });
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

describe('unsaved work registry', () => {
  it('reports drafts apart from autosaved work that is still landing', () => {
    expect(unsavedStatus()).toEqual({ drafts: false, pending: false });
    const notes = source('autosave');
    expect(unsavedStatus()).toEqual({ drafts: false, pending: true });
    source('draft');
    expect(unsavedStatus()).toEqual({ drafts: true, pending: true });
    notes.state.dirty = false;
    expect(unsavedStatus()).toEqual({ drafts: true, pending: false });
  });

  it('saves every dirty source and leaves clean ones alone', async () => {
    const draft = source('draft');
    const notes = source('autosave');
    const clean = source('draft');
    clean.state.dirty = false;

    expect(await settleUnsaved('save')).toEqual({ ok: true });
    expect(draft.save).toHaveBeenCalledOnce();
    expect(notes.save).toHaveBeenCalledOnce();
    expect(clean.save).not.toHaveBeenCalled();
    expect(unsavedStatus()).toEqual({ drafts: false, pending: false });
  });

  it('discards drafts but still lets autosaved work land', async () => {
    const draft = source('draft');
    const notes = source('autosave');

    expect(await settleUnsaved('discard')).toEqual({ ok: true });
    expect(draft.discard).toHaveBeenCalledOnce();
    expect(draft.save).not.toHaveBeenCalled();
    expect(notes.save).toHaveBeenCalledOnce();
    expect(notes.discard).not.toHaveBeenCalled();
  });

  it('reports a failed save and keeps the work dirty', async () => {
    const draft = source('draft', { fail: 'disk is full' });

    expect(await settleUnsaved('save')).toEqual({ ok: false, error: 'disk is full' });
    expect(draft.state.dirty).toBe(true);
    expect(unsavedStatus().drafts).toBe(true);
  });

  it('abandons everything without writing', async () => {
    const draft = source('draft', { fail: 'disk is full' });
    const notes = source('autosave', { fail: 'disk is full' });

    expect(await settleUnsaved('abandon')).toEqual({ ok: true });
    expect(draft.save).not.toHaveBeenCalled();
    expect(notes.save).not.toHaveBeenCalled();
    expect(unsavedStatus()).toEqual({ drafts: false, pending: false });
  });

  it('refuses to report success when more work appeared while saving', async () => {
    const draft = source('draft');
    draft.save.mockImplementation(async () => {});

    expect(await settleUnsaved('save')).toEqual({
      ok: false,
      error: 'More changes were made while saving.',
    });
  });

  it('waits for a write that outlived the component that started it', async () => {
    let land: () => void = () => {};
    const write = new Promise<void>((resolve) => {
      land = resolve;
    });
    void trackWrite(write);
    expect(unsavedStatus()).toEqual({ drafts: false, pending: true });

    let settled = false;
    const outcome = settleUnsaved('save').then((result) => {
      settled = true;
      return result;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    land();
    expect(await outcome).toEqual({ ok: true });
    expect(unsavedStatus().pending).toBe(false);
  });

  it('reports a detached write that failed', async () => {
    trackWrite(Promise.reject(new Error('server went away'))).catch(() => {});

    expect(await settleUnsaved('save')).toEqual({ ok: false, error: 'server went away' });
  });
});
