/// <reference lib="dom" />
import { contextBridge, ipcRenderer } from 'electron';
import {
  type DesktopHost,
  SPARE_PATH,
  type UnsavedAction,
  type UnsavedGuard,
} from '../shared/types';

const config = ipcRenderer.sendSync('host:config') as { translucent: boolean };

const ADOPT_FALLBACK_MS = 500;

let spare = window.location.pathname === SPARE_PATH;
let pending: string | null = null;
const listeners = new Set<(path: string) => void>();

// The host keeps an adopted spare hidden until the route it was sent to has
// rendered, so the not-found page it booted on never reaches the screen.
function reportCommit() {
  const root = document.getElementById('root');
  const done = () => ipcRenderer.send('host:adopted');
  if (!root) {
    done();
    return;
  }
  const observer = new MutationObserver(() => {
    observer.disconnect();
    clearTimeout(timer);
    done();
  });
  const timer = setTimeout(() => {
    observer.disconnect();
    done();
  }, ADOPT_FALLBACK_MS);
  observer.observe(root, { childList: true, subtree: true });
}

function deliver(path: string) {
  for (const listener of listeners) listener(path);
  if (spare) {
    spare = false;
    reportCommit();
  }
}

// A spare can be adopted before core has mounted and subscribed.
ipcRenderer.on('host:navigate', (_e, path: string) => {
  if (listeners.size) deliver(path);
  else pending = path;
});

let translucent = config.translucent;
const materialListeners = new Set<(translucent: boolean) => void>();

ipcRenderer.on('host:translucent', (_e, value: unknown) => {
  translucent = value === true;
  for (const listener of materialListeners) listener(translucent);
});

let guard: UnsavedGuard | null = null;

// The host asks before it closes or reloads this page. A page that registered
// no guard has nothing to lose, so it answers for itself.
ipcRenderer.on('host:unsaved', (_e, request: number, action: 'query' | UnsavedAction) => {
  const reply = (payload: unknown) => ipcRenderer.send('host:unsaved-reply', request, payload);
  try {
    if (action === 'query') {
      reply(guard ? guard.status() : { drafts: false, pending: false });
    } else if (guard) {
      guard.settle(action).then(reply, (err: unknown) => reply({ ok: false, error: String(err) }));
    } else {
      reply({ ok: true });
    }
  } catch (err) {
    reply({ ok: false, error: String(err) });
  }
});

const host: DesktopHost = {
  translucent: config.translucent,
  openDeck: (slideId) => ipcRenderer.send('host:open-deck', slideId),
  openHome: (path) => ipcRenderer.send('host:open-home', path),
  setTheme: (theme) => ipcRenderer.send('host:set-theme', theme),
  haptic: (pattern) => ipcRenderer.send('host:haptic', pattern),
  printToPdf: (filename) => ipcRenderer.invoke('host:print-to-pdf', filename),
  onNavigate: (listener) => {
    listeners.add(listener);
    if (pending !== null) {
      const path = pending;
      pending = null;
      deliver(path);
    }
    return () => {
      listeners.delete(listener);
    };
  },
  guardUnsaved: (next) => {
    guard = next;
    return () => {
      if (guard === next) guard = null;
    };
  },
  onTranslucentChange: (listener) => {
    materialListeners.add(listener);
    // The page read the material it booted with; it may have changed since.
    if (translucent !== config.translucent) listener(translucent);
    return () => {
      materialListeners.delete(listener);
    };
  },
};

contextBridge.exposeInMainWorld('openSlideDesktop', host);
