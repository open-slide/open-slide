import { type BrowserWindow, nativeTheme, screen } from 'electron';
import type { IntroTarget } from '../shared/types';
import { isMac, isWindows } from './platform';
import { settings } from './settings';
import { createShellWindow, loadShell } from './shell-window';

const MAIN_WINDOW_RADIUS = isMac ? 12 : isWindows ? 8 : 0;
const STALL_TIMEOUT_MS = 20_000;
const SCORE_TAIL_MS = 14_000;

type Options = {
  main: () => BrowserWindow | null;
  onChange: () => void;
};

export class IntroWindow {
  window: BrowserWindow | null = null;
  coversMain = false;
  private release: (() => void) | null = null;

  constructor(private readonly opts: Options) {}

  play(main: BrowserWindow) {
    if (this.window) return;
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
    this.window = win;
    this.coversMain = true;
    win.setAlwaysOnTop(true, 'screen-saver');
    const close = () => {
      if (!win.isDestroyed()) win.close();
    };
    let closeTimer = setTimeout(close, STALL_TIMEOUT_MS);
    let released = false;
    this.release = () => {
      this.release = null;
      released = true;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, SCORE_TAIL_MS);
      if (win.isDestroyed()) return;
      // Click-through rather than hidden: hiding would suspend the score's audio as it rings out.
      win.setIgnoreMouseEvents(true);
      win.setFocusable(false);
    };
    win.once('ready-to-show', () => {
      win.setBounds(bounds);
      win.show();
      win.focus();
    });
    win.on('closed', () => {
      clearTimeout(closeTimer);
      if (this.window === win) {
        this.window = null;
        this.release = null;
      }
      settings.setIntroSeen();
      this.revealMain();
      if (!released) this.opts.main()?.focus();
    });
    this.opts.onChange();
    loadShell(win.webContents, 'intro');
  }

  target(): IntroTarget | null {
    const main = this.opts.main();
    if (!main || !this.window) return null;
    const frame = main.getBounds();
    const origin = this.window.getBounds();
    return {
      x: frame.x - origin.x,
      y: frame.y - origin.y,
      width: frame.width,
      height: frame.height,
      radius: main.isFullScreen() || main.isMaximized() ? 0 : MAIN_WINDOW_RADIUS,
      dark: nativeTheme.shouldUseDarkColors,
    };
  }

  revealMain() {
    if (this.coversMain) {
      this.coversMain = false;
      this.opts.onChange();
    }
    const main = this.opts.main();
    if (main && !main.isVisible()) main.showInactive();
  }

  finish() {
    this.release?.();
    this.revealMain();
    this.opts.main()?.focus();
  }

  close() {
    if (this.window && !this.window.isDestroyed()) this.window.close();
  }
}
