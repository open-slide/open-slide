import { randomUUID } from 'node:crypto';
import {
  app,
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
  shell,
  type WebContents,
  WebContentsView,
} from 'electron';
import { TAB_STRIP_HEIGHT, type TabInfo } from '../shared/types';
import type { DeckSession } from './settings';

type Tab = {
  id: string;
  kind: 'home' | 'deck';
  slideId: string | null;
  title: string;
  loading: boolean;
  view: WebContentsView | null;
  // Where a not-yet-loaded home tab should land once it gets a view.
  pendingPath: string | null;
};

type TabManagerOptions = {
  window: BrowserWindow;
  viewPreload: string;
  onChange: () => void;
};

const DECK_ROOT_RE = /^\/s\/([^/]+)\/?$/;
const PRESENTER_RE = /^\/s\/[^/]+\/presenter\/?$/;
const DEFAULT_TITLE = 'open-slide';

function deckIdFromPath(pathname: string): string | null {
  const m = DECK_ROOT_RE.exec(pathname);
  return m ? decodeURIComponent(m[1]) : null;
}

function isHomePath(pathname: string): boolean {
  return !pathname.startsWith('/s/');
}

export class TabManager {
  private tabs: Tab[];
  private activeId: string;
  private baseUrl: string | null = null;
  private overlay = true;
  private fullscreenTab: Tab | null = null;
  private ownsFullscreen = false;

  constructor(private readonly opts: TabManagerOptions) {
    const home = this.makeTab('home', null);
    this.tabs = [home];
    this.activeId = home.id;
    const relayout = () => this.layout();
    opts.window.on('resize', relayout);
    opts.window.on('enter-full-screen', relayout);
    opts.window.on('leave-full-screen', relayout);
  }

  get info(): { tabs: TabInfo[]; activeTabId: string } {
    return {
      tabs: this.tabs.map(({ id, kind, slideId, title, loading }) => ({
        id,
        kind,
        slideId,
        title,
        loading,
      })),
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
    return this.tabs.some((t) => t.view?.webContents === contents);
  }

  isHtmlFullscreen(): boolean {
    return this.fullscreenTab !== null;
  }

  reset(session: DeckSession) {
    for (const tab of this.tabs) this.destroyView(tab);
    const home = this.makeTab('home', null);
    const decks = session.decks.map((d) => ({
      ...this.makeTab('deck', d.slideId),
      title: d.title,
    }));
    this.tabs = [home, ...decks];
    this.activeId = decks.find((t) => t.slideId === session.active)?.id ?? home.id;
    this.baseUrl = null;
    this.fullscreenTab = null;
    this.changed();
  }

  setBaseUrl(url: string | null) {
    if (url === this.baseUrl) return;
    const previous = this.baseUrl;
    this.baseUrl = url;
    if (url && previous) {
      for (const tab of this.tabs) {
        if (!tab.view) continue;
        const current = new URL(tab.view.webContents.getURL() || previous);
        void tab.view.webContents.loadURL(`${url}${current.pathname}${current.search}`);
      }
    }
    this.layout();
  }

  setOverlay(open: boolean) {
    if (this.overlay === open) return;
    this.overlay = open;
    this.layout();
  }

  activate(id: string) {
    if (!this.tabs.some((t) => t.id === id)) return;
    this.activeId = id;
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

  openDeck(slideId: string) {
    const existing = this.tabs.find((t) => t.kind === 'deck' && t.slideId === slideId);
    if (existing) {
      this.activate(existing.id);
      return;
    }
    const tab = this.makeTab('deck', slideId);
    this.tabs.push(tab);
    this.activate(tab.id);
  }

  openHome(path?: string) {
    const home = this.tabs[0];
    if (path) {
      if (home.view) home.view.webContents.send('host:navigate', path);
      else home.pendingPath = path;
    }
    this.activate(home.id);
  }

  close(id: string) {
    const index = this.tabs.findIndex((t) => t.id === id);
    const tab = this.tabs[index];
    if (!tab || tab.kind === 'home') return;
    this.destroyView(tab);
    this.tabs.splice(index, 1);
    if (this.fullscreenTab === tab) this.leaveHtmlFullscreen();
    if (this.activeId === id) {
      this.activate((this.tabs[index] ?? this.tabs[index - 1] ?? this.tabs[0]).id);
    } else {
      this.changed();
    }
  }

  closeActive(): boolean {
    const tab = this.active();
    if (!tab || tab.kind === 'home') return false;
    this.close(tab.id);
    return true;
  }

  move(id: string, toIndex: number) {
    const from = this.tabs.findIndex((t) => t.id === id);
    if (from < 1) return;
    const [tab] = this.tabs.splice(from, 1);
    this.tabs.splice(Math.max(1, Math.min(toIndex, this.tabs.length)), 0, tab);
    this.changed();
  }

  reloadAll() {
    for (const tab of this.tabs) tab.view?.webContents.reload();
  }

  activeContents(): WebContents | null {
    return this.active()?.view?.webContents ?? null;
  }

  destroy() {
    for (const tab of this.tabs) this.destroyView(tab);
  }

  private active(): Tab | undefined {
    return this.tabs.find((t) => t.id === this.activeId);
  }

  private changed() {
    this.opts.onChange();
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

  private urlFor(tab: Tab): string {
    if (tab.kind === 'deck' && tab.slideId) {
      return `${this.baseUrl}/s/${encodeURIComponent(tab.slideId)}`;
    }
    const path = tab.pendingPath ?? '/';
    tab.pendingPath = null;
    return `${this.baseUrl}${path}`;
  }

  layout() {
    const win = this.opts.window;
    if (win.isDestroyed()) return;
    const { width, height } = win.getContentBounds();
    for (const tab of this.tabs) {
      const visible =
        this.baseUrl !== null &&
        !this.overlay &&
        (this.fullscreenTab ? tab === this.fullscreenTab : tab.id === this.activeId);
      if (visible) this.ensureView(tab);
      if (!tab.view) continue;
      tab.view.setVisible(visible);
      if (!visible) continue;
      const top = this.fullscreenTab === tab ? 0 : TAB_STRIP_HEIGHT;
      tab.view.setBounds({ x: 0, y: top, width, height: Math.max(0, height - top) });
    }
  }

  private ensureView(tab: Tab) {
    if (tab.view || !this.baseUrl) return;
    const view = new WebContentsView({
      webPreferences: {
        preload: this.opts.viewPreload,
        sandbox: true,
        contextIsolation: true,
        spellcheck: true,
      },
    });
    view.setBackgroundColor('#00000000');
    tab.view = view;
    this.wire(tab, view.webContents);
    this.opts.window.contentView.addChildView(view);
    void view.webContents.loadURL(this.urlFor(tab));
  }

  private destroyView(tab: Tab) {
    const view = tab.view;
    if (!view) return;
    tab.view = null;
    const win = this.opts.window;
    if (!win.isDestroyed()) win.contentView.removeChildView(view);
    if (!view.webContents.isDestroyed()) view.webContents.close();
  }

  private sameOrigin(url: URL): boolean {
    return this.baseUrl !== null && url.origin === new URL(this.baseUrl).origin;
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
      if (isMainFrame) this.followNavigation(tab, contents, new URL(url));
    });
    contents.on('did-navigate', (_e, url) => this.followNavigation(tab, contents, new URL(url)));

    contents.on('will-navigate', (e) => {
      const url = new URL(e.url);
      if (!this.sameOrigin(url)) {
        e.preventDefault();
        if (url.protocol === 'http:' || url.protocol === 'https:') void shell.openExternal(e.url);
        return;
      }
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
      const url = new URL(raw);
      if (!this.sameOrigin(url)) {
        if (url.protocol === 'http:' || url.protocol === 'https:') void shell.openExternal(raw);
        return { action: 'deny' };
      }
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
      const items: MenuItemConstructorOptions[] = [];
      if (params.isEditable) {
        items.push({ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' });
      } else if (params.selectionText) {
        items.push({ role: 'copy' });
      }
      if (params.linkURL && !this.sameOrigin(new URL(params.linkURL))) {
        items.push({
          label: 'Open Link in Browser',
          click: () => shell.openExternal(params.linkURL),
        });
      }
      if (!app.isPackaged) {
        if (items.length) items.push({ type: 'separator' });
        items.push({
          label: 'Inspect Element',
          click: () => contents.inspectElement(params.x, params.y),
        });
      }
      if (items.length) Menu.buildFromTemplate(items).popup({ window: this.opts.window });
    });

    contents.on('render-process-gone', (_e, details) => {
      if (details.reason !== 'clean-exit') contents.reload();
    });
  }

  private leaveHtmlFullscreen() {
    this.fullscreenTab = null;
    if (this.ownsFullscreen) {
      this.ownsFullscreen = false;
      const win = this.opts.window;
      if (!win.isDestroyed()) win.setFullScreen(false);
    }
    this.layout();
    this.changed();
  }

  // Core asks the host before moving between home and a deck; this catches
  // any navigation that still slips through so a tab keeps its role.
  private followNavigation(tab: Tab, contents: WebContents, url: URL) {
    if (!this.sameOrigin(url)) return;
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
    else void contents.loadURL(`${this.baseUrl}${path}`);
  }
}
