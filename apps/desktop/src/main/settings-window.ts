import { type BrowserWindow, screen } from 'electron';
import { isMac } from './platform';
import { createShellWindow, loadShell, materialOptions } from './shell-window';

const WIDTH = 640;
const INITIAL_HEIGHT = 520;
const MIN_HEIGHT = 240;
const MAX_HEIGHT = 760;
const SCREEN_MARGIN = 80;
const UNFITTED_SHOW_DELAY_MS = 400;

export class SettingsWindow {
  window: BrowserWindow | null = null;

  open() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      return;
    }
    const win = createShellWindow({
      width: WIDTH,
      height: INITIAL_HEIGHT,
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
    this.window = win;
    win.once('ready-to-show', () => {
      setTimeout(() => {
        if (!win.isDestroyed() && !win.isVisible()) win.show();
      }, UNFITTED_SHOW_DELAY_MS);
    });
    win.on('closed', () => {
      if (this.window === win) this.window = null;
    });
    loadShell(win.webContents, 'settings');
  }

  fitContent(contentHeight: number) {
    const win = this.window;
    if (!win) return;
    const { workAreaSize } = screen.getDisplayMatching(win.getBounds());
    const max = Math.min(MAX_HEIGHT, workAreaSize.height - SCREEN_MARGIN);
    const height = Math.round(Math.max(MIN_HEIGHT, Math.min(max, contentHeight)));
    const [width, current] = win.getContentSize();
    if (!win.isVisible()) {
      win.setContentSize(width, height);
      win.center();
      win.show();
    } else if (height !== current) {
      win.setContentSize(width, height, true);
    }
  }
}
