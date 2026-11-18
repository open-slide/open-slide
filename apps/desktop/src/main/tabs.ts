import { randomUUID } from 'node:crypto';
import {
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
  shell,
  type WebContents,
  WebContentsView,
} from 'electron';
import { deckIdFromPath, isHomePath } from '../../../../packages/core/src/app/lib/desktop-routes';
import { SPARE_PATH, type SwitcherState, TAB_STRIP_HEIGHT, type TabInfo } from '../shared/types';
import { DeckCovers } from './covers';
import { showContextMenu } from './menu';
import type { DeckSession } from './settings';
import { moveTab, recencyOrder } from './tab-order';
import {
  type LeaveIntent,
  type Prompt,
  UnsavedChannel,
  UnsavedGuard,
  type UnsavedPage,
} from './unsaved';
import { isHttpUrl, originOf } from './url';

type Tab = {
  id: string;
  kind: 'home' | 'deck';
  slideId: string | null;
  title: string;
  loading: boolean;
  view: WebContentsView | null;
  // Where a home tab without a view lands once it gets one.
  pendingPath: string | null;
};

// One hold of Ctrl: `order` is fixed when it starts, most recently used first.
type Switching = {
  order: string[];
  index: number;
  shown: boolean;
  timer: NodeJS.Timeout | null;
};

type TabManagerOptions = {
  window: BrowserWindow;
  viewPreload: string;
  shellPreload: string;
  loadShell: (contents: WebContents, route: string) => void;
  onChange: () => void;
  prompt: Prompt;
};

const PRESENTER_RE = /^\/s\/[^/]+\/presenter\/?$/;
const DEFAULT_TITLE = 'open-slide';
// Each warm tab is a renderer running the unbundled dev app; past this,
// restored tabs load on click.
const MAX_WARM_TABS = 3;
const WARM_DELAY_MS = 800;
const ADOPT_TIMEOUT_MS = 1500;
// How long a view that was never shown keeps full-speed frames for its warm-up.
const WARM_SETTLE_MS = 15_000;
const CRASH_WINDOW_MS = 60_000;
const MAX_CRASH_RELOADS = 3;
// A quick Ctrl+Tab flips to the previous tab before the switcher ever shows.
const SWITCHER_DELAY_MS = 150;
// A hidden view keeps its last frame, so the switcher paints itself empty first.
const SWITCHER_HIDE_MS = 100;

// Controls act like native ones: no pointer cursor, no selection, no drag ghosts.
const NATIVE_CSS = `
html, body { overscroll-behavior: none; }
:is(button, summary, label, [role="button"], [role="tab"], [role="menuitem"],
  [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="switch"],
  [role="checkbox"], [role="radio"]) {
  cursor: default !important;
  -webkit-user-select: none;
  user-select: none;
}
:is(a, img):not([draggable="true"]) { -webkit-user-drag: none; }
`;

function openOutside(url: string) {
  if (isHttpUrl(url)) void shell.openExternal(url);
}

export class TabManager {
  private tabs: Tab[];
  private activeId: string;
  private baseUrl: string | null = null;
  private overlay = true;
  private fullscreenTab: Tab | null = null;
  private ownsFullscreen = false;
  private spare: WebContentsView | null = null;
  private warmTimer: NodeJS.Timeout | null = null;
  // A view stays hidden until its first load finishes; an adopted spare also
  // waits for its new route.
  private readonly loaded = new WeakSet<WebContents>();
  private readonly adopting = new WeakSet<WebContents>();
  private readonly revealed = new WeakSet<WebContents>();
  private readonly popups = new Set<BrowserWindow>();
  private readonly crashes = new WeakMap<Tab, number[]>();
  private readonly unsaved = new UnsavedChannel();
  private readonly guard: UnsavedGuard;
  private readonly allowedUnloads = new WeakSet<WebContents>();
  private recent: string[];
  private switcher: WebContentsView | null = null;
  private switching: Switching | null = null;
  private hideTimer: NodeJS.Timeout | null = null;
  private readonly covers: DeckCovers;

  constructor(private readonly opts: TabManagerOptions) {
    this.guard = new UnsavedGuard(opts.prompt);
    const home = this.makeTab('home', null);
    this.tabs = [home];
    this.activeId = home.id;
    this.recent = [home.id];
    this.covers = new DeckCovers({
      idle: () => this.settled(),
      onChange: () => {
        if (this.switching?.shown) this.publishSwitch();
      },
    });
    opts.window.webContents.on('before-input-event', (e, input) => this.onInput(e, input));
    // Focusing a view can raise its window, so the keys are only handed back
    // once the window is in front again.
    opts.window.on('blur', () => this.closeSwitcher());
    opts.window.on('focus', () => {
      if (this.strayKeys()) this.focusOwner();
    });
    // Hidden views are only resized once the drag settles, so a live resize
    // relayouts one renderer instead of every warm one.
    opts.window.on('resize', () => this.layout(false));
    opts.window.on('resized', () => this.layout());
    opts.window.on('enter-full-screen', () => this.layout());
    opts.window.on('leave-full-screen', () => this.layout());
  }

  get info(): { tabs: TabInfo[]; activeTabId: string } {
    return {
      tabs: this.tabs.map(({ view: _view, pendingPath: _pendingPath, ...info }) => info),
      activeTabId: this.activeId,
    };
  }

  get session(): DeckSession {
    const active = this.tabs.find((t) => t.id === this.activeId);
    return {
      decks: this.tabs
        .filter((t) => t.kind === 'deck' && t.slideId)
        .map((t) => ({ slideId: t.slideId as string, title: t.title })),
      active: active?.slideId ?? null,
    };
  }

  owns(contents: WebContents): boolean {
    return (
      this.spare?.webContents === contents ||
      this.tabs.some((t) => t.view?.webContents === contents)
    );
  }

  get switcherContents(): WebContents | null {
    const contents = this.switcher?.webContents;
    return contents && !contents.isDestroyed() ? contents : null;
  }

  hosts(contents: WebContents): boolean {
    if (this.owns(contents)) return true;
    for (const popup of this.popups) {
      if (!popup.isDestroyed() && popup.webContents === contents) return true;
    }
    return false;
  }

  isServerUrl(url: string): boolean {
    return this.baseUrl !== null && originOf(url) === originOf(this.baseUrl);
  }

  adopted(contents: WebContents) {
    if (!this.adopting.delete(contents)) return;
    this.layout();
  }

  unsavedReply(contents: WebContents, request: unknown, payload: unknown) {
    this.unsaved.answer(contents, request, payload);
  }

  confirmLeave(intent: LeaveIntent): Promise<boolean> {
    return this.confirm(this.tabs, intent);
  }

  setTranslucent(translucent: boolean) {
    for (const view of [...this.tabs.map((t) => t.view), this.spare]) {
      if (view && !view.webContents.isDestroyed()) {
        view.webContents.send('host:translucent', translucent);
      }
    }
  }

  // Destroys every tab without asking; settle unsaved work first with confirmLeave.
  reset(session: DeckSession) {
    this.destroy();
    this.exitOwnedFullscreen();
    const home = this.makeTab('home', null);
    const decks = session.decks.map((d) => ({
      ...this.makeTab('deck', d.slideId),
      title: d.title,
    }));
    this.tabs = [home, ...decks];
    this.activeId = decks.find((t) => t.slideId === session.active)?.id ?? home.id;
    this.recent = [this.activeId];
    this.baseUrl = null;
    this.covers.setBaseUrl(null);
    this.fullscreenTab = null;
    this.changed();
  }

  setBaseUrl(url: string | null) {
    if (url === this.baseUrl) return;
    const previous = this.baseUrl;
    this.baseUrl = url;
    this.destroySpare();
    if (url && previous) {
      for (const tab of this.tabs) {
        if (!tab.view) continue;
        const current = new URL(tab.view.webContents.getURL() || previous);
        this.load(tab.view.webContents, `${current.pathname}${current.search}`);
      }
    }
    this.layout();
    this.scheduleWarm();
    this.covers.setBaseUrl(url);
  }

  setOverlay(open: boolean) {
    if (this.overlay === open) return;
    this.overlay = open;
    if (open) this.endSwitch(false);
    this.layout();
  }

  activate(id: string) {
    if (!this.tabs.some((t) => t.id === id)) return;
    this.closeSwitcher();
    const previous = this.active();
    this.activeId = id;
    this.recent = [id, ...this.recent.filter((other) => other !== id)];
    // It may have been edited while it was in front.
    if (previous?.slideId && previous.id !== id) this.covers.refresh(previous.slideId);
    this.layout();
    this.active()?.view?.webContents.focus();
    this.changed();
  }

  activateIndex(index: number) {
    const tab = index < 0 ? this.tabs.at(-1) : this.tabs[index];
    if (tab) this.activate(tab.id);
  }

  cycle(delta: number) {
    const i = this.tabs.findIndex((t) => t.id === this.activeId);
    const next = this.tabs[(i + delta + this.tabs.length) % this.tabs.length];
    if (next) this.activate(next.id);
  }

  // True when it opened a new tab rather than switching to one.
  openDeck(slideId: string): boolean {
    const existing = this.tabs.find((t) => t.kind === 'deck' && t.slideId === slideId);
    if (existing) {
      this.activate(existing.id);
      return false;
    }
    const tab = this.makeTab('deck', slideId);
    this.tabs.push(tab);
    this.activate(tab.id);
    return true;
  }

  openHome(path?: string) {
    const home = this.tabs[0];
    if (path) {
      if (home.view) home.view.webContents.send('host:navigate', path);
      else home.pendingPath = path;
    }
    this.activate(home.id);
  }

  async close(id: string): Promise<boolean> {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab || tab.kind === 'home') return false;
    if (!(await this.confirm([tab], 'close'))) return false;
    this.remove([tab]);
    return true;
  }

  private async closeAround(anchor: Tab, keep: (tab: Tab, index: number) => boolean) {
    const closing = this.tabs.filter((t, i) => t.kind !== 'home' && !keep(t, i));
    if (!closing.length || !(await this.confirm(closing, 'close'))) return;
    this.remove(closing, anchor);
  }

  // Tabs may have changed while the user was deciding.
  private remove(closing: Tab[], anchor?: Tab) {
    const gone = closing.filter((t) => this.tabs.includes(t));
    if (!gone.length) return;
    const index = this.tabs.findIndex((t) => t.id === this.activeId);
    this.tabs = this.tabs.filter((t) => !gone.includes(t));
    this.recent = this.recent.filter((id) => this.tabs.some((t) => t.id === id));
    for (const tab of gone) this.destroyView(tab);
    if (this.fullscreenTab && gone.includes(this.fullscreenTab)) this.leaveHtmlFullscreen();
    if (this.tabs.some((t) => t.id === this.activeId)) {
      this.changed();
      return;
    }
    const next =
      anchor && this.tabs.includes(anchor)
        ? anchor
        : (this.tabs[Math.min(index, this.tabs.length - 1)] ?? this.tabs[0]);
    this.activate(next.id);
  }

  async reload(id: string) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab?.view || !(await this.confirm([tab], 'reload'))) return;
    const contents = tab.view?.webContents;
    if (contents && !contents.isDestroyed()) {
      this.allowedUnloads.add(contents);
      contents.reload();
    }
  }

  reloadActive() {
    void this.reload(this.activeId);
  }

  private confirm(tabs: Tab[], intent: LeaveIntent): Promise<boolean> {
    const pages: UnsavedPage[] = [];
    for (const tab of tabs) {
      const contents = tab.view?.webContents;
      if (!contents || !this.canHoldWork(contents)) continue;
      pages.push(this.unsaved.page(contents, tab.title, () => this.activate(tab.id)));
    }
    return this.guard.confirm(pages, intent);
  }

  // A page that never loaded, crashed, or sits on an error page has no core app to answer.
  private canHoldWork(contents: WebContents): boolean {
    return (
      !contents.isDestroyed() &&
      !contents.isCrashed() &&
      this.loaded.has(contents) &&
      this.isServerUrl(contents.getURL())
    );
  }

  showMenu(id: string) {
    const index = this.tabs.findIndex((t) => t.id === id);
    const tab = this.tabs[index];
    if (!tab) return;
    const decks = this.tabs.filter((t) => t.kind === 'deck');
    const items: MenuItemConstructorOptions[] = [
      { label: 'Reload Tab', click: () => void this.reload(id), enabled: !!tab.view },
      { type: 'separator' },
      { label: 'Close Tab', enabled: tab.kind === 'deck', click: () => void this.close(id) },
      {
        label: 'Close Other Tabs',
        enabled: decks.some((t) => t !== tab),
        click: () => void this.closeAround(tab, (t) => t === tab),
      },
      {
        label: 'Close Tabs to the Right',
        enabled: index < this.tabs.length - 1,
        click: () => {
          const at = this.tabs.indexOf(tab);
          if (at >= 0) void this.closeAround(tab, (_t, i) => i <= at);
        },
      },
    ];
    Menu.buildFromTemplate(items).popup({ window: this.opts.window });
  }

  closeActive(): boolean {
    const tab = this.active();
    if (!tab || tab.kind === 'home') return false;
    void this.close(tab.id);
    return true;
  }

  move(id: string, toIndex: number) {
    const from = this.tabs.findIndex((t) => t.id === id);
    if (from < 1 || !Number.isInteger(toIndex)) return;
    this.tabs = moveTab(this.tabs, from, toIndex);
    this.changed();
  }

  activeContents(): WebContents | null {
    return this.active()?.view?.webContents ?? null;
  }

  pickSwitch(id: unknown) {
    const session = this.switching;
    if (!session) return;
    const index = typeof id === 'string' ? session.order.indexOf(id) : -1;
    if (index >= 0) session.index = index;
    this.endSwitch(index >= 0);
  }

  destroy() {
    this.closeSwitcher();
    for (const tab of this.tabs) this.destroyView(tab);
    this.destroySpare();
    this.destroySwitcher();
    this.cancelWarm();
    this.covers.clear();
    for (const popup of this.popups) {
      if (!popup.isDestroyed()) popup.close();
    }
    this.popups.clear();
  }

  // A failed load already reaches the tab through did-fail-load.
  private load(contents: WebContents, path: string) {
    contents.loadURL(`${this.baseUrl}${path}`).catch(() => {});
  }

  private active(): Tab | undefined {
    return this.tabs.find((t) => t.id === this.activeId);
  }

  private changed() {
    this.syncCovers();
    this.opts.onChange();
  }

  private syncCovers() {
    this.covers.sync(this.tabs.flatMap((t) => (t.slideId ? [t.slideId] : [])));
  }

  // Nothing the user is waiting on is still loading.
  private settled(): boolean {
    const contents = this.active()?.view?.webContents;
    return !!contents && this.loaded.has(contents) && !this.tabs.some((t) => t.loading);
  }

  private focusOwner() {
    if (this.switching) this.switcherContents?.focus();
    else if (this.overlay) this.opts.window.webContents.focus();
    else (this.fullscreenTab ?? this.active())?.view?.webContents.focus();
  }

  // A view takes the keys the moment its first page starts loading, hidden or not.
  private keepKeys(view: WebContentsView) {
    view.webContents.on('focus', () => {
      if (!view.getVisible() && this.opts.window.isFocused()) this.focusOwner();
    });
  }

  private strayKeys(): boolean {
    return [...this.tabs.map((t) => t.view), this.spare, this.switcher].some(
      (view) =>
        view &&
        !view.webContents.isDestroyed() &&
        !view.getVisible() &&
        view.webContents.isFocused(),
    );
  }

  private onInput(event: Electron.Event, input: Electron.Input) {
    const down = input.type === 'keyDown';
    const tab = input.key === 'Tab' && input.control && !input.alt && !input.meta;
    const delta = input.shift ? -1 : 1;
    if (!this.switching) {
      if (down && tab && this.beginSwitch(delta)) event.preventDefault();
      return;
    }
    // Nothing is swallowed from here on: the release of Ctrl has to arrive.
    if (down && input.key === 'Escape') this.endSwitch(false);
    else if (input.key === 'Control' ? !down : !input.control) this.endSwitch(true);
    else if (!down) return;
    else if (tab) this.stepSwitch(delta);
    else if (input.key === 'ArrowRight' || input.key === 'ArrowDown') this.stepSwitch(1);
    else if (input.key === 'ArrowLeft' || input.key === 'ArrowUp') this.stepSwitch(-1);
    else if (input.key === 'Enter') this.endSwitch(true);
  }

  private beginSwitch(delta: number): boolean {
    if (!this.baseUrl || this.overlay || this.fullscreenTab || this.tabs.length < 2) return false;
    const order = recencyOrder(
      this.tabs.map((t) => t.id),
      [this.activeId, ...this.recent],
    );
    this.switching = {
      order,
      index: delta > 0 ? 1 : order.length - 1,
      shown: false,
      timer: setTimeout(() => this.revealSwitcher(), SWITCHER_DELAY_MS),
    };
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    const win = this.opts.window;
    const view = this.switcher ?? this.createSwitcher();
    // Adding it again raises it above the tab views created since.
    win.contentView.addChildView(view);
    const { width, height } = win.getContentBounds();
    view.setBounds({ x: 0, y: 0, width, height });
    view.setVisible(true);
    // A page whose key-down was swallowed is sent no key-ups until its next
    // key-down, so the switcher takes the keys and sees Ctrl let go.
    view.webContents.focus();
    return true;
  }

  private stepSwitch(delta: number) {
    const session = this.switching;
    if (!session) return;
    const count = session.order.length;
    session.index = (session.index + delta + count) % count;
    if (session.shown) this.publishSwitch();
    else this.revealSwitcher();
  }

  private revealSwitcher() {
    const session = this.switching;
    if (!session || session.shown) return;
    if (session.timer) clearTimeout(session.timer);
    session.timer = null;
    session.shown = true;
    const slideId = this.active()?.slideId;
    if (slideId) this.covers.refresh(slideId);
    this.publishSwitch();
  }

  private endSwitch(commit: boolean) {
    const session = this.switching;
    if (!session) return;
    const target = session.order[session.index];
    this.closeSwitcher();
    if (commit && target !== this.activeId && this.tabs.some((t) => t.id === target)) {
      this.activate(target);
    } else {
      this.focusOwner();
    }
  }

  private closeSwitcher() {
    const session = this.switching;
    if (!session) return;
    if (session.timer) clearTimeout(session.timer);
    this.switching = null;
    this.publishSwitch();
    const hide = () => {
      this.hideTimer = null;
      if (this.switcherContents) this.switcher?.setVisible(false);
    };
    if (session.shown) this.hideTimer = setTimeout(hide, SWITCHER_HIDE_MS);
    else hide();
  }

  private publishSwitch() {
    this.switcherContents?.send('switcher:state', this.switchState());
  }

  private switchState(): SwitcherState | null {
    const session = this.switching;
    if (!session?.shown) return null;
    const tabs = session.order.flatMap((id) => {
      const tab = this.tabs.find((t) => t.id === id);
      if (!tab) return [];
      const cover = tab.slideId ? this.covers.get(tab.slideId) : null;
      return [{ id, kind: tab.kind, title: tab.title, cover }];
    });
    return { tabs, selectedId: session.order[session.index] };
  }

  private createSwitcher(): WebContentsView {
    const view = new WebContentsView({
      webPreferences: { preload: this.opts.shellPreload, sandbox: true, contextIsolation: true },
    });
    view.setBackgroundColor('#00000000');
    view.setVisible(false);
    const contents = view.webContents;
    this.keepKeys(view);
    contents.on('before-input-event', (e, input) => this.onInput(e, input));
    // A session can start before the page is there to hear about it.
    contents.on('did-finish-load', () => this.publishSwitch());
    contents.on('will-navigate', (e) => e.preventDefault());
    contents.on('render-process-gone', () => {
      if (this.switcher !== view) return;
      this.endSwitch(false);
      this.destroySwitcher();
    });
    this.opts.window.contentView.addChildView(view);
    this.opts.loadShell(contents, 'switcher');
    this.switcher = view;
    return view;
  }

  private destroySwitcher() {
    const view = this.switcher;
    this.switcher = null;
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    if (view) this.disposeView(view);
  }

  private makeTab(kind: Tab['kind'], slideId: string | null): Tab {
    return {
      id: randomUUID(),
      kind,
      slideId,
      title: kind === 'home' ? 'Home' : (slideId ?? ''),
      loading: false,
      view: null,
      pendingPath: null,
    };
  }

  private pathFor(tab: Tab): string {
    if (tab.kind === 'deck' && tab.slideId) return `/s/${encodeURIComponent(tab.slideId)}`;
    const path = tab.pendingPath ?? '/';
    tab.pendingPath = null;
    return path;
  }

  private layout(includeHidden = true) {
    const win = this.opts.window;
    if (win.isDestroyed()) return;
    const { width, height } = win.getContentBounds();
    const bounds = (top: number) => ({ x: 0, y: top, width, height: Math.max(0, height - top) });
    for (const tab of this.tabs) {
      const visible =
        this.baseUrl !== null &&
        !this.overlay &&
        (this.fullscreenTab ? tab === this.fullscreenTab : tab.id === this.activeId);
      if (visible) this.ensureView(tab);
      if (!tab.view) continue;
      const contents = tab.view.webContents;
      const shown = visible && this.isShowable(contents);
      if (shown || includeHidden) {
        tab.view.setBounds(bounds(this.fullscreenTab === tab ? 0 : TAB_STRIP_HEIGHT));
      }
      tab.view.setVisible(shown);
      if (shown && !this.revealed.has(contents)) {
        this.revealed.add(contents);
        contents.setBackgroundThrottling(true);
        // It could not take the keys while it was hidden.
        this.focusOwner();
      }
    }
    if (this.spare && includeHidden) this.spare.setBounds(bounds(TAB_STRIP_HEIGHT));
    if (this.switcher && (includeHidden || this.switching)) this.switcher.setBounds(bounds(0));
  }

  private isShowable(contents: WebContents): boolean {
    return this.loaded.has(contents) && !this.adopting.has(contents);
  }

  private createView(): WebContentsView {
    const view = new WebContentsView({
      webPreferences: {
        preload: this.opts.viewPreload,
        sandbox: true,
        contextIsolation: true,
        spellcheck: true,
        // Core's deck warm-up paces itself on animation frames, which a
        // throttled hidden view never gets; throttling resumes once shown.
        backgroundThrottling: false,
      },
    });
    view.setBackgroundColor('#00000000');
    view.setVisible(false);
    const contents = view.webContents;
    const markLoaded = () => {
      if (this.loaded.has(contents)) return;
      this.loaded.add(contents);
      this.layout();
      this.scheduleWarm();
      this.syncCovers();
      setTimeout(() => {
        if (contents.isDestroyed() || this.revealed.has(contents)) return;
        if (!this.adopting.has(contents)) contents.setBackgroundThrottling(true);
      }, WARM_SETTLE_MS);
    };
    contents.on('did-finish-load', markLoaded);
    contents.on('did-fail-load', (_e, _code, _desc, _url, isMainFrame) => {
      if (isMainFrame) markLoaded();
    });
    contents.on('dom-ready', () => void contents.insertCSS(NATIVE_CSS));
    contents.on('before-input-event', (e, input) => this.onInput(e, input));
    this.keepKeys(view);
    this.opts.window.contentView.addChildView(view);
    return view;
  }

  private ensureView(tab: Tab) {
    if (tab.view || !this.baseUrl) return;
    const path = this.pathFor(tab);
    const spare = tab.kind === 'deck' ? this.takeSpare() : null;
    const view = spare ?? this.createView();
    tab.view = view;
    this.wire(tab, view.webContents);
    if (spare) this.adopt(spare.webContents, path);
    else this.load(view.webContents, path);
  }

  private adopt(contents: WebContents, path: string) {
    this.adopting.add(contents);
    contents.setBackgroundThrottling(false);
    setTimeout(() => this.adopted(contents), ADOPT_TIMEOUT_MS);
    // Back would otherwise land on the spare page and bounce the tab home.
    contents.once('did-navigate-in-page', () => contents.navigationHistory.clear());
    contents.send('host:navigate', path);
    this.scheduleWarm();
  }

  private takeSpare(): WebContentsView | null {
    const spare = this.spare;
    this.spare = null;
    return spare && !spare.webContents.isDestroyed() ? spare : null;
  }

  private createSpare() {
    const view = this.createView();
    this.spare = view;
    view.webContents.on('render-process-gone', () => {
      if (this.spare === view) this.destroySpare();
    });
    this.layout();
    this.load(view.webContents, SPARE_PATH);
  }

  private destroySpare() {
    const spare = this.spare;
    this.spare = null;
    if (spare) this.disposeView(spare);
  }

  private cancelWarm() {
    if (this.warmTimer) clearTimeout(this.warmTimer);
    this.warmTimer = null;
  }

  private scheduleWarm() {
    this.cancelWarm();
    this.warmTimer = setTimeout(() => {
      this.warmTimer = null;
      this.warm();
    }, WARM_DELAY_MS);
  }

  // One background load at a time, after whatever the user is waiting on:
  // restored tabs first, then a spare for the next deck, then the tab switcher.
  private warm() {
    if (!this.baseUrl || this.opts.window.isDestroyed()) return;
    const views = [...this.tabs.map((t) => t.view), this.spare];
    if (views.some((v) => v && !this.loaded.has(v.webContents))) return;
    const cold = this.tabs.find((t) => !t.view);
    if (cold && this.tabs.filter((t) => t.view).length < MAX_WARM_TABS) {
      this.ensureView(cold);
      this.layout();
    } else if (!this.spare) {
      this.createSpare();
    } else if (!this.switcher && this.tabs.length > 1) {
      this.createSwitcher();
    }
  }

  private destroyView(tab: Tab) {
    const view = tab.view;
    if (!view) return;
    tab.view = null;
    this.disposeView(view);
  }

  private disposeView(view: WebContentsView) {
    const win = this.opts.window;
    if (!win.isDestroyed()) win.contentView.removeChildView(view);
    if (!view.webContents.isDestroyed()) view.webContents.close();
  }

  // Presenter windows carry the host bridge, so they stay on the dev server
  // and close with the workspace.
  private trackPopup(popup: BrowserWindow) {
    this.popups.add(popup);
    popup.on('closed', () => this.popups.delete(popup));
    const contents = popup.webContents;
    const guard = (e: Electron.Event, url: string) => {
      if (this.isServerUrl(url)) return;
      e.preventDefault();
      openOutside(url);
    };
    contents.on('will-navigate', (e) => guard(e, e.url));
    contents.on('will-redirect', (e) => guard(e, e.url));
    contents.setWindowOpenHandler(({ url }) => {
      if (!this.isServerUrl(url)) openOutside(url);
      return { action: 'deny' };
    });
  }

  private async offerReload(tab: Tab, contents: WebContents) {
    const response = await this.opts.prompt({
      type: 'warning',
      message: `“${tab.title}” keeps crashing`,
      detail: 'Reloading it did not help. You can try once more or leave it for now.',
      buttons: ['Reload', tab.kind === 'deck' ? 'Close Tab' : 'Cancel'],
      defaultId: 0,
      cancelId: 1,
    });
    if (tab.view?.webContents !== contents || contents.isDestroyed()) return;
    if (response === 0) contents.reload();
    else if (tab.kind === 'deck') void this.close(tab.id);
  }

  private wire(tab: Tab, contents: WebContents) {
    contents.on('page-title-updated', (_e, title) => {
      if (tab.kind !== 'deck') return;
      tab.title = title && title !== DEFAULT_TITLE ? title : (tab.slideId ?? title);
      this.changed();
    });
    contents.on('did-start-loading', () => {
      tab.loading = true;
      this.changed();
    });
    contents.on('did-stop-loading', () => {
      tab.loading = false;
      this.changed();
    });
    contents.on('did-navigate-in-page', (_e, url, isMainFrame) => {
      if (isMainFrame) this.followNavigation(tab, contents, url);
    });
    contents.on('did-navigate', (_e, url) => this.followNavigation(tab, contents, url));

    contents.on('will-navigate', (e) => {
      if (!this.isServerUrl(e.url)) {
        e.preventDefault();
        openOutside(e.url);
        return;
      }
      const url = new URL(e.url);
      const deck = deckIdFromPath(url.pathname);
      if (tab.kind === 'home' && deck) {
        e.preventDefault();
        this.openDeck(deck);
      } else if (tab.kind === 'deck' && isHomePath(url.pathname)) {
        e.preventDefault();
        this.openHome(url.pathname + url.search);
      }
    });

    contents.setWindowOpenHandler(({ url: raw }) => {
      if (!this.isServerUrl(raw)) {
        openOutside(raw);
        return { action: 'deny' };
      }
      const url = new URL(raw);
      if (PRESENTER_RE.test(url.pathname)) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            autoHideMenuBar: true,
            webPreferences: {
              preload: this.opts.viewPreload,
              sandbox: true,
              contextIsolation: true,
            },
          },
        };
      }
      const deck = deckIdFromPath(url.pathname);
      if (deck) this.openDeck(deck);
      else if (isHomePath(url.pathname)) this.openHome(url.pathname + url.search);
      return { action: 'deny' };
    });
    contents.on('did-create-window', (popup) => this.trackPopup(popup));

    contents.on('enter-html-full-screen', () => {
      this.fullscreenTab = tab;
      const win = this.opts.window;
      if (!win.isFullScreen()) {
        this.ownsFullscreen = true;
        win.setFullScreen(true);
      }
      this.layout();
      this.changed();
    });
    contents.on('leave-html-full-screen', () => this.leaveHtmlFullscreen());

    contents.on('context-menu', (_e, params) => {
      const external = isHttpUrl(params.linkURL) && !this.isServerUrl(params.linkURL);
      showContextMenu(
        this.opts.window,
        contents,
        params,
        external
          ? [{ label: 'Open Link in Browser', click: () => openOutside(params.linkURL) }]
          : [],
      );
    });

    // Core holds back an unload it was not asked for while it has drafts, such
    // as a dev-server reload; the user is asked, then the reload follows.
    contents.on('will-prevent-unload', (event) => {
      if (this.allowedUnloads.delete(contents)) event.preventDefault();
      else void this.reload(tab.id);
    });
    contents.on('did-finish-load', () => this.allowedUnloads.delete(contents));
    contents.on('did-fail-load', () => this.allowedUnloads.delete(contents));

    contents.on('render-process-gone', (_e, details) => {
      if (details.reason === 'clean-exit') return;
      const now = Date.now();
      const recent = (this.crashes.get(tab) ?? []).filter((at) => now - at < CRASH_WINDOW_MS);
      recent.push(now);
      this.crashes.set(tab, recent);
      if (recent.length <= MAX_CRASH_RELOADS) {
        contents.reload();
        return;
      }
      this.crashes.delete(tab);
      // A background tab gives up quietly and loads again when it is clicked.
      if (tab.id === this.activeId) void this.offerReload(tab, contents);
      else this.destroyView(tab);
    });
  }

  private leaveHtmlFullscreen() {
    this.fullscreenTab = null;
    this.exitOwnedFullscreen();
    this.layout();
    this.changed();
  }

  private exitOwnedFullscreen() {
    if (!this.ownsFullscreen) return;
    this.ownsFullscreen = false;
    if (!this.opts.window.isDestroyed()) this.opts.window.setFullScreen(false);
  }

  // Catches navigation between home and a deck that slipped past core asking
  // the host, so a tab keeps its role.
  private followNavigation(tab: Tab, contents: WebContents, href: string) {
    const url = new URL(href);
    // A spare adopted mid-boot still commits its own page after joining a tab.
    if (!this.isServerUrl(href) || url.pathname === SPARE_PATH) return;
    const deck = deckIdFromPath(url.pathname);
    if (tab.kind === 'deck') {
      if (deck && deck !== tab.slideId) {
        tab.slideId = deck;
        this.changed();
      } else if (isHomePath(url.pathname)) {
        this.restore(contents, `/s/${encodeURIComponent(tab.slideId ?? '')}`);
        this.openHome(url.pathname + url.search);
      }
    } else if (deck) {
      this.restore(contents, '/');
      this.openDeck(deck);
    }
  }

  private restore(contents: WebContents, path: string) {
    if (contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
    else this.load(contents, path);
  }
}
