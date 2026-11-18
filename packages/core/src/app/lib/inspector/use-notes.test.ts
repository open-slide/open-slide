import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { settleUnsaved, unsavedStatus } from '@/lib/unsaved';
import { cachedNotes, changeNotesPages, detachNotes } from './use-notes';

type Call = {
  url: string;
  body: { index?: number; text?: string } | undefined;
  reply: (ok: boolean) => void;
};

let calls: Call[] = [];
let slide = 0;
let slideId = '';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const noteCalls = () => calls.filter((call) => call.url === '/__notes');

beforeEach(() => {
  calls = [];
  slideId = `deck-${++slide}`;
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
      );
      calls.push({
        url,
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
        reply: (ok) =>
          resolve(
            new Response(JSON.stringify(ok ? { ok: true } : { error: 'boom' }), {
              status: ok ? 200 : 500,
            }),
          ),
      });
    });
  });
});

afterEach(async () => {
  await settleUnsaved('abandon');
  vi.unstubAllGlobals();
});

async function failDetached(index: number, text: string) {
  detachNotes({ slideId, index }, text);
  await tick();
  noteCalls().at(-1)?.reply(false);
  await tick();
}

function change(order: number[], ok = true) {
  return changeNotesPages(slideId, () => ({
    order,
    apply: async () => {
      if (!ok) throw new Error('page op failed');
    },
  }));
}

async function retry() {
  const before = noteCalls().length;
  const settled = settleUnsaved('save');
  await tick();
  const sent = noteCalls().slice(before);
  for (const call of sent) call.reply(true);
  await settled;
  return sent.map((call) => call.body);
}

describe('notes across page changes', () => {
  it('retries a failed write on the page it was left on after a reorder', async () => {
    await failDetached(1, 'second');
    await change([1, 0]);
    expect(cachedNotes(slideId, 0)).toBe('second');
    expect(cachedNotes(slideId, 1)).toBeUndefined();
    expect(await retry()).toEqual([{ slideId, index: 0, text: 'second' }]);
  });

  it('drops a failed write whose page was deleted', async () => {
    await failDetached(1, 'gone');
    await change([0, 2]);
    expect(cachedNotes(slideId, 1)).toBeUndefined();
    expect(unsavedStatus().pending).toBe(false);
    expect(await retry()).toEqual([]);
  });

  it('shifts later pages down after a delete', async () => {
    await failDetached(2, 'third');
    await change([0, 2]);
    expect(await retry()).toEqual([{ slideId, index: 1, text: 'third' }]);
  });

  it('copies saved notes to a duplicated page and shifts later retries', async () => {
    detachNotes({ slideId, index: 0 }, 'first');
    await tick();
    noteCalls()[0].reply(true);
    await tick();
    await failDetached(1, 'second');

    await change([0, 0, 1]);
    expect(cachedNotes(slideId, 0)).toBe('first');
    expect(cachedNotes(slideId, 1)).toBe('first');
    expect(cachedNotes(slideId, 2)).toBe('second');
    expect(await retry()).toEqual([{ slideId, index: 2, text: 'second' }]);
  });

  it('restores retries and cached notes when the page change fails', async () => {
    detachNotes({ slideId, index: 0 }, 'kept');
    await tick();
    noteCalls()[0].reply(true);
    await tick();
    await failDetached(1, 'second');

    await expect(change([0], false)).rejects.toThrow('page op failed');
    expect(cachedNotes(slideId, 0)).toBe('kept');
    expect(cachedNotes(slideId, 1)).toBe('second');
    expect(await retry()).toEqual([{ slideId, index: 1, text: 'second' }]);
  });

  it('waits for a write in flight before planning the change', async () => {
    detachNotes({ slideId, index: 1 }, 'landing');
    await tick();
    const plan = vi.fn(() => ({ order: [1, 0], apply: async () => {} }));
    const changed = changeNotesPages(slideId, plan);
    await tick();
    expect(plan).not.toHaveBeenCalled();

    noteCalls()[0].reply(true);
    expect(await changed).toBe(true);
    expect(plan).toHaveBeenCalledOnce();
    expect(cachedNotes(slideId, 0)).toBe('landing');
  });

  it('holds a write made during a page change until it settles', async () => {
    let finish = () => {};
    const first = changeNotesPages(slideId, () => ({
      order: [1, 0],
      apply: () => new Promise<void>((resolve) => (finish = resolve)),
    }));
    await tick();
    detachNotes({ slideId, index: 1 }, 'typed');
    const plan = vi.fn(() => ({ order: [1, 0], apply: async () => {} }));
    const second = changeNotesPages(slideId, plan);
    await tick();
    expect(noteCalls()).toEqual([]);

    finish();
    await first;
    await tick();
    expect(noteCalls().map((call) => call.body)).toEqual([{ slideId, index: 1, text: 'typed' }]);
    expect(plan).not.toHaveBeenCalled();

    noteCalls()[0].reply(true);
    await second;
    expect(cachedNotes(slideId, 0)).toBe('typed');
  });
});
