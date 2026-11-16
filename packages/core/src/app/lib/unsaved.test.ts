import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSaveQueue,
  forgetWrite,
  onAbandon,
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

afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  await settleUnsaved('abandon');
});

const settled = () => new Promise((resolve) => setTimeout(resolve));

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

  it('tells abandon listeners only when the work is abandoned', async () => {
    const listener = vi.fn();
    cleanups.push(onAbandon(listener));

    await settleUnsaved('save');
    await settleUnsaved('discard');
    expect(listener).not.toHaveBeenCalled();

    await settleUnsaved('abandon');
    expect(listener).toHaveBeenCalledOnce();
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
    trackWrite('notes', () => write);
    expect(unsavedStatus()).toEqual({ drafts: false, pending: true });

    let done = false;
    const outcome = settleUnsaved('save').then((result) => {
      done = true;
      return result;
    });
    await Promise.resolve();
    expect(done).toBe(false);
    land();
    expect(await outcome).toEqual({ ok: true });
    expect(unsavedStatus().pending).toBe(false);
  });

  it('reports a detached write that failed', async () => {
    trackWrite('notes', () => Promise.reject(new Error('server went away')));

    expect(await settleUnsaved('save')).toEqual({ ok: false, error: 'server went away' });
  });

  it('keeps a failed detached write unsaved and retries it on the next save', async () => {
    const write = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('server went away'))
      .mockResolvedValue();
    trackWrite('notes', write);
    await settled();
    expect(unsavedStatus()).toEqual({ drafts: false, pending: true });

    expect(await settleUnsaved('save')).toEqual({ ok: true });
    expect(write).toHaveBeenCalledTimes(2);
    expect(unsavedStatus().pending).toBe(false);
  });

  it('keeps failing until the work is abandoned', async () => {
    const write = vi.fn(() => Promise.reject(new Error('server went away')));
    trackWrite('notes', write);
    await settled();

    expect(await settleUnsaved('save')).toEqual({ ok: false, error: 'server went away' });
    expect(unsavedStatus().pending).toBe(true);
    expect(await settleUnsaved('abandon')).toEqual({ ok: true });
    expect(unsavedStatus().pending).toBe(false);
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('forgets a write abandoned in flight, even if it fails afterwards', async () => {
    let fail: (error: Error) => void = () => {};
    const write = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        }),
    );
    trackWrite('notes', write);

    expect(await settleUnsaved('abandon')).toEqual({ ok: true });
    expect(unsavedStatus().pending).toBe(false);
    fail(new Error('server went away'));
    await settled();
    expect(unsavedStatus().pending).toBe(false);
    expect(await settleUnsaved('save')).toEqual({ ok: true });
    expect(write).toHaveBeenCalledOnce();
  });

  it('drops a failed write once newer work for the same key has landed', async () => {
    const stale = vi.fn(() => Promise.reject(new Error('server went away')));
    trackWrite('notes', stale);
    await settled();

    forgetWrite('notes');
    expect(unsavedStatus().pending).toBe(false);
    expect(await settleUnsaved('save')).toEqual({ ok: true });
    expect(stale).toHaveBeenCalledOnce();
  });
});

describe('createSaveQueue', () => {
  it('runs one task at a time and reports idle once all settle', async () => {
    const queue = createSaveQueue();
    const order: string[] = [];
    let release!: () => void;
    const onIdle = vi.fn();
    const first = queue.run(
      () =>
        new Promise<void>((resolve) => {
          order.push('first:start');
          release = () => {
            order.push('first:end');
            resolve();
          };
        }),
      onIdle,
    );
    const second = queue.run(async () => {
      order.push('second');
      throw new Error('boom');
    }, onIdle);
    await Promise.resolve();
    expect(queue.busy()).toBe(true);
    release();
    await first;
    await expect(second).rejects.toThrow('boom');
    expect(order).toEqual(['first:start', 'first:end', 'second']);
    expect(queue.busy()).toBe(false);
    expect(onIdle).toHaveBeenCalledOnce();
    await expect(queue.run(async () => 'next')).resolves.toBe('next');
  });
});
