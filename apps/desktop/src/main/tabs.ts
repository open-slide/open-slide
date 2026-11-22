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
import { SPARE_PATH, type SwitcherTab, TAB_STRIP_HEIGHT, type TabInfo } from '../shared/types';
import { DeckCovers } from './covers';
import { showContextMenu } from './menu';
import type { DeckSession } from './settings';
import { moveTab, recencyOrder } from './tab-order';
import { TabSwitcher } from './tab-switcher';
import {
  type LeaveIntent,
  type Prompt,
  UnsavedChannel,
  UnsavedGuard,
  type UnsavedPage,
} from './unsaved';
import { deckPath, isHttpUrl, originOf } from './url';

type Tab = {
  id: string;
  kind: 'home' | 'deck';
  slideId: string | null;
  title: string;
  loading: boolean;
  view: WebContentsView | null;
  pendingPath: string | null;
};

type TabManagerOptions = {
  window: BrowserWindow;
  viewPreload: string;
  shellPreload: string;
  loadShell: (contents: WebContents, route: string) => void;
  onChange: () => void;
  prompt: Prompt;
};

type LayoutScope = 'all' | 'visible';

const PRESENTER_RE = /^\/s\/[^/]+\/presenter\/?$/;
const DEFAULT_TITLE = 'open-slide';
const MAX_WARM_TABS = 3;
const WARM_DELAY_MS = 800;
const ADOPT_TIMEOUT_MS = 1500;
const WARM_SETTLE_MS = 15_000;
const CRASH_WINDOW_MS = 60_000;
const MAX_CRASH_RELOADS = 3;

const NATIVE_CONTROLS_CSS = `
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

function pathOf(url: URL): string {
  return url.pathname + url.search;
}

function holdsStrayKeys(view: WebContentsView | null): boolean {
  return (
    view !== null &&
    !view.webContents.isDestroyed() &&
    !view.getVisible() &&
    view.webContents.isFocused()
  );
}

export class TabManager {
  private tabs: Tab[];
  private activeId: string;
  private recent: string[];
  private baseUrl: string | null = null;
  private overlay = true;
  private fullscreenTab: Tab | null = null;
  private ownsFullscreen = false;
  private spare: WebContentsView | null = null;
  private warmTimer: NodeJS.Timeout | null = null;
  private readonly loaded = new WeakSet<WebContents>();
  private readonly adopting = new WeakSet<WebContents>();
  private readonly revealed = new WeakSet<WebContents>();
  private readonly allowedUnloads = new WeakSet<WebContents>();
  private readonly popups = new Set<BrowserWindow>();
  private readonly crashes = new WeakMap<Tab, number[]>();
  private readonly unsaved = new UnsavedChannel();
  private readonly guard: UnsavedGuard;
  private readonly covers: DeckCovers;
  private readonly switcher: TabSwitcher;

  constructor(private readonly opts: TabManagerOptions) {
    this.guard = new UnsavedGuard(opts.prompt);
    const home = this.makeTab('home', null);
    this.tabs = [home];
    this.activeId = home.id;
    this.recent = [home.id];
    this.covers = new DeckCovers({
      idle: () => this.settled(),
      onChange: () => this.switcher.refresh(),
    });
    this.switcher = new TabSwitcher({
      window: opts.window,
      preload: opts.shellPreload,
      loadShell: opts.loadShell,
      keepKeys: (view) => this.keepKeys(view),
      dispose: (view) => this.disposeView(view),
      order: () => this.switchOrder(),
      describe: (id) => this.describe(id),
      onReveal: () => this.refreshCover(this.active()),
      onEnd: (pickedId) => this.finishSwitch(pickedId),
    });
    const { window } = opts;
    window.webContents.on('before-input-event', (e, input) => this.switcher.onInput(e, input));
    window.on('blur', () => this.switcher.close());
    window.on('focus', () => {
      if ([...this.pageViews(), this.switcher.view].some(holdsStrayKeys)) this.focusOwner();
    });
    window.on('resize', () => this.layout('visible'));
    window.on('resized', () => this.layout());
    window.on('enter-full-screen', () => this.layout());
    window.on('leave-full-screen', () => this.layout());
  }

  get info(): { tabs: TabInfo[]; activeTabId: string } {
    return {
      tabs: this.tabs.map(({ view: _view, pendingPath: _pendingPath, ...info }) => info),
      activeTabId: this.activeId,
    };
  }

  get session(): DeckSession {
    return {
      decks: this.tabs.flatMap((t) =>
        t.kind === 'deck' && t.slideId ? [{ slideId: t.slideId, title: t.title }] : [],
      ),
      active: this.active()?.slideId ?? null,
    };
  }

  get switcherContents(): WebContents | null {
    return this.switcher.contents;
  }

  owns(contents: WebContents): boolean {
    return (
      this.spare?.webContents === contents ||
      this.tabs.some((t) => t.view?.webContents === contents)
    );
  }

  hosts(contents: WebContents): boolean {
    if (this.owns(contents)) return true;
    return [...this.popups].some((p) => !p.isDestroyed() && p.webContents === contents);
  }

  isServerUrl(url: string): boolean {
    return this.baseUrl !== null && originOf(url) === originOf(this.baseUrl);
  }

  adopted(contents: WebContents) {
    if (this.adopting.delete(contents)) this.layout();
  }

  unsavedReply(contents: WebContents, request: unknown, payload: unknown) {
    this.unsaved.answer(contents, request, payload);
  }

  confirmLeave(intent: LeaveIntent): Promise<boolean> {
    return this.confirm(this.tabs, intent);
  }

  setTranslucent(translucent: boolean) {
    for (const view of this.pageViews()) {
      if (view && !view.webContents.isDestroyed()) {
        view.webContents.send('host:translucent', translucent);
      }
    }
  }

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
        this.load(tab.view.webContents, pathOf(current));
      }
    }
    this.layout();
    this.scheduleWarm();
    this.covers.setBaseUrl(url);
  }

  setOverlay(open: boolean) {
    if (this.overlay === open) return;
    this.overlay = open;
    if (open) this.switcher.end(false);
    this.layout();
  }

  activate(id: string) {
    if (!this.find(id)) return;
    this.switcher.close();
    const previous = this.active();
    this.activeId = id;
    this.recent = [id, ...this.recent.filter((other) => other !== id)];
    if (previous && previous.id !== id) this.refreshCover(previous);
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
    const tab = this.find(id);
    if (!tab || tab.kind === 'home') return false;
    if (!(await this.confirm([tab], 'close'))) return false;
    this.remove([tab]);
    return true;
  }

  closeActive(): boolean {
    const tab = this.active();
    if (!tab || tab.kind === 'home') return false;
    void this.close(tab.id);
    return true;
  }

  async reload(id: string) {
    const tab = this.find(id);
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
    this.switcher.pick(id);
  }

  destroy() {
    this.switcher.destroy();
    for (const tab of this.tabs) this.destroyView(tab);
    this.destroySpare();
    this.cancelWarm();
    this.covers.clear();
    for (const popup of this.popups) {
      if (!popup.isDestroyed()) popup.close();
    }
    this.popups.clear();
  }

  private find(id: string): Tab | undefined {
    return this.tabs.find((t) => t.id === id);
  }

  private active(): Tab | undefined {
    return this.find(this.activeId);
  }

  private pageViews(): (WebContentsView | null)[] {
    return [...this.tabs.map((t) => t.view), this.spare];
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

  private changed() {
    this.syncCovers();
    this.opts.onChange();
  }

  private syncCovers() {
    this.covers.sync(this.tabs.flatMap((t) => (t.slideId ? [t.slideId] : [])));
  }

  private refreshCover(tab: Tab | undefined) {
    if (tab?.slideId) this.covers.refresh(tab.slideId);
  }

  private settled(): boolean {
    const contents = this.active()?.view?.webContents;
    return !!contents && this.loaded.has(contents) && !this.tabs.some((t) => t.loading);
  }

  private async closeAround(anchor: Tab, keep: (tab: Tab, index: number) => boolean) {
    const closing = this.tabs.filter((t, i) => t.kind !== 'home' && !keep(t, i));
    if (!closing.length || !(await this.confirm(closing, 'close'))) return;
    this.remove(closing, anchor);
  }

  private remove(closing: Tab[], anchor?: Tab) {
    const gone = closing.filter((t) => this.tabs.includes(t));
    if (!gone.length) return;
    const index = this.tabs.findIndex((t) => t.id === this.activeId);
    this.tabs = this.tabs.filter((t) => !gone.includes(t));
    this.recent = this.recent.filter((id) => this.find(id));
    for (const tab of gone) this.destroyView(tab);
    if (this.fullscreenTab && gone.includes(this.fullscreenTab)) this.leaveHtmlFullscreen();
    if (this.active()) {
      this.changed();
      return;
    }
    const next =
      anchor && this.tabs.includes(anchor)
        ? anchor
        : (this.tabs[Math.min(index, this.tabs.length - 1)] ?? this.tabs[0]);
    this.activate(next.id);
  }

  private confirm(tabs: Tab[], intent: LeaveIntent): Promise<boolean> {
    const pages: UnsavedPage[] = [];
    for (const tab of tabs) {
      const contents = tab.view?.webContents;
      if (!contents || !this.runsCore(contents)) continue;
      pages.push(this.unsaved.page(contents, tab.title, () => this.activate(tab.id)));
    }
    return this.guard.confirm(pages, intent);
  }

  private runsCore(contents: WebContents): boolean {
    return (
      !contents.isDestroyed() &&
      !contents.isCrashed() &&
      this.loaded.has(contents) &&
      this.isServerUrl(contents.getURL())
    );
  }

  private switchOrder(): { ids: string[]; startsAtActive: boolean } | null {
    if (!this.baseUrl || this.overlay || this.fullscreenTab) return null;
    const decks = this.tabs.filter((t) => t.kind === 'deck').map((t) => t.id);
    const startsAtActive = decks.includes(this.activeId);
    if (decks.length < (startsAtActive ? 2 : 1)) return null;
    return { ids: recencyOrder(decks, [this.activeId, ...this.recent]), startsAtActive };
  }

  private describe(id: string): SwitcherTab | null {
    const tab = this.find(id);
    if (!tab) return null;
    const cover = tab.slideId ? this.covers.get(tab.slideId) : null;
    return { id, kind: tab.kind, title: tab.title, cover };
  }

  private finishSwitch(pickedId: string | null) {
    if (pickedId && pickedId !== this.activeId && this.find(pickedId)) this.activate(pickedId);
    else this.focusOwner();
  }

  private focusOwner() {
    if (this.switcher.active) this.switcher.contents?.focus();
    else if (this.overlay) this.opts.window.webContents.focus();
    else (this.fullscreenTab ?? this.active())?.view?.webContents.focus();
  }

  // A view takes the keys the moment its first page starts loading, hidden or not.
  private keepKeys(view: WebContentsView) {
    view.webContents.on('focus', () => {
      if (!view.getVisible() && this.opts.window.isFocused()) this.focusOwner();
    });
  }

  private load(contents: WebContents, path: string) {
    // did-fail-load already reports a failure to the tab.
    contents.loadURL(`${this.baseUrl}${path}`).catch(() => {});
  }

  private pathFor(tab: Tab): string {
    if (tab.kind === 'deck' && tab.slideId) return deckPath(tab.slideId);
    const path = tab.pendingPath ?? '/';
    tab.pendingPath = null;
    return path;
  }

  private layout(scope: LayoutScope = 'all') {
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
      const shown = visible && this.loaded.has(contents) && !this.adopting.has(contents);
      if (shown || scope === 'all') {
        tab.view.setBounds(bounds(this.fullscreenTab === tab ? 0 : TAB_STRIP_HEIGHT));
      }
      tab.view.setVisible(shown);
      if (shown && !this.revealed.has(contents)) {
        this.revealed.add(contents);
        contents.setBackgroundThrottling(true);
        this.focusOwner();
      }
    }
    if (scope === 'all') this.spare?.setBounds(bounds(TAB_STRIP_HEIGHT));
    if (scope === 'all' || this.switcher.active) this.switcher.setBounds(bounds(0));
  }

  private createView(): WebContentsView {
    const view = new WebContentsView({
      webPreferences: {
        preload: this.opts.viewPreload,
        sandbox: true,
        contextIsolation: true,
        spellcheck: true,
        // Core's deck warm-up paces itself on animation frames, which a throttled hidden view never gets.
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
    contents.on('dom-ready', () => void contents.insertCSS(NATIVE_CONTROLS_CSS));
    contents.on('before-input-event', (e, input) => this.switcher.onInput(e, input));
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
    const dropSparePageFromHistory = () => contents.navigationHistory.clear();
    contents.once('did-navigate-in-page', dropSparePageFromHistory);
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
      this.warmNext();
    }, WARM_DELAY_MS);
  }

  private warmNext() {
    if (!this.baseUrl || this.opts.window.isDestroyed()) return;
    if (this.pageViews().some((v) => v && !this.loaded.has(v.webContents))) return;
    const cold = this.tabs.find((t) => !t.view);
    if (cold && this.tabs.filter((t) => t.view).length < MAX_WARM_TABS) {
      this.ensureView(cold);
      this.layout();
    } else if (!this.spare) {
      this.createSpare();
    } else if (this.tabs.length > 1) {
      this.switcher.warm();
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

  private keepOnServer(contents: WebContents) {
    const guard = (e: Electron.Event, url: string) => {
      if (this.isServerUrl(url)) return;
      e.preventDefault();
      openOutside(url);
    };
    contents.on('will-navigate', (e) => guard(e, e.url));
    contents.on('will-redirect', (e) => guard(e, e.url));
  }

  private trackPopup(popup: BrowserWindow) {
    this.popups.add(popup);
    popup.on('closed', () => this.popups.delete(popup));
    this.keepOnServer(popup.webContents);
    popup.webContents.setWindowOpenHandler(({ url }) => {
      if (!this.isServerUrl(url)) openOutside(url);
      return { action: 'deny' };
    });
  }

  private wire(tab: Tab, contents: WebContents) {
    this.trackPageState(tab, contents);
    this.routeNavigation(tab, contents);
    this.routeNewWindows(contents);
    this.followHtmlFullscreen(tab, contents);
    this.confirmUnrequestedUnloads(tab, contents);
    this.recoverFromCrashes(tab, contents);
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
  }

  private trackPageState(tab: Tab, contents: WebContents) {
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
  }

  private routeNavigation(tab: Tab, contents: WebContents) {
    this.keepOnServer(contents);
    contents.on('will-navigate', (e) => {
      if (!this.isServerUrl(e.url)) return;
      const url = new URL(e.url);
      const deck = deckIdFromPath(url.pathname);
      if (tab.kind === 'home' && deck) {
        e.preventDefault();
        this.openDeck(deck);
      } else if (tab.kind === 'deck' && isHomePath(url.pathname)) {
        e.preventDefault();
        this.openHome(pathOf(url));
      }
    });
    contents.on('did-navigate', (_e, url) => this.keepRole(tab, contents, url));
    contents.on('did-navigate-in-page', (_e, url, isMainFrame) => {
      if (isMainFrame) this.keepRole(tab, contents, url);
    });
  }

  private keepRole(tab: Tab, contents: WebContents, href: string) {
    const url = new URL(href);
    if (!this.isServerUrl(href) || url.pathname === SPARE_PATH) return;
    const deck = deckIdFromPath(url.pathname);
    if (tab.kind === 'deck') {
      if (deck && deck !== tab.slideId) {
        tab.slideId = deck;
        this.changed();
      } else if (isHomePath(url.pathname)) {
        this.goBackOr(contents, deckPath(tab.slideId ?? ''));
        this.openHome(pathOf(url));
      }
    } else if (deck) {
      this.goBackOr(contents, '/');
      this.openDeck(deck);
    }
  }

  private goBackOr(contents: WebContents, path: string) {
    if (contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
    else this.load(contents, path);
  }

  private routeNewWindows(contents: WebContents) {
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
      else if (isHomePath(url.pathname)) this.openHome(pathOf(url));
      return { action: 'deny' };
    });
    contents.on('did-create-window', (popup) => this.trackPopup(popup));
  }

  private followHtmlFullscreen(tab: Tab, contents: WebContents) {
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

  private confirmUnrequestedUnloads(tab: Tab, contents: WebContents) {
    contents.on('will-prevent-unload', (event) => {
      if (this.allowedUnloads.delete(contents)) event.preventDefault();
      else void this.reload(tab.id);
    });
    contents.on('did-finish-load', () => this.allowedUnloads.delete(contents));
    contents.on('did-fail-load', () => this.allowedUnloads.delete(contents));
  }

  private recoverFromCrashes(tab: Tab, contents: WebContents) {
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
      if (tab.id === this.activeId) void this.offerReload(tab, contents);
      else this.destroyView(tab);
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
}
