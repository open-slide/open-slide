import path from 'node:path';
import {
  app,
  BrowserWindow,
  dialog,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  ipcMain,
  nativeTheme,
  shell,
} from 'electron';
import {
  type AgentId,
  type AppState,
  type CreateWorkspaceRequest,
  type DesktopSettings,
  type LogTask,
  PACKAGE_MANAGERS,
  type PackageManager,
  type ShellCommand,
  TAB_STRIP_HEIGHT,
  type TaskResult,
  type WorkspaceInfo,
} from '../shared/types';
import { cancelAllLogins, cancelLogin, listAgents, login, logout, sendLoginInput } from './agents';
import { installMenu } from './menu';
import { DevServer } from './server';
import { settings } from './settings';
import { shellEnv } from './shell-env';
import { TabManager } from './tabs';
import {
  availablePackageManagers,
  createWorkspace,
  detectPackageManager,
  inspectWorkspace,
  installDependencies,
  modulesDir,
} from './workspace';

const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const SHELL_PRELOAD = path.join(import.meta.dirname, '../preload/shell.cjs');
const VIEW_PRELOAD = path.join(import.meta.dirname, '../preload/view.cjs');
const THEMES = new Set(['light', 'dark', 'system']);

let window: BrowserWindow | null = null;
let tabs: TabManager | null = null;
let workspace: WorkspaceInfo | null = null;

async function childEnv(): Promise<NodeJS.ProcessEnv> {
  return { ...(await shellEnv()), OPEN_SLIDE_AGENT_MODULES: modulesDir() };
}

function fallbackPackageManager(): PackageManager {
  return settings.packageManager() ?? 'npm';
}

const server = new DevServer(
  childEnv,
  (root) => detectPackageManager(root, fallbackPackageManager()),
  { get: (root) => settings.port(root), set: (root, port) => settings.setPort(root, port) },
);

function translucencySupported(): boolean {
  return isMac || isWindows;
}

function translucent(): boolean {
  return translucencySupported() && settings.get().translucent;
}

function state(): AppState {
  const info = tabs?.info ?? { tabs: [], activeTabId: null };
  return {
    platform: process.platform,
    translucent: translucent(),
    fullscreen: window?.isFullScreen() ?? false,
    workspace,
    recent: settings.recent(),
    server: server.status,
    tabs: info.tabs,
    activeTabId: info.activeTabId,
  };
}

function broadcast() {
  if (window && !window.isDestroyed()) window.webContents.send('state', state());
}

function sendLog(task: LogTask, chunk: string) {
  if (window && !window.isDestroyed()) window.webContents.send('log', { task, chunk });
}

function sendCommand(command: ShellCommand) {
  if (window) {
    window.show();
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

async function openWorkspace(root: string): Promise<TaskResult> {
  const inspection = inspectWorkspace(root);
  if (inspection.kind !== 'project') {
    return { ok: false, error: `${inspection.path} is not an open-slide workspace.` };
  }
  persistSession();
  workspace = { root: inspection.path, name: inspection.name };
  settings.setWorkspace(inspection.path);
  tabs?.reset(settings.session(inspection.path));
  broadcast();
  await server.start(inspection.path);
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
  win.once('ready-to-show', () => win.show());
  win.on('close', () => {
    persistSession();
    if (!win.isFullScreen()) settings.setBounds(win.getNormalBounds());
  });
  win.on('closed', () => {
    tabs?.destroy();
    tabs = null;
    window = null;
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void win.loadFile(path.join(import.meta.dirname, '../renderer/index.html'));
  return win;
}

function fromShell(e: IpcMainEvent | IpcMainInvokeEvent): boolean {
  return window !== null && e.sender === window.webContents;
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

  handle('settings:get', () => settings.get());
  handle('settings:update', (patch: Partial<DesktopSettings>) => {
    const next: Partial<DesktopSettings> = {};
    if (typeof patch.translucent === 'boolean') next.translucent = patch.translucent;
    if (patch.packageManager === null || PACKAGE_MANAGERS.includes(patch.packageManager as never)) {
      next.packageManager = patch.packageManager;
    }
    const before = translucent();
    const result = settings.update(next);
    if (window && translucent() !== before) {
      applyMaterial(window);
      tabs?.reloadAll();
    }
    broadcast();
    return result;
  });

  listen('tabs:activate', (id: string) => tabs?.activate(id));
  listen('tabs:close', (id: string) => tabs?.close(id));
  listen('tabs:move', (id: string, index: number) => tabs?.move(id, index));

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
    broadcast();
  });

  listen('server:restart', () => void server.restart());
  handle('server:log', () => server.log);

  handle('agents:list', async () => listAgents(await childEnv()));
  handle('agents:login', async (id: AgentId) =>
    login(
      id,
      await childEnv(),
      (event) => window?.webContents.send('agents:login-event', event),
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
  ipcMain.on('host:open-deck', (_e, slideId: unknown) => {
    if (typeof slideId === 'string' && slideId) tabs?.openDeck(slideId);
    window?.focus();
  });
  ipcMain.on('host:open-home', (_e, path: unknown) => {
    tabs?.openHome(typeof path === 'string' && path.startsWith('/') ? path : undefined);
    window?.focus();
  });
  ipcMain.on('host:set-theme', (_e, theme: unknown) => {
    if (typeof theme !== 'string' || !THEMES.has(theme)) return;
    nativeTheme.themeSource = theme as 'light' | 'dark' | 'system';
  });
}

nativeTheme.on('updated', () => {
  if (window && !window.isDestroyed()) window.setBackgroundColor(windowBackground());
});

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
    installMenu({
      openSettings: () => sendCommand('open-settings'),
      openWorkspace: () => sendCommand('open-workspace'),
      newWorkspace: () => sendCommand('new-workspace'),
      revealWorkspace: () => workspace && void shell.openPath(workspace.root),
      closeTab: () => {
        if (!tabs?.closeActive() && !isMac) window?.close();
      },
      goHome: () => tabs?.openHome(),
      selectTab: (index) => tabs?.activateIndex(index),
      cycleTab: (delta) => tabs?.cycle(delta),
      reloadTab: () => tabs?.activeContents()?.reload(),
      toggleTabDevTools: () => tabs?.activeContents()?.toggleDevTools(),
    });
    void shellEnv();
    createWindow();
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
