import { EventEmitter } from 'node:events';
import type { BrowserWindow, MessageBoxOptions } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SwitcherState, UnsavedAction, UnsavedOutcome, UnsavedStatus } from '../shared/types';

type PageScript = {
  status: UnsavedStatus;
  outcomes?: Partial<Record<UnsavedAction, UnsavedOutcome>>;
  silent?: boolean;
};

const fixture = vi.hoisted(() => ({
  views: [] as { webContents: FakeContents; visible: boolean }[],
  deliver: (_contents: unknown, _request: unknown, _payload: unknown) => {},
}));

class FakeContents extends EventEmitter {
  url = '';
  closed = false;
  loading = false;
  reloads = 0;
  focuses = 0;
  focused = false;
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
  focus() {
    this.focuses++;
  }
  isFocused() {
    return this.focused;
  }
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
    visible = true;
    constructor() {
      fixture.views.push(this);
    }
    setBackgroundColor() {}
    setVisible(visible: boolean) {
      this.visible = visible;
    }
    getVisible() {
      return this.visible;
    }
    setBounds() {}
  },
}));

const { TabManager } = await import('./tabs');

const BASE = 'http://localhost:5173';

function setup(...answers: string[]) {
  const shown: MessageBoxOptions[] = [];
  const switcher: { contents: FakeContents | null } = { contents: null };
  const window = Object.assign(new EventEmitter(), {
    webContents: new FakeContents(),
    isDestroyed: () => false,
    isFocused: () => true,
    isFullScreen: () => false,
    setFullScreen: () => {},
    getContentBounds: () => ({ x: 0, y: 0, width: 1200, height: 800 }),
    contentView: { addChildView: () => {}, removeChildView: () => {} },
  });
  const manager = new TabManager({
    window: window as unknown as BrowserWindow,
    viewPreload: '/preload.cjs',
    shellPreload: '/shell.cjs',
    loadShell: (contents) => {
      switcher.contents = contents as unknown as FakeContents;
    },
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
  const active = () => {
    const { tabs, activeTabId } = manager.info;
    return tabs.find((t) => t.id === activeTabId)?.slideId ?? 'home';
  };
  return { manager, open, shown, titles, active, window, switcher };
}

type Key = { key: string; type?: 'keyDown' | 'keyUp'; control?: boolean; shift?: boolean };

function press(contents: FakeContents | null, { key, type = 'keyDown', ...mods }: Key): boolean {
  const event = { preventDefault: vi.fn() };
  const input = { type, key, control: true, shift: false, alt: false, meta: false, ...mods };
  contents?.emit('before-input-event', event, input);
  return event.preventDefault.mock.calls.length > 0;
}

const CTRL_UP: Key = { key: 'Control', type: 'keyUp', control: false };

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
    expect(deck.contents.closed).toBe(false);
    expect(await closing).toBe(true);

    expect(shown[0].message).toBe('Save changes to “roadmap” before closing?');
    const actions = deck.contents.sent.filter(([c]) => c === 'host:unsaved').map(([, , a]) => a);
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

describe('TabManager tab switcher', () => {
  beforeEach(() => {
    fixture.views = [];
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => vi.useRealTimers());

  const published = (contents: FakeContents | null) =>
    (contents?.sent ?? []).filter(([c]) => c === 'switcher:state').map(([, state]) => state);
  const picture = (state: unknown) => {
    const { tabs, selectedId } = state as SwitcherState;
    return tabs.map((t) => (t.id === selectedId ? `[${t.title}]` : t.title)).join(' ');
  };

  it('flips to the previous tab on a quick Ctrl+Tab without showing anything', async () => {
    const { open, active, switcher } = setup();
    await open('first');
    const second = await open('second');

    expect(press(second.contents, { key: 'Tab' })).toBe(true);
    expect(switcher.contents?.focuses).toBe(1);
    expect(press(switcher.contents, CTRL_UP)).toBe(false);

    expect(active()).toBe('first');
    expect(published(switcher.contents)).toEqual([null]);
    expect(fixture.views.find((v) => v.webContents === switcher.contents)?.visible).toBe(false);
  });

  it('lists the decks most recent first once Ctrl is held, and walks them', async () => {
    const { open, active, switcher } = setup();
    await open('first');
    await open('second');
    const third = await open('third');

    press(third.contents, { key: 'Tab' });
    await vi.advanceTimersByTimeAsync(150);
    expect(picture(published(switcher.contents).at(-1))).toBe('third [second] first');

    press(switcher.contents, { key: 'Tab' });
    expect(picture(published(switcher.contents).at(-1))).toBe('third second [first]');
    press(switcher.contents, { key: 'Tab' });
    press(switcher.contents, { key: 'ArrowRight' });
    press(switcher.contents, { key: 'ArrowLeft' });
    expect(picture(published(switcher.contents).at(-1))).toBe('[third] second first');
    press(switcher.contents, { key: 'Tab', shift: true });
    press(switcher.contents, { key: 'Tab', type: 'keyUp' });
    expect(active()).toBe('third');

    press(switcher.contents, CTRL_UP);
    expect(active()).toBe('first');
    expect(published(switcher.contents).at(-1)).toBeNull();
  });

  it('shows at once when Tab is pressed again before the delay', async () => {
    const { open, switcher } = setup();
    await open('first');
    await open('second');
    const third = await open('third');

    press(third.contents, { key: 'Tab' });
    press(switcher.contents, { key: 'Tab' });

    expect(picture(published(switcher.contents).at(-1))).toBe('third second [first]');
  });

  it('leaves Home out, and goes from Home to the last deck', async () => {
    const { manager, open, active, window, switcher } = setup();
    await open('first');
    await open('second');
    manager.activate(manager.info.tabs[0].id);

    press(window.webContents, { key: 'Tab' });
    await vi.advanceTimersByTimeAsync(150);
    expect(picture(published(switcher.contents).at(-1))).toBe('[second] first');

    press(switcher.contents, CTRL_UP);
    expect(active()).toBe('second');
  });

  it('leaves the tab alone on Escape or a click outside, and gives it the keys back', async () => {
    const { manager, open, active, switcher } = setup();
    await open('first');
    const second = await open('second');

    for (const dismiss of [
      () => press(switcher.contents, { key: 'Escape' }),
      () => manager.pickSwitch(null),
    ]) {
      press(second.contents, { key: 'Tab' });
      await vi.advanceTimersByTimeAsync(150);
      const before = second.contents.focuses;
      dismiss();
      expect(active()).toBe('second');
      expect(published(switcher.contents).at(-1)).toBeNull();
      expect(second.contents.focuses).toBe(before + 1);
      await vi.advanceTimersByTimeAsync(100);
    }
  });

  it('closes when the window loses focus, and only takes the keys back once it returns', async () => {
    const { open, active, window, switcher } = setup();
    await open('first');
    const second = await open('second');

    press(second.contents, { key: 'Tab' });
    await vi.advanceTimersByTimeAsync(150);
    const shell = switcher.contents as FakeContents;
    const before = second.contents.focuses;
    shell.focused = true;
    window.emit('blur');
    await vi.advanceTimersByTimeAsync(100);

    expect(active()).toBe('second');
    expect(published(shell).at(-1)).toBeNull();
    expect(second.contents.focuses).toBe(before);

    window.emit('focus');
    expect(second.contents.focuses).toBe(before + 1);
  });

  it('switches to a tab that is clicked', async () => {
    const { manager, open, active } = setup();
    const first = await open('first');
    const second = await open('second');

    press(second.contents, { key: 'Tab' });
    await vi.advanceTimersByTimeAsync(150);
    manager.pickSwitch(first.id);

    expect(active()).toBe('first');
  });

  it('commits when a key arrives after Ctrl was let go unseen', async () => {
    const { open, active, switcher } = setup();
    await open('first');
    const second = await open('second');

    press(second.contents, { key: 'Tab' });
    press(switcher.contents, { key: 'a', control: false });

    expect(active()).toBe('first');
  });

  it('hands the keys back when a hidden view takes them as it loads', async () => {
    const { open } = setup();
    const first = await open('first');
    const second = await open('second');
    const before = second.contents.focuses;

    first.contents.emit('focus');
    expect(second.contents.focuses).toBe(before + 1);

    second.contents.emit('focus');
    expect(second.contents.focuses).toBe(before + 1);
  });

  it('passes Ctrl+Tab through when there is nothing to switch between', async () => {
    const alone = setup();
    expect(press(alone.window.webContents, { key: 'Tab' })).toBe(false);

    const single = setup();
    const only = await single.open('first');
    expect(press(only.contents, { key: 'Tab' })).toBe(false);

    const covered = setup();
    const deck = await covered.open('first');
    covered.manager.setOverlay(true);
    expect(press(deck.contents, { key: 'Tab' })).toBe(false);
    expect(covered.active()).toBe('first');
  });
});
