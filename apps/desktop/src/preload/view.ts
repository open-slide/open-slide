/// <reference lib="dom" />
import { contextBridge, ipcRenderer } from 'electron';
import { SPARE_PATH } from '../shared/types';

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

// The contract core reads in packages/core/src/app/lib/desktop.ts.
contextBridge.exposeInMainWorld('openSlideDesktop', {
  translucent: config.translucent,
  openDeck: (slideId: string) => ipcRenderer.send('host:open-deck', slideId),
  openHome: (path?: string) => ipcRenderer.send('host:open-home', path),
  setTheme: (theme: string) => ipcRenderer.send('host:set-theme', theme),
  haptic: (pattern: string) => ipcRenderer.send('host:haptic', pattern),
  printToPdf: (filename: string): Promise<boolean> =>
    ipcRenderer.invoke('host:print-to-pdf', filename),
  onNavigate: (listener: (path: string) => void) => {
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
});
