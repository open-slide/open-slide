import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

type FakeWindow = {
  dead: boolean;
  shown: boolean;
  close: () => void;
  webContents: { send: ReturnType<typeof vi.fn> };
};
type Handler = (...args: unknown[]) => unknown;

const fixture = vi.hoisted(() => ({
  home: '',
  handlers: new Map<string, Handler>(),
  listeners: new Map<string, Handler>(),
  windows: [] as FakeWindow[],
  menu: null as { openRecent: (root: string) => void } | null,
  ready: (() => {}) as () => void,
  events: [] as string[],
  trusted: new Set<string>(),
  leave: true,
}));

vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events');
  class BrowserWindow extends EventEmitter {
    dead = false;
    shown = false;
    webContents = Object.assign(new EventEmitter(), {
      send: vi.fn(),
      setWindowOpenHandler: () => {},
      isDestroyed: () => this.dead,
      isLoading: () => false,
      loadFile: () => Promise.resolve(),
    });
    constructor() {
      super();
      fixture.windows.push(this);
      fixture.events.push('window-created');
      setImmediate(() => this.emit('ready-to-show'));
    }
    isDestroyed() {
      return this.dead;
    }
    isFullScreen() {
      return false;
    }
    isMinimized() {
      return false;
    }
    isVisible() {
      return this.shown;
    }
    show() {
      this.shown = true;
      this.emit('show');
    }
    focus() {}
    getNormalBounds() {
      return { x: 0, y: 0, width: 1000, height: 800 };
    }
    close() {
      let prevented = false;
      this.emit('close', {
        preventDefault: () => {
          prevented = true;
        },
      });
      if (prevented) return;
      this.dead = true;
      this.emit('closed');
    }
  }
  return {
    app: Object.assign(new EventEmitter(), {
      requestSingleInstanceLock: () => true,
      whenReady: () =>
        new Promise<void>((resolve) => {
          fixture.ready = resolve;
        }),
      setAboutPanelOptions: () => {},
      getVersion: () => '0.0.1',
      getPath: () => fixture.home,
      getAppPath: () => fixture.home,
      quit: () => {},
    }),
    BrowserWindow,
    nativeTheme: Object.assign(new EventEmitter(), { shouldUseDarkColors: false }),
    ipcMain: {
      handle: (channel: string, fn: Handler) => fixture.handlers.set(channel, fn),
      on: (channel: string, fn: Handler) => fixture.listeners.set(channel, fn),
    },
    dialog: {
      showMessageBox: async () => {
        fixture.events.push('trust-prompt');
        return { response: 0 };
      },
    },
    Menu: {},
    shell: {},
    screen: {},
    session: {
      defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {} },
    },
    systemPreferences: {
      getAccentColor: () => '',
      getAnimationSettings: () => ({ prefersReducedMotion: true }),
      subscribeNotification() {},
      on() {},
    },
  };
});
vi.mock('./settings', () => ({
  settings: {
    get: () => ({ telemetry: false, translucent: false, packageManager: null }),
    packageManager: () => null,
    bounds: () => null,
    setBounds: () => {},
    recent: () => [],
    onboarded: () => true,
    setOnboarded: () => {},
    introSeen: () => true,
    workspace: () => null,
    setWorkspace: () => [],
    trusted: (root: string) => fixture.trusted.has(root),
    trust: (root: string) => fixture.trusted.add(root),
    session: () => ({ decks: [], active: null }),
    setSession: () => {},
    skillsVersion: () => '0.0.0',
    flush: () => {},
  },
}));
vi.mock('./server', async () => {
  const { EventEmitter } = await import('node:events');
  return {
    DevServer: class extends EventEmitter {
      status = { state: 'idle' };
      start(root: string) {
        fixture.events.push(`server-start: ${root} (windows: ${liveWindows()})`);
        return Promise.resolve();
      }
      stop() {
        return Promise.resolve();
      }
      restart() {
        fixture.events.push('server-restart');
        return Promise.resolve();
      }
    },
  };
});
vi.mock('./tabs', () => ({
  TabManager: class {
    info = { tabs: [], activeTabId: null };
    session = { decks: [], active: null };
    reset() {}
    destroy() {
      fixture.events.push('tabs-destroyed');
    }
    setBaseUrl() {}
    async confirmLeave(intent: string) {
      fixture.events.push(`confirm-leave: ${intent}`);
      return fixture.leave;
    }
  },
}));
vi.mock('./menu', () => ({
  installMenu: (actions: { openRecent: (root: string) => void }) => {
    fixture.menu = actions;
  },
}));
vi.mock('./agent-cli', () => ({
  cancelAllInstalls() {},
  managedCliDirs: () => [],
  syncManagedClis: async () => {},
}));
vi.mock('./agents', () => ({ listAgents: async () => [], logout: async () => ({ ok: true }) }));
vi.mock('./haptics', () => ({ performHaptic() {} }));
vi.mock('./update-source', () => ({ electronUpdateSource: () => null }));
vi.mock('./process', () => ({ terminateRunning: async () => {} }));
vi.mock('./shell-env', () => ({
  shellEnv: async () => ({}),
  loginEnv: async () => ({}),
  findOnPath: () => null,
}));
vi.mock('./telemetry', () => ({
  bucket: () => '1',
  captureError() {},
  initTelemetry() {},
  reportRendererError() {},
  setTelemetryEnabled() {},
  shutdownTelemetry: async () => {},
  startCrashReporter() {},
  track() {},
}));
vi.mock('./workspace', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./workspace')>()),
  bundledCore: () => ({ bin: 'unused', version: '0.0.0' }),
  modulesDir: () => '/unused',
}));

const liveWindows = () => fixture.windows.filter((w) => !w.dead).length;
const tick = () => new Promise((resolve) => setImmediate(resolve));

describe('main window lifecycle', () => {
  let root = '';

  beforeAll(async () => {
    fixture.home = realpathSync(mkdtempSync(path.join(tmpdir(), 'open-slide-main-')));
    root = path.join(fixture.home, 'deck');
    mkdirSync(root);
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'deck', dependencies: { '@open-slide/core': '*' } }),
    );
    await import('./index');
    fixture.ready();
    await tick();
  });

  afterAll(() => rmSync(fixture.home, { recursive: true, force: true }));

  it('settles unsaved work before the window closes, and stays open on cancel', async () => {
    expect(liveWindows()).toBe(1);
    const [window] = fixture.windows;

    fixture.leave = false;
    window.close();
    await tick();
    expect(window.dead).toBe(false);
    expect(fixture.events).toContain('confirm-leave: close');
    expect(fixture.events).not.toContain('tabs-destroyed');

    fixture.leave = true;
    window.close();
    await tick();
    expect(window.dead).toBe(true);
    expect(fixture.events).toContain('tabs-destroyed');
  });

  it('opens a recent workspace into a new window when none is left', async () => {
    fixture.leave = true;
    for (const open of fixture.windows) if (!open.dead) open.close();
    await tick();
    expect(liveWindows()).toBe(0);
    fixture.events = [];

    fixture.menu?.openRecent(root);
    await vi.waitFor(() =>
      expect(fixture.events.some((e) => e.startsWith('server-start'))).toBe(true),
    );

    expect(fixture.events).toEqual([
      'window-created',
      'trust-prompt',
      'confirm-leave: switch',
      `server-start: ${root} (windows: 1)`,
    ]);
    expect(fixture.windows.at(-1)?.shown).toBe(true);
  });

  it('still refuses workspace requests from anything but a shell window', () => {
    fixture.events = [];
    const open = fixture.handlers.get('workspace:open');

    expect(() => open?.({ sender: {} }, root)).toThrow(
      'Rejected workspace:open from an unknown sender',
    );
    expect(fixture.events).toEqual([]);
  });

  it('checks unsaved work before restarting even when the server is down', async () => {
    fixture.events = [];
    fixture.leave = false;
    const restart = fixture.listeners.get('server:restart');
    restart?.({ sender: fixture.windows.at(-1)?.webContents });
    await tick();

    expect(fixture.events).toEqual(['confirm-leave: restart']);
    fixture.leave = true;
    restart?.({ sender: fixture.windows.at(-1)?.webContents });
    await tick();
    expect(fixture.events).toContain('server-restart');
  });
});
