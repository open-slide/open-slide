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
  nativeTheme,
  shell,
  systemPreferences,
  type WebContents,
} from 'electron';
import { AGENT_MODULES_ENV } from '../../../../packages/core/src/supervision';
import {
  AGENT_IDS,
  type AgentId,
  type AgentInfo,
  type AppState,
  type CreateWorkspaceRequest,
  type DesktopSettings,
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
import { IntroWindow } from './intro-window';
import { installMenu, type MenuActions } from './menu';
import { exportPdf } from './pdf';
import { isMac } from './platform';
import { terminateRunning } from './process';
import { QuitGate } from './quit';
import { installPermissionPolicy, restrictContents } from './security';
import { DevServer } from './server';
import { settings } from './settings';
import { loginEnv, shellEnv } from './shell-env';
import {
  accent,
  applyMaterial,
  createShellWindow,
  loadShell,
  materialOptions,
  SHELL_PRELOAD,
  translucent,
  VIEW_PRELOAD,
  windowBackground,
} from './shell-window';
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

type IpcEvent = IpcMainEvent | IpcMainInvokeEvent;

const THEMES = new Set(['light', 'dark', 'system']);
const WORKSPACE_NAME_RE = /^[\p{L}\p{N}._-]+$/u;
const AGENTS_TTL_MS = 5000;
const WINDOW_SHOW_TIMEOUT_MS = 2000;

let window: BrowserWindow | null = null;
let tabs: TabManager | null = null;
const intro = new IntroWindow({ main: () => window, onChange: broadcast });

async function childEnv(read = shellEnv): Promise<NodeJS.ProcessEnv> {
  const env = await read();
  const PATH = [env.PATH ?? '', ...managedCliDirs()].filter(Boolean).join(path.delimiter);
  return { ...env, PATH, [AGENT_MODULES_ENV]: modulesDir() };
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

function state(): AppState {
  const info = tabs?.info ?? { tabs: [], activeTabId: null };
  return {
    platform: process.platform,
    translucent: translucent(),
    accent: accent(),
    fullscreen: window?.isFullScreen() ?? false,
    onboarding: !settings.onboarded(),
    intro: intro.coversMain,
    workspace: workspaces.current,
    workspaceError: workspaces.error,
    recent: settings.recent(),
    server: server.status,
    tabs: info.tabs,
    activeTabId: info.activeTabId,
  };
}

function shellWindows(): BrowserWindow[] {
  return [window, intro.window].filter((w): w is BrowserWindow => !!w && !w.isDestroyed());
}

function shellWindowOf(contents: WebContents | null): BrowserWindow | null {
  return shellWindows().find((w) => w.webContents === contents) ?? null;
}

function sendToShell(channel: string, payload: unknown) {
  for (const win of shellWindows()) win.webContents.send(channel, payload);
  tabs?.switcherContents?.send(channel, payload);
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

function broadcast() {
  if (broadcastQueued) return;
  broadcastQueued = true;
  setImmediate(() => {
    broadcastQueued = false;
    sendToShell('state', state());
    refreshMenu();
  });
}

function sendLog(task: LogTask, chunk: string) {
  sendToShell('log', { task, chunk });
}

function whenShown(win: BrowserWindow): Promise<void> {
  if (win.isVisible()) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, WINDOW_SHOW_TIMEOUT_MS);
    win.once('show', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function ensureMainWindow(): Promise<BrowserWindow> {
  if (!window) {
    const created = createWindow();
    await whenShown(created);
    return created;
  }
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
  return window;
}

function sendWhenLoaded(contents: WebContents, channel: string, payload: unknown) {
  const send = () => contents.send(channel, payload);
  if (contents.isLoading()) contents.once('did-finish-load', send);
  else send();
}

function sendCommand(command: ShellCommand) {
  void ensureMainWindow().then(({ webContents }) =>
    sendWhenLoaded(webContents, 'command', command),
  );
}

let settingsOpen = false;

async function openSettings() {
  const { webContents } = await ensureMainWindow();
  if (settingsOpen) return;
  const backdrop = (await tabs?.snapshot()) ?? null;
  sendWhenLoaded(webContents, 'settings:open', backdrop);
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

async function syncSkillsOncePerCoreVersion(root: string) {
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
  prepare: syncSkillsOncePerCoreVersion,
  removeCache,
  onChange: broadcast,
});

function blockInputWhileQuitting() {
  for (const win of BrowserWindow.getAllWindows()) win.setEnabled(false);
}

const quitGate = new QuitGate({
  confirm: async () => (await tabs?.confirmLeave('quit')) ?? true,
  cleanup: async () => {
    blockInputWhileQuitting();
    workspaces.persistSession();
    settings.flush();
    logins.cancelAll();
    workspaces.shutdown();
    cancelAllInstalls();
    await Promise.all([terminateRunning(), server.stop(), shutdownTelemetry()]);
  },
  quit: () => app.quit(),
});

async function restartServer() {
  if (tabs && !(await tabs.confirmLeave('restart'))) return;
  await server.restart();
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
    shellPreload: SHELL_PRELOAD,
    loadShell,
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
  win.once('ready-to-show', () => {
    if (!intro.window) win.show();
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
    if (window === win) {
      window = null;
      settingsOpen = false;
    }
  });
  win.webContents.on('did-finish-load', () => {
    settingsOpen = false;
  });
  loadShell(win.webContents);
  return win;
}

function reducedMotion(): boolean {
  return systemPreferences.getAnimationSettings().prefersReducedMotion;
}

function playIntro() {
  if (!intro.window) intro.play(window ?? createWindow());
}

function replayIntro() {
  settings.setOnboarded(false);
  broadcast();
  if (reducedMotion()) void ensureMainWindow();
  else playIntro();
}

function fromShell(e: IpcEvent): boolean {
  return shellWindowOf(e.sender) !== null || e.sender === tabs?.switcherContents;
}

// A page that navigated off the dev server keeps the preload but must lose the bridge.
function fromHost(e: IpcEvent): boolean {
  if (!tabs?.hosts(e.sender)) return false;
  const url = e.senderFrame?.url;
  return !!url && tabs.isServerUrl(url);
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

function isAgentId(value: unknown): value is AgentId {
  return (AGENT_IDS as readonly unknown[]).includes(value);
}

function forAgent<A extends unknown[]>(fn: (id: AgentId, ...args: A) => void) {
  return (id: unknown, ...args: A) => {
    if (isAgentId(id)) fn(id, ...args);
  };
}

let agentList: { at: number; value: Promise<AgentInfo[]> } | null = null;

function cachedAgents(): Promise<AgentInfo[]> {
  if (agentList && Date.now() - agentList.at < AGENTS_TTL_MS) return agentList.value;
  const entry = { at: Date.now(), value: childEnv().then((env) => listAgents(env)) };
  agentList = entry;
  entry.value.catch(() => {
    if (agentList === entry) agentList = null;
  });
  return entry.value;
}

const logins = new AgentLogins({
  start: (id, hooks) => startLogin(id, () => childEnv(loginEnv), hooks),
  openUrl: (url) => void shell.openExternal(url),
  onChange: (state) => sendToShell('agents:login-state', state),
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

function sanitizeSettings(patch: Partial<DesktopSettings>): Partial<DesktopSettings> {
  const next: Partial<DesktopSettings> = {};
  if (typeof patch.translucent === 'boolean') next.translucent = patch.translucent;
  if (patch.packageManager === null || PACKAGE_MANAGERS.includes(patch.packageManager as never)) {
    next.packageManager = patch.packageManager;
  }
  if (typeof patch.telemetry === 'boolean') next.telemetry = patch.telemetry;
  return next;
}

function updateSettings(patch: Partial<DesktopSettings>): DesktopSettings {
  const next = sanitizeSettings(patch);
  const previous = settings.get();
  const wasTranslucent = translucent();
  const result = settings.update(next);
  for (const key of ['translucent', 'packageManager'] as const) {
    if (result[key] !== previous[key]) track('settings_changed', { key, value: result[key] });
  }
  if (translucent() !== wasTranslucent) {
    for (const win of shellWindows()) applyMaterial(win);
    tabs?.setTranslucent(translucent());
  }
  if (result.telemetry !== previous.telemetry) setTelemetryEnabled(result.telemetry);
  broadcast();
  return result;
}

function registerAppIpc() {
  handle('state:get', () => state());
  listen('overlay:set', (open: boolean) => tabs?.setOverlay(Boolean(open)));
  listen('external:open', (url: unknown) => {
    if (isHttpUrl(url)) void shell.openExternal(url);
  });
  listen('shell:command', (command: unknown) => {
    if (command === 'open-workspace' || command === 'new-workspace') sendCommand(command);
  });
  listen('onboarding:finish', () => {
    settings.setOnboarded(true);
    track('onboarding_finished', { has_workspace: workspaces.current !== null });
    broadcast();
  });
  listen('server:restart', () => void restartServer());
  handle('server:log', () => server.log);
  ipcMain.handle('window:is-focused', (e) => shellWindowOf(e.sender)?.isFocused() ?? false);
  ipcMain.on('telemetry:error', (e, report: unknown) => {
    const win = shellWindowOf(e.sender);
    if (!win) return;
    const kind = win === intro.window ? 'intro' : 'main';
    reportRendererError(report, kind);
  });
}

function registerSettingsIpc() {
  listen('settings:open', () => void openSettings());
  listen('settings:set-open', (open: unknown) => {
    settingsOpen = open === true;
  });
  handle('settings:get', () => settings.get());
  handle('settings:update', updateSettings);
}

function registerIntroIpc() {
  handle('intro:target', () => intro.target());
  listen('intro:reveal', () => intro.revealMain());
  listen('intro:done', (skipped: unknown) => {
    track('intro_finished', { skipped: skipped === true });
    intro.finish();
  });
  listen('intro:close', () => intro.close());
}

function registerTabIpc() {
  listen('tabs:activate', (id: string) => tabs?.activate(String(id)));
  listen('tabs:close', (id: string) => void tabs?.close(String(id)));
  listen('tabs:move', (id: string, index: number) => tabs?.move(String(id), index));
  listen('tabs:menu', (id: string) => tabs?.showMenu(String(id)));
  listen('switcher:pick', (id: unknown) => tabs?.pickSwitch(id));
}

function registerWorkspaceIpc() {
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
}

function registerAgentIpc() {
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
  listen(
    'agents:login-input',
    forAgent((id, text: unknown) => logins.input(id, String(text))),
  );
  listen(
    'agents:login-cancel',
    forAgent((id) => logins.cancel(id)),
  );
  listen(
    'agents:login-dismiss',
    forAgent((id) => logins.dismiss(id)),
  );
}

function registerHostIpc() {
  ipcMain.on('host:config', (e) => {
    e.returnValue = { translucent: translucent() && (tabs?.owns(e.sender) ?? false) };
  });
  ipcMain.on('host:adopted', (e) => tabs?.adopted(e.sender));
  ipcMain.on('host:unsaved-reply', (e, request: unknown, payload: unknown) => {
    if (fromHost(e)) tabs?.unsavedReply(e.sender, request, payload);
  });
  ipcMain.on('host:haptic', (e, pattern: unknown) => {
    if (fromShell(e) || fromHost(e)) performHaptic(pattern);
  });
  ipcMain.handle('host:print-to-pdf', (e, filename: unknown) => {
    if (!fromHost(e)) throw new Error('Rejected host:print-to-pdf from an unknown sender');
    const parent = tabs?.owns(e.sender) ? window : BrowserWindow.fromWebContents(e.sender);
    return exportPdf(e.sender, parent, filename).catch((err: unknown) => {
      captureError(err, { step: 'pdf_export' });
      throw err;
    });
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
  listenHost('host:set-theme', (theme: unknown) => {
    if (typeof theme !== 'string' || !THEMES.has(theme)) return;
    nativeTheme.themeSource = theme as 'light' | 'dark' | 'system';
  });
}

function registerIpc() {
  registerAppIpc();
  registerSettingsIpc();
  registerIntroIpc();
  registerTabIpc();
  registerWorkspaceIpc();
  registerAgentIpc();
  registerHostIpc();
}

nativeTheme.on('updated', () => {
  for (const win of shellWindows()) win.setBackgroundColor(windowBackground());
});

const menuActions: MenuActions = {
  openSettings: () => void openSettings(),
  openWorkspace: () => sendCommand('open-workspace'),
  newWorkspace: () => sendCommand('new-workspace'),
  revealWorkspace,
  closeTab: () => {
    const focused = BrowserWindow.getFocusedWindow();
    if (focused && focused !== window) {
      focused.close();
      return;
    }
    if (settingsOpen) {
      window?.webContents.send('settings:close');
      return;
    }
    if (!tabs?.closeActive() && !isMac) window?.close();
  },
  goHome: () => tabs?.openHome(),
  selectTab: (index) => tabs?.activateIndex(index),
  cycleTab: (delta) => tabs?.cycle(delta),
  reloadTab: () => tabs?.reloadActive(),
  toggleTabDevTools: () => tabs?.activeContents()?.toggleDevTools(),
  toggleShellDevTools: () =>
    (BrowserWindow.getFocusedWindow() ?? window)?.webContents.toggleDevTools(),
  openRecent: (root) => void workspaces.open(root, 'menu'),
  replayIntro,
  clearRecent: () => {
    for (const root of settings.recent()) {
      if (root !== workspaces.current?.root) forgetWorkspace(root);
    }
    broadcast();
  },
};

function watchAccentColor() {
  if (isMac) {
    systemPreferences.subscribeNotification('AppleColorPreferencesChangedNotification', broadcast);
  } else {
    systemPreferences.on('accent-color-changed', broadcast);
  }
}

function start() {
  initTelemetry();
  installPermissionPolicy({
    isServerUrl: (url) => tabs?.isServerUrl(url) ?? false,
    isHostPage: (contents) => tabs?.hosts(contents) ?? false,
    isShellPage: (contents) => shellWindowOf(contents) !== null,
  });
  registerIpc();
  refreshMenu();
  app.setAboutPanelOptions({
    applicationName: 'open-slide',
    applicationVersion: bundledCore().version,
    version: '',
    credits: 'Slides as React code, edited alongside your agent.',
    website: 'https://open-slide.dev',
  });
  watchAccentColor();
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
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  startCrashReporter();
  app.on('second-instance', () => void ensureMainWindow());
  app.on('web-contents-created', (_e, contents) => {
    restrictContents(contents, (url) => tabs?.isServerUrl(url) ?? false);
  });
  app.whenReady().then(start);
  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
  app.on('before-quit', (e) => quitGate.beforeQuit(e));
  // Windows record their bounds as they close, after the quit gate has flushed.
  app.on('will-quit', () => settings.flush());
}
