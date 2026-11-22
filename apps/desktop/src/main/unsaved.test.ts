import { EventEmitter } from 'node:events';
import type { MessageBoxOptions, WebContents } from 'electron';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UnsavedAction, UnsavedOutcome, UnsavedStatus } from '../shared/types';
import { UnsavedChannel, UnsavedGuard, type UnsavedPage } from './unsaved';

function page(
  title: string,
  status: UnsavedStatus | null,
  outcomes: Partial<Record<UnsavedAction, UnsavedOutcome>> = {},
) {
  let current = status;
  return {
    title,
    status: vi.fn(async () => current),
    settle: vi.fn(async (action: UnsavedAction) => {
      const outcome = outcomes[action] ?? { ok: true as const };
      if (outcome.ok) current = CLEAN;
      return outcome;
    }),
    reveal: vi.fn(),
    edit: (next: UnsavedStatus) => {
      current = next;
    },
  } satisfies UnsavedPage & { edit: (next: UnsavedStatus) => void };
}

function prompts(...answers: string[]) {
  const shown: MessageBoxOptions[] = [];
  const prompt = vi.fn(async (options: MessageBoxOptions) => {
    shown.push(options);
    const answer = answers.shift();
    if (answer === undefined) throw new Error(`Unexpected dialog: ${options.message}`);
    const index = options.buttons?.indexOf(answer) ?? -1;
    if (index < 0) throw new Error(`No “${answer}” button on: ${options.message}`);
    return index;
  });
  return { prompt, shown };
}

const CLEAN = { drafts: false, pending: false };
const DRAFT = { drafts: true, pending: false };
const LANDING = { drafts: false, pending: true };

describe('UnsavedGuard', () => {
  it('lets clean pages go without asking', async () => {
    const { prompt } = prompts();
    const deck = page('Deck', CLEAN);

    expect(await new UnsavedGuard(prompt).confirm([deck], 'close')).toBe(true);
    expect(prompt).not.toHaveBeenCalled();
    expect(deck.settle).not.toHaveBeenCalled();
  });

  it('saves drafts when the user chooses Save', async () => {
    const { prompt, shown } = prompts('Save');
    const deck = page('Roadmap', DRAFT);

    expect(await new UnsavedGuard(prompt).confirm([deck], 'close')).toBe(true);
    expect(shown[0].message).toBe('Save changes to “Roadmap” before closing?');
    expect(deck.settle).toHaveBeenCalledExactlyOnceWith('save');
    expect(deck.reveal).toHaveBeenCalled();
  });

  it('keeps the pages when the user cancels, and writes nothing', async () => {
    const { prompt } = prompts('Cancel');
    const deck = page('Roadmap', DRAFT);

    expect(await new UnsavedGuard(prompt).confirm([deck], 'quit')).toBe(false);
    expect(deck.settle).not.toHaveBeenCalled();
  });

  it('discards drafts on Don’t Save but still lets autosaved work land', async () => {
    const { prompt } = prompts('Don’t Save');
    const drafted = page('Roadmap', DRAFT);
    const notes = page('Notes', LANDING);

    expect(await new UnsavedGuard(prompt).confirm([drafted, notes], 'switch')).toBe(true);
    expect(drafted.settle).toHaveBeenCalledExactlyOnceWith('discard');
    expect(notes.settle).toHaveBeenCalledExactlyOnceWith('save');
  });

  it('flushes autosaved work without bothering the user', async () => {
    const { prompt } = prompts();
    const notes = page('Notes', LANDING);

    expect(await new UnsavedGuard(prompt).confirm([notes], 'close')).toBe(true);
    expect(prompt).not.toHaveBeenCalled();
    expect(notes.settle).toHaveBeenCalledExactlyOnceWith('save');
  });

  it('keeps the pages when a save fails and the user goes back', async () => {
    const { prompt, shown } = prompts('Save', 'Go Back');
    const deck = page('Roadmap', DRAFT, { save: { ok: false, error: 'disk is full' } });

    expect(await new UnsavedGuard(prompt).confirm([deck], 'close')).toBe(false);
    expect(shown[1].message).toBe('Couldn’t save changes to “Roadmap”');
    expect(shown[1].detail).toContain('disk is full');
    expect(deck.settle).not.toHaveBeenCalledWith('abandon');
  });

  it('abandons the work only after a failed save is explicitly discarded', async () => {
    const { prompt } = prompts('Save', 'Discard Changes');
    const deck = page('Roadmap', DRAFT, { save: { ok: false, error: 'disk is full' } });

    expect(await new UnsavedGuard(prompt).confirm([deck], 'close')).toBe(true);
    expect(deck.settle.mock.calls.map(([action]) => action)).toEqual(['save', 'abandon']);
  });

  it('asks before destroying a page that does not answer', async () => {
    const stay = prompts('Cancel');
    const frozen = page('Frozen', null);
    expect(await new UnsavedGuard(stay.prompt).confirm([frozen], 'reload')).toBe(false);
    expect(stay.shown[0].message).toBe('“Frozen” isn’t responding');

    const leave = prompts('Reload Anyway');
    expect(await new UnsavedGuard(leave.prompt).confirm([frozen], 'reload')).toBe(true);
  });

  it('asks once for several drafted pages and names them', async () => {
    const { prompt, shown } = prompts('Save');
    const pages = [page('One', DRAFT), page('Two', CLEAN), page('Three', DRAFT)];

    expect(await new UnsavedGuard(prompt).confirm(pages, 'quit')).toBe(true);
    expect(prompt).toHaveBeenCalledOnce();
    expect(shown[0].message).toBe('Save changes to 2 tabs before quitting?');
    expect(shown[0].detail).toContain('One\nThree');
    expect(pages[1].settle).not.toHaveBeenCalled();
  });

  it('asks again about a page that picked up work while another was being settled', async () => {
    const { prompt, shown } = prompts('Close Anyway', 'Save');
    const frozen = page('Frozen', null);
    const deck = page('Roadmap', CLEAN);
    frozen.status.mockImplementationOnce(async () => {
      deck.edit(DRAFT);
      return null;
    });

    expect(await new UnsavedGuard(prompt).confirm([deck, frozen], 'close')).toBe(true);
    expect(shown.map((options) => options.message)).toEqual([
      '“Frozen” isn’t responding',
      'Save changes to “Roadmap” before closing?',
    ]);
    expect(deck.settle).toHaveBeenCalledExactlyOnceWith('save');
    expect(frozen.status).toHaveBeenCalledOnce();
  });

  it('refuses a second decision while one is on screen', async () => {
    let answer: (index: number) => void = () => {};
    const prompt = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          answer = resolve;
        }),
    );
    const guard = new UnsavedGuard(prompt);
    const deck = page('Roadmap', DRAFT);

    const first = guard.confirm([deck], 'close');
    await vi.waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    expect(await guard.confirm([deck], 'quit')).toBe(false);
    answer(0);
    expect(await first).toBe(true);
    expect(prompt).toHaveBeenCalledOnce();
  });
});

describe('UnsavedChannel', () => {
  afterEach(() => vi.useRealTimers());

  function contents() {
    const sent: unknown[][] = [];
    const emitter = new EventEmitter();
    const fake = Object.assign(emitter, {
      send: (...args: unknown[]) => {
        sent.push(args);
      },
    });
    return { contents: fake as unknown as WebContents, sent, emitter };
  }

  it('matches a reply to its request', async () => {
    const channel = new UnsavedChannel();
    const { contents: tab, sent } = contents();
    const status = channel.page(tab, 'Deck', () => {}).status();

    const [name, request, action] = sent[0];
    expect([name, action]).toEqual(['host:unsaved', 'query']);
    channel.answer(tab, request, { drafts: true, pending: false });

    expect(await status).toEqual({ drafts: true, pending: false });
  });

  it('answers null for a reply without a status', async () => {
    const channel = new UnsavedChannel();
    const { contents: tab, sent } = contents();
    const status = channel.page(tab, 'Deck', () => {}).status();

    channel.answer(tab, sent[0][1], { ok: false, error: 'boom' });

    expect(await status).toBeNull();
  });

  it('ignores a reply from any other page', async () => {
    vi.useFakeTimers();
    const channel = new UnsavedChannel();
    const asked = contents();
    const other = contents();
    const outcome = channel.page(asked.contents, 'Deck', () => {}).settle('save');

    channel.answer(other.contents, asked.sent[0][1], { ok: true });
    vi.advanceTimersByTime(60_000);

    expect(await outcome).toEqual({ ok: false, error: 'The page did not respond.' });
  });

  it('answers null for a page that is destroyed while it is being asked', async () => {
    const channel = new UnsavedChannel();
    const { contents: tab, emitter } = contents();
    const status = channel.page(tab, 'Deck', () => {}).status();

    emitter.emit('destroyed');

    expect(await status).toBe(null);
  });

  it('treats anything but an explicit ok as a failure', async () => {
    const channel = new UnsavedChannel();
    const { contents: tab, sent } = contents();
    const outcome = channel.page(tab, 'Deck', () => {}).settle('save');

    channel.answer(tab, sent[0][1], { ok: 'yes', error: 'x'.repeat(5000) });

    const result = await outcome;
    expect(result.ok).toBe(false);
    expect(result.ok ? 0 : result.error.length).toBeLessThanOrEqual(400);
  });
});
