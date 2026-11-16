import { EventEmitter } from 'node:events';
import type { BrowserWindow, MessageBoxOptions } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnsavedAction, UnsavedOutcome, UnsavedStatus } from '../shared/types';

// What a page's guard would answer, keyed by the URL the view shows.
type PageScript = {
  status: UnsavedStatus;
  outcomes?: Partial<Record<UnsavedAction, UnsavedOutcome>>;
  silent?: boolean;
};

const fixture = vi.hoisted(() => ({
  views: [] as { webContents: FakeContents }[],
  // Stands in for the IPC route a page's reply takes back to the manager.
  deliver: (_contents: unknown, _request: unknown, _payload: unknown) => {},
}));

class FakeContents extends EventEmitter {
  url = '';
  closed = false;
  loading = false;
  reloads = 0;
  sent: unknown[][] = [];
  script: PageScript = { status: { drafts: false, pending: false } };
  navigationHistory = { clear: () => {}, canGoBack: () => false, goBack: () => {} };

  loadURL(url: string) {
    this.url = url;
    queueMicrotask(() => this.emit('did-finish-load'));
    return Promise.resolve();
  }
  getURL() {
    return this.url;
  }
  send(channel: string, ...args: unknown[]) {
    this.sent.push([channel, ...args]);
    if (channel !== 'host:unsaved' || this.script.silent) return;
    const [request, action] = args as [number, 'query' | UnsavedAction];
    const payload =
      action === 'query' ? this.script.status : (this.script.outcomes?.[action] ?? { ok: true });
    // Work that was settled is gone, as it is on a real page.
    if (action !== 'query' && 'ok' in payload && payload.ok) {
      this.script = { ...this.script, status: { drafts: false, pending: false } };
    }
    queueMicrotask(() => fixture.deliver(this, request, payload));
  }
  close() {
    this.closed = true;
    this.emit('destroyed');
  }
  reload() {
    this.reloads++;
  }
  isDestroyed() {
    return this.closed;
  }
  isCrashed() {
    return false;
  }
  isLoadingMainFrame() {
    return this.loading;
  }
  focus() {}
  setBackgroundThrottling() {}
  setWindowOpenHandler() {}
  insertCSS() {
    return Promise.resolve('');
  }
}

vi.mock('electron', () => ({
  app: { isPackaged: true },
  dialog: {},
  shell: {},
  Menu: { buildFromTemplate: () => ({ popup: () => {} }) },
  WebContentsView: class {
    webContents = new FakeContents();
    constructor() {
      fixture.views.push(this);
    }
    setBackgroundColor() {}
    setVisible() {}
    setBounds() {}
  },
}));

const { TabManager } = await import('./tabs');

const BASE = 'http://localhost:5173';

function setup(...answers: string[]) {
  const shown: MessageBoxOptions[] = [];
  const window = Object.assign(new EventEmitter(), {
    isDestroyed: () => false,
    isFullScreen: () => false,
    setFullScreen: () => {},
    getContentBounds: () => ({ x: 0, y: 0, width: 1200, height: 800 }),
    contentView: { addChildView: () => {}, removeChildView: () => {} },
  });
  const manager = new TabManager({
    window: window as unknown as BrowserWindow,
    viewPreload: '/preload.cjs',
    onChange: () => {},
    prompt: async (options) => {
      shown.push(options);
      const answer = answers.shift();
      const index = answer === undefined ? -1 : (options.buttons?.indexOf(answer) ?? -1);
      if (index < 0) throw new Error(`Unexpected dialog: ${options.message}`);
      return index;
    },
  });
  fixture.deliver = (contents, request, payload) =>
    manager.unsavedReply(contents as never, request, payload);
  manager.setBaseUrl(BASE);
  manager.setOverlay(false);

  // Opens a deck and waits for its view to finish loading.
  const open = async (slideId: string, script?: PageScript) => {
    manager.openDeck(slideId);
    const view = fixture.views.at(-1);
    if (!view) throw new Error('no view was created');
    const contents = view.webContents;
    if (script) contents.script = script;
    await vi.waitFor(() => expect(contents.listenerCount('did-finish-load')).toBeGreaterThan(0));
    await new Promise((resolve) => setImmediate(resolve));
    const id = manager.info.tabs.find((t) => t.slideId === slideId)?.id as string;
    return { id, contents };
  };
  const titles = () => manager.info.tabs.map((t) => t.slideId ?? 'home');
  return { manager, open, shown, titles };
}

const DRAFT: PageScript = { status: { drafts: true, pending: false } };

describe('TabManager unsaved work', () => {
  beforeEach(() => {
    fixture.views = [];
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => vi.useRealTimers());

  it('closes a clean tab without asking', async () => {
    const { manager, open, shown, titles } = setup();
    const deck = await open('roadmap');

    expect(await manager.close(deck.id)).toBe(true);

    expect(shown).toEqual([]);
    expect(deck.contents.closed).toBe(true);
    expect(titles()).toEqual(['home']);
  });

  it('saves a tab with drafts before it is destroyed', async () => {
    const { manager, open, shown } = setup('Save');
    const deck = await open('roadmap', DRAFT);

    const closing = manager.close(deck.id);
    // Nothing is destroyed while the page is still being asked.
    expect(deck.contents.closed).toBe(false);
    expect(await closing).toBe(true);

    expect(shown[0].message).toBe('Save changes to “roadmap” before closing?');
    const actions = deck.contents.sent.filter(([c]) => c === 'host:unsaved').map(([, , a]) => a);
    // Asked once more after saving, in case more work appeared meanwhile.
    expect(actions).toEqual(['query', 'save', 'query']);
    expect(deck.contents.closed).toBe(true);
  });

  it('keeps the tab open when the user cancels', async () => {
    const { manager, open, titles } = setup('Cancel');
    const deck = await open('roadmap', DRAFT);

    expect(await manager.close(deck.id)).toBe(false);

    expect(deck.contents.closed).toBe(false);
    expect(titles()).toEqual(['home', 'roadmap']);
  });

  it('keeps the tab open when its save fails', async () => {
    const { manager, open, shown } = setup('Save', 'Go Back');
    const deck = await open('roadmap', {
      ...DRAFT,
      outcomes: { save: { ok: false, error: 'The file is read-only.' } },
    });

    expect(await manager.close(deck.id)).toBe(false);

    expect(shown[1].detail).toContain('The file is read-only.');
    expect(deck.contents.closed).toBe(false);
  });

  it('asks before destroying a tab that does not answer', async () => {
    const { manager, open, shown } = setup('Cancel');
    const deck = await open('roadmap', { ...DRAFT, silent: true });

    const closing = manager.close(deck.id);
    await vi.advanceTimersByTimeAsync(5000);

    expect(await closing).toBe(false);
    expect(shown[0].message).toBe('“roadmap” isn’t responding');
    expect(deck.contents.closed).toBe(false);
  });

  it('settles every tab before a workspace switch or quit destroys them', async () => {
    const { manager, open, shown } = setup('Don’t Save');
    const first = await open('first', DRAFT);
    const second = await open('second');
    const third = await open('third', { status: { drafts: false, pending: true } });

    expect(await manager.confirmLeave('quit')).toBe(true);

    expect(shown).toHaveLength(1);
    const asked = (c: FakeContents) =>
      c.sent.filter(([channel]) => channel === 'host:unsaved').map(([, , action]) => action);
    expect(asked(first.contents)).toEqual(['query', 'discard', 'query']);
    expect(asked(second.contents)).toEqual(['query', 'query']);
    expect(asked(third.contents)).toEqual(['query', 'save', 'query']);
    // Asking destroys nothing; the caller does that once it has the answer.
    expect(first.contents.closed).toBe(false);
  });

  it('reloads only after unsaved work is settled', async () => {
    const stay = setup('Cancel');
    const kept = await stay.open('roadmap', DRAFT);
    await stay.manager.reload(kept.id);
    expect(kept.contents.reloads).toBe(0);

    const leave = setup('Save');
    const reloaded = await leave.open('roadmap', DRAFT);
    await leave.manager.reload(reloaded.id);
    expect(reloaded.contents.reloads).toBe(1);
  });

  it('asks, then reloads, when a page with drafts held back a reload of its own', async () => {
    const { manager, open, shown } = setup('Save');
    const deck = await open('roadmap', DRAFT);
    deck.contents.loading = true;

    deck.contents.emit('will-prevent-unload', {});
    await vi.waitFor(() => expect(deck.contents.reloads).toBe(1));

    expect(shown[0].message).toBe('Save changes to “roadmap” before reloading?');
    expect(manager.info.tabs).toHaveLength(2);
  });

  it('honors an approved reload even when the page still prevents unloading', async () => {
    const { manager, open, shown } = setup('Reload Anyway');
    const deck = await open('roadmap', { ...DRAFT, silent: true });

    const reload = manager.reload(deck.id);
    await vi.advanceTimersByTimeAsync(5000);
    await reload;
    const event = { preventDefault: vi.fn() };
    deck.contents.emit('will-prevent-unload', event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(deck.contents.reloads).toBe(1);
    expect(shown).toHaveLength(1);
  });

  it('switches the window material without reloading any tab', async () => {
    const { manager, open } = setup();
    const deck = await open('roadmap', DRAFT);

    manager.setTranslucent(false);

    expect(deck.contents.reloads).toBe(0);
    expect(deck.contents.closed).toBe(false);
    expect(deck.contents.sent).toContainEqual(['host:translucent', false]);
  });

  it('ignores an answer that comes from a different page', async () => {
    const { manager, open } = setup('Cancel');
    const deck = await open('roadmap', { ...DRAFT, silent: true });
    const other = await open('other');

    const closing = manager.close(deck.id);
    const request = deck.contents.sent.find(([c]) => c === 'host:unsaved')?.[1];
    manager.unsavedReply(other.contents as never, request, { drafts: false, pending: false });
    await vi.advanceTimersByTimeAsync(5000);

    expect(await closing).toBe(false);
    expect(deck.contents.closed).toBe(false);
  });
});
