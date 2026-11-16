import { createHash } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  dialog,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  ipcMain,
  nativeTheme,
  screen,
  session,
  shell,
  systemPreferences,
  type WebContents,
} from 'electron';
import {
  AGENT_IDS,
  type AgentId,
  type AgentInfo,
  type AppState,
  type CreateWorkspaceRequest,
  type DesktopSettings,
  type IntroTarget,
  type LogTask,
  PACKAGE_MANAGERS,
  type PackageManager,
  type ShellCommand,
  TAB_STRIP_HEIGHT,
} from '../shared/types';
import { cancelAllInstalls, managedCliDirs, syncManagedClis } from './agent-cli';
import { AgentLogins } from './agent-logins';
import { listAgents, logout, startLogin } from './agents';
import { performHaptic } from './haptics';
import { installMenu, type MenuActions, showContextMenu } from './menu';
import { terminateRunning } from './process';
import { QuitGate } from './quit';
import { DevServer } from './server';
import { settings } from './settings';
import { loginEnv, shellEnv } from './shell-env';
import { TabManager } from './tabs';
import {
  bucket,
  captureError,
  initTelemetry,
  reportRendererError,
  setTelemetryEnabled,
  shutdownTelemetry,
  startCrashReporter,
  track,
} from './telemetry';
import { isHttpUrl } from './url';
import {
  availablePackageManagers,
  bundledCore,
  detectPackageManager,
  modulesDir,
  syncSkills,
} from './workspace';
import { WorkspaceController } from './workspace-controller';

const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const supportsMaterial = isMac || isWindows;
const SHELL_PRELOAD = path.join(import.meta.dirname, '../preload/shell.cjs');
const VIEW_PRELOAD = path.join(import.meta.dirname, '../preload/view.cjs');
const THEMES = new Set(['light', 'dark', 'system']);
const WORKSPACE_NAME_RE = /^[\p{L}\p{N}._-]+$/u;
const AGENTS_TTL_MS = 5000;
const TAB_PERMISSIONS = new Set(['fullscreen', 'clipboard-sanitized-write']);
const SHELL_PERMISSIONS = new Set(['clipboard-sanitized-write']);
const SETTINGS_WIDTH = 640;
// The corner the system draws on the main window, for the intro to land on.
const WINDOW_RADIUS = isMac ? 12 : isWindows ? 8 : 0;
// The intro runs about fifteen seconds; past this it has stalled.
const INTRO_TIMEOUT = 20_000;
// Long enough for the score's tail to ring out once the intro is released.
const INTRO_TAIL_TIMEOUT = 14_000;
const WINDOW_SHOW_TIMEOUT_MS = 2000;

let window: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let introWindow: BrowserWindow | null = null;
let introCovering = false;
let releaseIntro: (() => void) | null = null;
let tabs: TabManager | null = null;

async function childEnv(read = shellEnv): Promise<NodeJS.ProcessEnv> {
  const env = await read();
  const PATH = [env.PATH ?? '', ...managedCliDirs()].filter(Boolean).join(path.delimiter);
  return { ...env, PATH, OPEN_SLIDE_AGENT_MODULES: modulesDir() };
}

function cacheDirFor(root: string): string {
  const key = createHash('sha256').update(root).digest('hex').slice(0, 16);
  return path.join(app.getPath('userData'), 'vite-cache', key);
}

const server = new DevServer(
  () => childEnv(loginEnv),
  (root) => detectPackageManager(root, settings.packageManager() ?? 'npm'),
  { get: (root) => settings.port(root), set: (root, port) => settings.setPort(root, port) },
  cacheDirFor,
);

function translucent(): boolean {
  return supportsMaterial && settings.get().translucent;
}

function accent(): string | null {
  if (!supportsMaterial) return null;
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
    workspace: workspaces.current,
    workspaceError: workspaces.error,
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

function shellWindowOf(contents: WebContents | null): BrowserWindow | null {
  return shellWindows().find((w) => w.webContents === contents) ?? null;
}

function sendAll(channel: string, payload: unknown) {
  for (const win of shellWindows()) win.webContents.send(channel, payload);
}

let menuRecent: string | null = null;

function refreshMenu() {
  const recent = settings.recent();
  const key = recent.join('\n');
  if (key === menuRecent) return;
  menuRecent = key;
  installMenu(menuActions, recent);
}

let broadcastQueued = false;

// A tab load fires several changes in a row, so they share one state message.
function broadcast() {
  if (broadcastQueued) return;
  broadcastQueued = true;
  setImmediate(() => {
    broadcastQueued = false;
    sendAll('state', state());
    refreshMenu();
  });
}

function sendLog(task: LogTask, chunk: string) {
  sendAll('log', { task, chunk });
}

// On macOS the app outlives its last window, so this may have to create one.
async function ensureMainWindow(): Promise<BrowserWindow> {
  if (window) {
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
    return window;
  }
  const created = createWindow();
  // A dialog attached before the window shows would hang off an invisible one.
  if (!created.isVisible()) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, WINDOW_SHOW_TIMEOUT_MS);
      created.once('show', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
  return created;
}

function sendCommand(command: ShellCommand) {
  void ensureMainWindow().then((win) => {
    const contents = win.webContents;
    if (contents.isLoading())
      contents.once('did-finish-load', () => contents.send('command', command));
    else contents.send('command', command);
  });
}

let serverStartedAt = 0;

server.on('status', (status) => {
  if (status.state === 'starting') serverStartedAt = Date.now();
  if (status.state === 'ready') {
    tabs?.setBaseUrl(status.url);
    track('server_ready', { duration_ms: Date.now() - serverStartedAt });
  }
  broadcast();
});
server.on('log', (chunk) => sendLog('server', chunk));
server.on('failure', ({ reason, code, signal }) => {
  track('server_failed', { reason, exit_code: code, signal });
});

// Skills describe the bundled core, so they are synced once per app update.
async function syncSkillsOnce(root: string) {
  const { version } = bundledCore();
  if (settings.skillsVersion(root) === version) return;
  const result = await syncSkills(root, await childEnv(), (chunk) => sendLog('server', chunk));
  if (result.ok) settings.setSkillsVersion(root, version);
}

function revealWorkspace() {
  if (workspaces.current) void shell.openPath(workspaces.current.root);
}

function removeCache(root: string) {
  void rm(cacheDirFor(root), { recursive: true, force: true });
}

function forgetWorkspace(root: string) {
  settings.forget(root);
  removeCache(root);
}

const workspaces = new WorkspaceController({
  tabs: () => tabs,
  server,
  ensureWindow: ensureMainWindow,
  env: () => childEnv(),
  log: sendLog,
  prepare: syncSkillsOnce,
  removeCache,
  onChange: broadcast,
});

const quitGate = new QuitGate({
  confirm: async () => (await tabs?.confirmLeave('quit')) ?? true,
  cleanup: async () => {
    // Work was settled during confirm; an edit made now would be lost unasked.
    for (const win of BrowserWindow.getAllWindows()) win.setEnabled(false);
    workspaces.persistSession();
    settings.flush();
    logins.cancelAll();
    cancelAllInstalls();
    await Promise.all([terminateRunning(), server.stop(), shutdownTelemetry()]);
  },
  quit: () => app.quit(),
});

async function restartServer() {
  if (tabs && !(await tabs.confirmLeave('restart'))) return;
  await server.restart();
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

function materialOptions(): BrowserWindowConstructorOptions {
  return {
    backgroundColor: windowBackground(),
    ...(isMac
      ? { vibrancy: translucent() ? 'sidebar' : undefined, visualEffectState: 'followWindow' }
      : {}),
    ...(isWindows && translucent() ? { backgroundMaterial: 'mica' } : {}),
  };
}

function createShellWindow(options: BrowserWindowConstructorOptions): BrowserWindow {
  const win = new BrowserWindow({
    show: false,
    ...options,
    webPreferences: {
      preload: SHELL_PRELOAD,
      sandbox: true,
      contextIsolation: true,
      ...options.webPreferences,
    },
  });
  const contents = win.webContents;
  const sendFocus = (focused: boolean) => {
    if (!contents.isDestroyed()) contents.send('window:focus', focused);
  };
  win.on('focus', () => sendFocus(true));
  win.on('blur', () => sendFocus(false));
  contents.on('will-navigate', (e) => e.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('context-menu', (_e, params) => showContextMenu(win, contents, params));
  return win;
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }
  const win = createShellWindow({
    width: SETTINGS_WIDTH,
    height: 520,
    title: 'Settings',
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    ...materialOptions(),
    ...(isMac
      ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 14, y: 10 } }
      : { autoHideMenuBar: true }),
  });
  settingsWindow = win;
  // The first fit-content shows the window; this covers a renderer that never reports a height.
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
  const win = createShellWindow({
    width: bounds?.width ?? 1440,
    height: bounds?.height ?? 900,
    ...(bounds ? { x: bounds.x, y: bounds.y } : {}),
    minWidth: 820,
    minHeight: 540,
    title: 'open-slide',
    ...materialOptions(),
    ...(isMac
      ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 14, y: 14 } }
      : {
          titleBarStyle: 'hidden',
          titleBarOverlay: { height: TAB_STRIP_HEIGHT, color: '#00000000' },
        }),
  });
  window = win;
  const manager = new TabManager({
    window: win,
    viewPreload: VIEW_PRELOAD,
    onChange: () => {
      workspaces.persistSession();
      broadcast();
    },
    prompt: async (options) => {
      if (win.isDestroyed()) return options.cancelId ?? 0;
      if (win.isMinimized()) win.restore();
      win.show();
      return (await dialog.showMessageBox(win, options)).response;
    },
  });
  tabs = manager;
  if (workspaces.current) {
    manager.reset(settings.session(workspaces.current.root));
    if (server.status.state === 'ready') manager.setBaseUrl(server.status.url);
  }

  win.on('enter-full-screen', broadcast);
  win.on('leave-full-screen', broadcast);
  // A playing intro reveals this window itself, right where it lands.
  win.once('ready-to-show', () => {
    if (!introWindow) win.show();
  });
  let closeConfirmed = false;
  win.on('close', (e) => {
    if (!closeConfirmed && !quitGate.leaving) {
      e.preventDefault();
      void manager.confirmLeave('close').then((confirmed) => {
        if (!confirmed || win.isDestroyed()) return;
        closeConfirmed = true;
        win.close();
      });
      return;
    }
    workspaces.persistSession();
    if (!win.isFullScreen()) settings.setBounds(win.getNormalBounds());
  });
  win.on('closed', () => {
    manager.destroy();
    if (tabs === manager) tabs = null;
    if (window === win) window = null;
  });
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

// A clear window over the whole display; the intro folds down into the main window.
function playIntro() {
  if (introWindow) return;
  const main = window ?? createWindow();
  if (main.isMinimized()) main.restore();
  const { bounds } = screen.getDisplayMatching(main.getBounds());
  const win = createShellWindow({
    ...bounds,
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
    webPreferences: { backgroundThrottling: false },
  });
  introWindow = win;
  introCovering = true;
  win.setAlwaysOnTop(true, 'screen-saver');
  const close = () => {
    if (!win.isDestroyed()) win.close();
  };
  let stalled = setTimeout(close, INTRO_TIMEOUT);
  let released = false;
  // Made click-through rather than hidden, so nothing suspends the score's audio as it rings out.
  releaseIntro = () => {
    releaseIntro = null;
    released = true;
    clearTimeout(stalled);
    stalled = setTimeout(close, INTRO_TAIL_TIMEOUT);
    if (win.isDestroyed()) return;
    win.setIgnoreMouseEvents(true);
    win.setFocusable(false);
  };
  win.once('ready-to-show', () => {
    win.setBounds(bounds);
    win.show();
    win.focus();
  });
  win.on('closed', () => {
    clearTimeout(stalled);
    if (introWindow === win) {
      introWindow = null;
      releaseIntro = null;
    }
    settings.setIntroSeen();
    revealMain();
    // A released intro already handed focus over; whatever holds it now keeps it.
    if (!released) window?.focus();
  });
  broadcast();
  loadShell(win, 'intro');
}

function replayIntro() {
  settings.setOnboarded(false);
  broadcast();
  if (reducedMotion()) void ensureMainWindow();
  else playIntro();
}

function reducedMotion(): boolean {
  return systemPreferences.getAnimationSettings().prefersReducedMotion;
}

function fromShell(e: IpcMainEvent | IpcMainInvokeEvent): boolean {
  return shellWindowOf(e.sender) !== null;
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

// Tabs and their presenter windows, and only while they show the dev server:
// a page that navigated elsewhere keeps the preload but loses the bridge.
function fromHost(e: IpcMainEvent | IpcMainInvokeEvent): boolean {
  if (!tabs?.hosts(e.sender)) return false;
  const url = e.senderFrame?.url;
  return !!url && tabs.isServerUrl(url);
}

function listenHost<A extends unknown[]>(channel: string, fn: (...args: A) => void) {
  ipcMain.on(channel, (e, ...args) => {
    if (fromHost(e)) fn(...(args as A));
  });
}

function isCreateRequest(value: unknown): value is CreateWorkspaceRequest {
  if (typeof value !== 'object' || value === null) return false;
  const { parent, name, packageManager } = value as Record<string, unknown>;
  return (
    typeof parent === 'string' &&
    path.isAbsolute(parent) &&
    typeof name === 'string' &&
    (name === '.' || (WORKSPACE_NAME_RE.test(name) && name !== '..')) &&
    PACKAGE_MANAGERS.includes(packageManager as PackageManager)
  );
}

// The baseline for every page: tabs and presenters refine it with their own handlers.
function restrictContents(contents: WebContents) {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const guard = (e: Electron.Event, url: string) => {
    if (url.startsWith('devtools://') || tabs?.isServerUrl(url)) return;
    e.preventDefault();
  };
  contents.on('will-navigate', (e) => guard(e, e.url));
  contents.on('will-redirect', (e) => guard(e, e.url));
  contents.on('will-attach-webview', (e) => e.preventDefault());
}

function permitted(contents: WebContents | null, permission: string, origin: string): boolean {
  if (!contents) return false;
  if (tabs?.hosts(contents)) return tabs.isServerUrl(origin) && TAB_PERMISSIONS.has(permission);
  return shellWindowOf(contents) !== null && SHELL_PERMISSIONS.has(permission);
}

function installPermissionPolicy() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(permitted(contents, permission, details.requestingUrl));
  });
  ses.setPermissionCheckHandler((contents, permission, origin) =>
    permitted(contents, permission, origin),
  );
}

let agentList: { at: number; value: Promise<AgentInfo[]> } | null = null;

// Each answer costs four CLI launches, so one serves every caller for a few seconds.
function cachedAgents(): Promise<AgentInfo[]> {
  if (agentList && Date.now() - agentList.at < AGENTS_TTL_MS) return agentList.value;
  const entry = { at: Date.now(), value: childEnv().then((env) => listAgents(env)) };
  agentList = entry;
  entry.value.catch(() => {
    if (agentList === entry) agentList = null;
  });
  return entry.value;
}

let pdfDir: string | null = null;

async function printToPdf(sender: WebContents, filename: unknown): Promise<boolean> {
  const win = tabs?.owns(sender) ? window : BrowserWindow.fromWebContents(sender);
  if (!win) throw new Error('Rejected host:print-to-pdf from an unknown sender');
  const name = typeof filename === 'string' ? filename.replace(/[/\\:*?"<>|]/g, '-').trim() : '';
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: path.join(pdfDir ?? app.getPath('downloads'), name || 'slides.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return false;
  pdfDir = path.dirname(filePath);
  // The same pipeline as window.print(), so the deck's @page size and print styles apply.
  const pdf = await sender.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await writeFile(filePath, pdf);
  track('pdf_exported');
  return true;
}

function isAgentId(value: unknown): value is AgentId {
  return (AGENT_IDS as readonly unknown[]).includes(value);
}

const logins = new AgentLogins({
  start: (id, hooks) => startLogin(id, () => childEnv(), hooks),
  openUrl: (url) => void shell.openExternal(url),
  onChange: (state) => sendAll('agents:login-state', state),
  onReport: (report) => {
    if (report.type === 'started') {
      track('agent_login_started', { agent: report.id });
      return;
    }
    agentList = null;
    if (report.type === 'installed') {
      track('agent_cli_downloaded', { agent: report.id, duration_ms: report.durationMs });
      return;
    }
    track(report.ok ? 'agent_login_succeeded' : 'agent_login_failed', {
      agent: report.id,
      cli_downloaded: report.downloaded,
      duration_ms: report.durationMs,
    });
  },
});

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
  ipcMain.on('telemetry:error', (e, report: unknown) => {
    const win = shellWindowOf(e.sender);
    if (!win) return;
    const kind = win === settingsWindow ? 'settings' : win === introWindow ? 'intro' : 'main';
    reportRendererError(report, kind);
  });
  ipcMain.handle('window:is-focused', (e) => shellWindowOf(e.sender)?.isFocused() ?? false);
  ipcMain.on('window:fit-content', (e, height: unknown) => {
    const win = shellWindowOf(e.sender);
    if (win && win === settingsWindow && typeof height === 'number' && Number.isFinite(height)) {
      fitSettingsWindow(win, height);
    }
  });

  handle('intro:target', () => introTarget());
  listen('intro:reveal', () => revealMain());
  listen('intro:done', (skipped: unknown) => {
    track('intro_finished', { skipped: skipped === true });
    releaseIntro?.();
    revealMain();
    window?.focus();
  });
  listen('intro:close', () => {
    if (introWindow && !introWindow.isDestroyed()) introWindow.close();
  });
  listen('onboarding:finish', () => {
    settings.setOnboarded(true);
    track('onboarding_finished', { has_workspace: workspaces.current !== null });
    broadcast();
  });

  handle('settings:get', () => settings.get());
  handle('settings:update', (patch: Partial<DesktopSettings>) => {
    const next: Partial<DesktopSettings> = {};
    if (typeof patch.translucent === 'boolean') next.translucent = patch.translucent;
    if (patch.packageManager === null || PACKAGE_MANAGERS.includes(patch.packageManager as never)) {
      next.packageManager = patch.packageManager;
    }
    if (typeof patch.telemetry === 'boolean') next.telemetry = patch.telemetry;
    const previous = settings.get();
    const before = translucent();
    const result = settings.update(next);
    for (const key of ['translucent', 'packageManager'] as const) {
      if (result[key] !== previous[key]) track('settings_changed', { key, value: result[key] });
    }
    if (translucent() !== before) {
      for (const win of shellWindows()) applyMaterial(win);
      tabs?.setTranslucent(translucent());
    }
    if (result.telemetry !== previous.telemetry) setTelemetryEnabled(result.telemetry);
    broadcast();
    return result;
  });

  listen('tabs:activate', (id: string) => tabs?.activate(String(id)));
  listen('tabs:close', (id: string) => void tabs?.close(String(id)));
  listen('tabs:move', (id: string, index: number) => tabs?.move(String(id), index));
  listen('tabs:menu', (id: string) => tabs?.showMenu(String(id)));

  handle('workspace:choose', () => workspaces.choose());
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
  handle('workspace:open', (root: string) => workspaces.open(String(root), 'shell'));
  handle('workspace:create', (request: CreateWorkspaceRequest) =>
    isCreateRequest(request)
      ? workspaces.create(request)
      : { ok: false, error: 'That workspace name is not valid.' },
  );
  handle('workspace:create-default', () => workspaces.createDefault());
  handle('workspace:install', () => workspaces.install());
  listen('workspace:reveal', revealWorkspace);
  listen('workspace:dismiss-error', (id: unknown) => workspaces.dismissError(id));
  listen('workspace:forget', (root: string) => {
    if (settings.recent().includes(root)) forgetWorkspace(root);
    broadcast();
  });

  listen('server:restart', () => void restartServer());
  handle('server:log', () => server.log);

  handle('agents:list', () => cachedAgents());
  handle('agents:logins', () => logins.snapshot());
  handle('agents:login', (id: unknown) =>
    isAgentId(id) ? logins.login(id) : { ok: false, error: 'Unknown agent.' },
  );
  handle('agents:logout', async (id: unknown) => {
    if (!isAgentId(id)) return { ok: false, error: 'Unknown agent.' };
    const result = await logout(id, await childEnv());
    agentList = null;
    return result;
  });
  listen('agents:login-input', (id: unknown, text: unknown) => {
    if (isAgentId(id)) logins.input(id, String(text));
  });
  listen('agents:login-cancel', (id: unknown) => {
    if (isAgentId(id)) logins.cancel(id);
  });
  listen('agents:login-dismiss', (id: unknown) => {
    if (isAgentId(id)) logins.dismiss(id);
  });

  // Presenter popups get the bridge too, but no window material behind them.
  ipcMain.on('host:config', (e) => {
    e.returnValue = { translucent: translucent() && (tabs?.owns(e.sender) ?? false) };
  });
  ipcMain.on('host:adopted', (e) => tabs?.adopted(e.sender));
  ipcMain.on('host:unsaved-reply', (e, request: unknown, payload: unknown) => {
    if (fromHost(e)) tabs?.unsavedReply(e.sender, request, payload);
  });
  listenHost('host:open-deck', (slideId: unknown) => {
    if (typeof slideId === 'string' && slideId && tabs?.openDeck(slideId)) {
      track('deck_opened', { open_tabs: bucket(tabs.info.tabs.length - 1) });
    }
    window?.focus();
  });
  listenHost('host:open-home', (path: unknown) => {
    tabs?.openHome(typeof path === 'string' && path.startsWith('/') ? path : undefined);
    window?.focus();
  });
  ipcMain.on('host:haptic', (e, pattern: unknown) => {
    if (fromShell(e) || fromHost(e)) performHaptic(pattern);
  });
  ipcMain.handle('host:print-to-pdf', (e, filename: unknown) => {
    if (!fromHost(e)) throw new Error('Rejected host:print-to-pdf from an unknown sender');
    return printToPdf(e.sender, filename).catch((err: unknown) => {
      captureError(err, { step: 'pdf_export' });
      throw err;
    });
  });
  listenHost('host:set-theme', (theme: unknown) => {
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
  revealWorkspace,
  closeTab: () => {
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
  reloadTab: () => tabs?.reloadActive(),
  toggleTabDevTools: () => tabs?.activeContents()?.toggleDevTools(),
  openRecent: (root) => void workspaces.open(root, 'menu'),
  replayIntro: () => replayIntro(),
  clearRecent: () => {
    for (const root of settings.recent()) {
      if (root !== workspaces.current?.root) forgetWorkspace(root);
    }
    broadcast();
  },
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  startCrashReporter();

  app.on('second-instance', () => void ensureMainWindow());

  app.on('web-contents-created', (_e, contents) => restrictContents(contents));

  app.whenReady().then(() => {
    initTelemetry();
    installPermissionPolicy();
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
    void syncManagedClis().catch((err: unknown) => captureError(err, { step: 'sync_clis' }));
    createWindow();
    if (!settings.introSeen()) {
      if (reducedMotion()) settings.setIntroSeen();
      else playIntro();
    }
    const saved = settings.workspace();
    if (saved) void workspaces.open(saved, 'restored');

    app.on('activate', () => {
      if (!window) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });

  app.on('before-quit', (e) => quitGate.beforeQuit(e));

  // Windows record their bounds as they close, after the quit gate has flushed.
  app.on('will-quit', () => settings.flush());
}
