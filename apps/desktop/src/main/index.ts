import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import {
  app,
  BrowserWindow,
  dialog,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions,
  nativeTheme,
  screen,
  shell,
  systemPreferences,
  type WebContents,
} from 'electron';
import {
  type AgentId,
  type AppState,
  type CreateWorkspaceRequest,
  type DesktopSettings,
  type IntroTarget,
  type LogTask,
  PACKAGE_MANAGERS,
  type PackageManager,
  type ShellCommand,
  TAB_STRIP_HEIGHT,
  type TaskResult,
  type WorkspaceInfo,
} from '../shared/types';
import { cancelAllLogins, cancelLogin, listAgents, login, logout, sendLoginInput } from './agents';
import { performHaptic } from './haptics';
import { installMenu, type MenuActions } from './menu';
import { DevServer } from './server';
import { settings } from './settings';
import { shellEnv } from './shell-env';
import { TabManager } from './tabs';
import {
  availablePackageManagers,
  bundledCore,
  createWorkspace,
  detectPackageManager,
  inspectWorkspace,
  installDependencies,
  modulesDir,
  syncSkills,
} from './workspace';

const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const SHELL_PRELOAD = path.join(import.meta.dirname, '../preload/shell.cjs');
const VIEW_PRELOAD = path.join(import.meta.dirname, '../preload/view.cjs');
const THEMES = new Set(['light', 'dark', 'system']);
const SETTINGS_WIDTH = 640;
// Matches the corner the system draws on the main window, so the intro lands on it.
const WINDOW_RADIUS = isMac ? 12 : isWindows ? 8 : 0;
// The intro runs about nine seconds; past this it has stalled.
const INTRO_TIMEOUT = 20_000;

let window: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let introWindow: BrowserWindow | null = null;
let introCovering = false;
let tabs: TabManager | null = null;
let workspace: WorkspaceInfo | null = null;

async function childEnv(): Promise<NodeJS.ProcessEnv> {
  return { ...(await shellEnv()), OPEN_SLIDE_AGENT_MODULES: modulesDir() };
}

function fallbackPackageManager(): PackageManager {
  return settings.packageManager() ?? 'npm';
}

function cacheDirFor(root: string): string {
  const key = createHash('sha256').update(root).digest('hex').slice(0, 16);
  return path.join(app.getPath('userData'), 'vite-cache', key);
}

const server = new DevServer(
  childEnv,
  (root) => detectPackageManager(root, fallbackPackageManager()),
  { get: (root) => settings.port(root), set: (root, port) => settings.setPort(root, port) },
  cacheDirFor,
);

function translucencySupported(): boolean {
  return isMac || isWindows;
}

function translucent(): boolean {
  return translucencySupported() && settings.get().translucent;
}

function accent(): string | null {
  if (!translucencySupported()) return null;
  const hex = systemPreferences.getAccentColor();
  return hex ? `#${hex}` : null;
}

function state(): AppState {
  const info = tabs?.info ?? { tabs: [], activeTabId: null };
  return {
    platform: process.platform,
    translucent: translucent(),
    accent: accent(),
    fullscreen: window?.isFullScreen() ?? false,
    onboarding: !settings.onboarded(),
    intro: introCovering,
    workspace,
    recent: settings.recent(),
    server: server.status,
    tabs: info.tabs,
    activeTabId: info.activeTabId,
  };
}

function shellWindows(): BrowserWindow[] {
  return [window, settingsWindow, introWindow].filter(
    (w): w is BrowserWindow => !!w && !w.isDestroyed(),
  );
}

function sendAll(channel: string, payload: unknown) {
  for (const win of shellWindows()) win.webContents.send(channel, payload);
}

let menuRecent = '';

function refreshMenu() {
  const recent = settings.recent();
  const key = recent.join('\n');
  if (key === menuRecent) return;
  menuRecent = key;
  installMenu(menuActions, recent);
}

function broadcast() {
  sendAll('state', state());
  refreshMenu();
}

function sendLog(task: LogTask, chunk: string) {
  sendAll('log', { task, chunk });
}

function sendCommand(command: ShellCommand) {
  if (window) {
    window.show();
    window.focus();
    window.webContents.send('command', command);
    return;
  }
  const created = createWindow();
  created.webContents.once('did-finish-load', () => created.webContents.send('command', command));
}

function persistSession() {
  if (workspace && tabs) settings.setSession(workspace.root, tabs.session);
}

server.on('status', (status) => {
  if (status.state === 'ready') tabs?.setBaseUrl(status.url);
  broadcast();
});
server.on('log', (chunk) => sendLog('server', chunk));

// Skills describe the core that runs the workspace, so they follow the bundled
// core: synced once per app update, like an in-app core update used to.
async function syncSkillsOnce(root: string) {
  const { version } = bundledCore();
  if (settings.skillsVersion(root) === version) return;
  const result = await syncSkills(root, await childEnv(), (chunk) => sendLog('server', chunk));
  if (result.ok) settings.setSkillsVersion(root, version);
}

async function openWorkspace(root: string): Promise<TaskResult> {
  const inspection = inspectWorkspace(root);
  if (inspection.kind !== 'project') {
    return { ok: false, error: `${inspection.path} is not an open-slide workspace.` };
  }
  persistSession();
  workspace = { root: inspection.path, name: inspection.name };
  settings.setWorkspace(inspection.path);
  settings.setOnboarded(true);
  tabs?.reset(settings.session(inspection.path));
  broadcast();
  await Promise.all([syncSkillsOnce(inspection.path), server.start(inspection.path)]);
  return { ok: true };
}

async function installWorkspace(): Promise<TaskResult> {
  if (!workspace) return { ok: false, error: 'No workspace is open.' };
  const root = workspace.root;
  const pm = detectPackageManager(root, fallbackPackageManager());
  server.markInstalling();
  const result = await installDependencies(root, pm, await childEnv(), (chunk) =>
    sendLog('install', chunk),
  );
  if (workspace?.root === root) await server.start(root);
  return result;
}

function windowBackground(): string {
  if (translucent()) return '#00000000';
  return nativeTheme.shouldUseDarkColors ? '#030303' : '#f7f7f7';
}

function applyMaterial(win: BrowserWindow) {
  if (isMac) win.setVibrancy(translucent() ? 'sidebar' : null);
  if (isWindows) win.setBackgroundMaterial(translucent() ? 'mica' : 'none');
  win.setBackgroundColor(windowBackground());
}

function loadShell(win: BrowserWindow, hash?: string) {
  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(`${process.env.ELECTRON_RENDERER_URL}${hash ? `#${hash}` : ''}`);
  } else {
    void win.loadFile(path.join(import.meta.dirname, '../renderer/index.html'), { hash });
  }
}

function editMenu(params: Electron.ContextMenuParams): MenuItemConstructorOptions[] {
  if (params.isEditable) {
    return [
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { role: 'selectAll' },
    ];
  }
  return params.selectionText ? [{ role: 'copy' }] : [];
}

// Shared by every window that runs the shell renderer.
function wireShell(win: BrowserWindow) {
  const contents = win.webContents;
  const sendFocus = (focused: boolean) => {
    if (!contents.isDestroyed()) contents.send('window:focus', focused);
  };
  win.on('focus', () => sendFocus(true));
  win.on('blur', () => sendFocus(false));
  contents.on('will-navigate', (e) => e.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('context-menu', (_e, params) => {
    const items = editMenu(params);
    if (!app.isPackaged) {
      if (items.length) items.push({ type: 'separator' });
      items.push({
        label: 'Inspect Element',
        click: () => contents.inspectElement(params.x, params.y),
      });
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }
  const win = new BrowserWindow({
    width: SETTINGS_WIDTH,
    height: 520,
    show: false,
    title: 'Settings',
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: windowBackground(),
    ...(isMac
      ? {
          titleBarStyle: 'hidden' as const,
          trafficLightPosition: { x: 14, y: 10 },
          vibrancy: translucent() ? ('sidebar' as const) : undefined,
          visualEffectState: 'followWindow' as const,
        }
      : {
          autoHideMenuBar: true,
          ...(isWindows && translucent() ? { backgroundMaterial: 'mica' as const } : {}),
        }),
    webPreferences: {
      preload: SHELL_PRELOAD,
      sandbox: true,
      contextIsolation: true,
    },
  });
  settingsWindow = win;
  wireShell(win);
  // The first fit-content shows the window at its final height; this only
  // covers a renderer that never reports one.
  win.once('ready-to-show', () => {
    setTimeout(() => {
      if (!win.isDestroyed() && !win.isVisible()) win.show();
    }, 400);
  });
  win.on('closed', () => {
    if (settingsWindow === win) settingsWindow = null;
  });
  loadShell(win, 'settings');
}

function fitSettingsWindow(win: BrowserWindow, height: number) {
  const { workAreaSize } = screen.getDisplayMatching(win.getBounds());
  const max = Math.min(760, workAreaSize.height - 80);
  const next = Math.round(Math.max(240, Math.min(max, height)));
  const [width, current] = win.getContentSize();
  if (!win.isVisible()) {
    win.setContentSize(width, next);
    win.center();
    win.show();
  } else if (next !== current) {
    win.setContentSize(width, next, true);
  }
}

function createWindow(): BrowserWindow {
  const bounds = settings.bounds();
  const win = new BrowserWindow({
    width: bounds?.width ?? 1440,
    height: bounds?.height ?? 900,
    ...(bounds ? { x: bounds.x, y: bounds.y } : {}),
    minWidth: 820,
    minHeight: 540,
    show: false,
    title: 'open-slide',
    backgroundColor: windowBackground(),
    ...(isMac
      ? {
          titleBarStyle: 'hiddenInset' as const,
          trafficLightPosition: { x: 14, y: 14 },
          vibrancy: translucent() ? ('sidebar' as const) : undefined,
          visualEffectState: 'followWindow' as const,
        }
      : {
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: { height: TAB_STRIP_HEIGHT, color: '#00000000' },
          ...(isWindows && translucent() ? { backgroundMaterial: 'mica' as const } : {}),
        }),
    webPreferences: {
      preload: SHELL_PRELOAD,
      sandbox: true,
      contextIsolation: true,
    },
  });
  window = win;
  tabs = new TabManager({
    window: win,
    viewPreload: VIEW_PRELOAD,
    onChange: () => {
      persistSession();
      broadcast();
    },
  });
  if (workspace) {
    tabs.reset(settings.session(workspace.root));
    if (server.status.state === 'ready') tabs.setBaseUrl(server.status.url);
  }

  win.on('enter-full-screen', broadcast);
  win.on('leave-full-screen', broadcast);
  // While the intro plays it reveals this window itself, right where it lands.
  win.once('ready-to-show', () => {
    if (!introWindow) win.show();
  });
  win.on('close', () => {
    persistSession();
    if (!win.isFullScreen()) settings.setBounds(win.getNormalBounds());
  });
  win.on('closed', () => {
    tabs?.destroy();
    tabs = null;
    window = null;
  });
  wireShell(win);
  loadShell(win);
  return win;
}

function revealMain() {
  if (introCovering) {
    introCovering = false;
    broadcast();
  }
  if (window && !window.isVisible()) window.showInactive();
}

function introTarget(): IntroTarget | null {
  if (!window || !introWindow) return null;
  const frame = window.getBounds();
  const origin = introWindow.getBounds();
  return {
    x: frame.x - origin.x,
    y: frame.y - origin.y,
    width: frame.width,
    height: frame.height,
    radius: window.isFullScreen() || window.isMaximized() ? 0 : WINDOW_RADIUS,
    dark: nativeTheme.shouldUseDarkColors,
  };
}

// A borderless, clear window over the whole display the main window sits on:
// the intro plays over the desktop, then folds down into the main window.
function playIntro() {
  if (introWindow) return;
  const main = window ?? createWindow();
  if (main.isMinimized()) main.restore();
  const { bounds } = screen.getDisplayMatching(main.getBounds());
  const win = new BrowserWindow({
    ...bounds,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    enableLargerThanScreen: true,
    roundedCorners: false,
    title: 'Welcome to open-slide',
    webPreferences: {
      preload: SHELL_PRELOAD,
      sandbox: true,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });
  introWindow = win;
  introCovering = true;
  win.setAlwaysOnTop(true, 'screen-saver');
  wireShell(win);
  const stalled = setTimeout(() => {
    if (!win.isDestroyed()) win.close();
  }, INTRO_TIMEOUT);
  win.once('ready-to-show', () => {
    win.setBounds(bounds);
    win.show();
    win.focus();
  });
  win.on('closed', () => {
    clearTimeout(stalled);
    if (introWindow === win) introWindow = null;
    settings.setIntroSeen();
    revealMain();
    window?.focus();
  });
  broadcast();
  loadShell(win, 'intro');
}

function replayIntro() {
  settings.setOnboarded(false);
  broadcast();
  if (reducedMotion()) {
    const main = window ?? createWindow();
    main.show();
    main.focus();
  } else {
    playIntro();
  }
}

function reducedMotion(): boolean {
  return systemPreferences.getAnimationSettings().prefersReducedMotion;
}

function fromShell(e: IpcMainEvent | IpcMainInvokeEvent): boolean {
  return shellWindows().some((w) => w.webContents === e.sender);
}

function senderWindow(sender: WebContents): BrowserWindow | null {
  return shellWindows().find((w) => w.webContents === sender) ?? null;
}

function handle<A extends unknown[], R>(channel: string, fn: (...args: A) => R | Promise<R>) {
  ipcMain.handle(channel, (e, ...args) => {
    if (!fromShell(e)) throw new Error(`Rejected ${channel} from an unknown sender`);
    return fn(...(args as A));
  });
}

function listen<A extends unknown[]>(channel: string, fn: (...args: A) => void) {
  ipcMain.on(channel, (e, ...args) => {
    if (fromShell(e)) fn(...(args as A));
  });
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function registerIpc() {
  handle('state:get', () => state());
  listen('overlay:set', (open: boolean) => tabs?.setOverlay(Boolean(open)));
  listen('external:open', (url: unknown) => {
    if (isHttpUrl(url)) void shell.openExternal(url);
  });
  listen('shell:command', (command: unknown) => {
    if (command === 'open-workspace' || command === 'new-workspace') sendCommand(command);
  });
  listen('settings:open-window', () => openSettingsWindow());
  ipcMain.handle('window:is-focused', (e) => senderWindow(e.sender)?.isFocused() ?? false);
  ipcMain.on('window:fit-content', (e, height: unknown) => {
    const win = senderWindow(e.sender);
    if (win && win === settingsWindow && typeof height === 'number' && Number.isFinite(height)) {
      fitSettingsWindow(win, height);
    }
  });

  handle('intro:target', () => introTarget());
  listen('intro:reveal', () => revealMain());
  listen('intro:done', () => {
    if (introWindow && !introWindow.isDestroyed()) introWindow.close();
  });
  listen('onboarding:finish', () => {
    settings.setOnboarded(true);
    broadcast();
  });

  handle('settings:get', () => settings.get());
  handle('settings:update', (patch: Partial<DesktopSettings>) => {
    const next: Partial<DesktopSettings> = {};
    if (typeof patch.translucent === 'boolean') next.translucent = patch.translucent;
    if (patch.packageManager === null || PACKAGE_MANAGERS.includes(patch.packageManager as never)) {
      next.packageManager = patch.packageManager;
    }
    const before = translucent();
    const result = settings.update(next);
    if (translucent() !== before) {
      for (const win of shellWindows()) applyMaterial(win);
      tabs?.reloadAll();
    }
    broadcast();
    return result;
  });

  listen('tabs:activate', (id: string) => tabs?.activate(id));
  listen('tabs:close', (id: string) => tabs?.close(id));
  listen('tabs:move', (id: string, index: number) => tabs?.move(id, index));
  listen('tabs:menu', (id: string) => tabs?.showMenu(String(id)));

  handle('workspace:choose', async () => {
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      title: 'Open Workspace',
      buttonLabel: 'Open',
      properties: ['openDirectory', 'createDirectory'],
    });
    const [dir] = result.filePaths;
    return result.canceled || !dir ? null : inspectWorkspace(dir);
  });
  handle('workspace:choose-parent', async () => {
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      title: 'Choose Location',
      buttonLabel: 'Choose',
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  handle('workspace:default-parent', () => app.getPath('documents'));
  handle('workspace:package-managers', async () => availablePackageManagers(await childEnv()));
  handle('workspace:open', (root: string) => openWorkspace(String(root)));
  handle('workspace:create', async (request: CreateWorkspaceRequest) => {
    const result = await createWorkspace(request, await childEnv(), (chunk) =>
      sendLog('create', chunk),
    );
    if (!result.ok || !result.root) return result;
    settings.update({ packageManager: request.packageManager });
    return openWorkspace(result.root);
  });
  handle('workspace:install', () => installWorkspace());
  listen('workspace:reveal', (target?: string) => {
    const dir = typeof target === 'string' ? target : workspace?.root;
    if (dir) void shell.openPath(dir);
  });
  listen('workspace:forget', (root: string) => {
    settings.forget(String(root));
    void rm(cacheDirFor(String(root)), { recursive: true, force: true });
    broadcast();
  });

  listen('server:restart', () => void server.restart());
  handle('server:log', () => server.log);

  handle('agents:list', async () => listAgents(await childEnv()));
  handle('agents:login', async (id: AgentId) =>
    login(
      id,
      await childEnv(),
      (event) => sendAll('agents:login-event', event),
      (url) => void shell.openExternal(url),
    ),
  );
  handle('agents:logout', async (id: AgentId) => logout(id, await childEnv()));
  listen('agents:login-input', (id: AgentId, text: string) => sendLoginInput(id, String(text)));
  listen('agents:login-cancel', (id: AgentId) => cancelLogin(id));

  // Presenter popups get the bridge too, but no window material behind them.
  ipcMain.on('host:config', (e) => {
    e.returnValue = { translucent: translucent() && (tabs?.owns(e.sender) ?? false) };
  });
  ipcMain.on('host:adopted', (e) => tabs?.adopted(e.sender));
  ipcMain.on('host:open-deck', (_e, slideId: unknown) => {
    if (typeof slideId === 'string' && slideId) tabs?.openDeck(slideId);
    window?.focus();
  });
  ipcMain.on('host:open-home', (_e, path: unknown) => {
    tabs?.openHome(typeof path === 'string' && path.startsWith('/') ? path : undefined);
    window?.focus();
  });
  ipcMain.on('host:haptic', (_e, pattern: unknown) => performHaptic(pattern));
  ipcMain.on('host:set-theme', (_e, theme: unknown) => {
    if (typeof theme !== 'string' || !THEMES.has(theme)) return;
    nativeTheme.themeSource = theme as 'light' | 'dark' | 'system';
  });
}

nativeTheme.on('updated', () => {
  for (const win of shellWindows()) win.setBackgroundColor(windowBackground());
});

const menuActions: MenuActions = {
  openSettings: () => openSettingsWindow(),
  openWorkspace: () => sendCommand('open-workspace'),
  newWorkspace: () => sendCommand('new-workspace'),
  revealWorkspace: () => workspace && void shell.openPath(workspace.root),
  closeTab: () => {
    // Settings and presenter windows have no tabs, so ⌘W closes them outright.
    const focused = BrowserWindow.getFocusedWindow();
    if (focused && focused !== window) {
      focused.close();
      return;
    }
    if (!tabs?.closeActive() && !isMac) window?.close();
  },
  goHome: () => tabs?.openHome(),
  selectTab: (index) => tabs?.activateIndex(index),
  cycleTab: (delta) => tabs?.cycle(delta),
  reloadTab: () => tabs?.activeContents()?.reload(),
  toggleTabDevTools: () => tabs?.activeContents()?.toggleDevTools(),
  openRecent: (root) => {
    window?.focus();
    void openWorkspace(root);
  },
  replayIntro: () => replayIntro(),
  clearRecent: () => {
    for (const root of settings.recent()) {
      if (root !== workspace?.root) settings.forget(root);
    }
    broadcast();
  },
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!window) createWindow();
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });

  app.whenReady().then(() => {
    registerIpc();
    refreshMenu();
    app.setAboutPanelOptions({
      applicationName: 'open-slide',
      applicationVersion: bundledCore().version,
      version: '',
      credits: 'Slides as React code, edited alongside your agent.',
      website: 'https://open-slide.dev',
    });
    if (isMac) {
      systemPreferences.subscribeNotification('AppleColorPreferencesChangedNotification', () =>
        broadcast(),
      );
    } else {
      systemPreferences.on('accent-color-changed', () => broadcast());
    }
    void shellEnv();
    createWindow();
    if (!settings.introSeen()) {
      if (reducedMotion()) settings.setIntroSeen();
      else playIntro();
    }
    const saved = settings.workspace();
    if (saved) void openWorkspace(saved);

    app.on('activate', () => {
      if (!window) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });

  let quitting = false;
  app.on('before-quit', (e) => {
    if (quitting) return;
    e.preventDefault();
    quitting = true;
    persistSession();
    settings.flush();
    cancelAllLogins();
    void server.stop().finally(() => app.quit());
  });
}
