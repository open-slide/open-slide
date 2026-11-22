import path from 'node:path';
import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  nativeTheme,
  systemPreferences,
  type WebContents,
} from 'electron';
import { showContextMenu } from './menu';
import { isMac, isWindows } from './platform';
import { settings } from './settings';

export const SHELL_PRELOAD = path.join(import.meta.dirname, '../preload/shell.cjs');
export const VIEW_PRELOAD = path.join(import.meta.dirname, '../preload/view.cjs');

const supportsMaterial = isMac || isWindows;

export function translucent(): boolean {
  return supportsMaterial && settings.get().translucent;
}

export function accent(): string | null {
  if (!supportsMaterial) return null;
  const hex = systemPreferences.getAccentColor();
  return hex ? `#${hex}` : null;
}

export function windowBackground(): string {
  if (translucent()) return '#00000000';
  return nativeTheme.shouldUseDarkColors ? '#030303' : '#f7f7f7';
}

export function applyMaterial(win: BrowserWindow) {
  if (isMac) win.setVibrancy(translucent() ? 'sidebar' : null);
  if (isWindows) win.setBackgroundMaterial(translucent() ? 'mica' : 'none');
  win.setBackgroundColor(windowBackground());
}

export function materialOptions(): BrowserWindowConstructorOptions {
  return {
    backgroundColor: windowBackground(),
    ...(isMac
      ? { vibrancy: translucent() ? 'sidebar' : undefined, visualEffectState: 'followWindow' }
      : {}),
    ...(isWindows && translucent() ? { backgroundMaterial: 'mica' } : {}),
  };
}

export function loadShell(contents: WebContents, route?: string) {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    void contents.loadURL(`${devUrl}${route ? `#${route}` : ''}`);
  } else {
    const page = path.join(import.meta.dirname, '../renderer/index.html');
    void contents.loadFile(page, { hash: route });
  }
}

export function createShellWindow(options: BrowserWindowConstructorOptions): BrowserWindow {
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
