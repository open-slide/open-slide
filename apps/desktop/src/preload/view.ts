import { contextBridge, ipcRenderer } from 'electron';

const config = ipcRenderer.sendSync('host:config') as { translucent: boolean };

// The contract core reads in packages/core/src/app/lib/desktop.ts.
contextBridge.exposeInMainWorld('openSlideDesktop', {
  translucent: config.translucent,
  openDeck: (slideId: string) => ipcRenderer.send('host:open-deck', slideId),
  openHome: (path?: string) => ipcRenderer.send('host:open-home', path),
  setTheme: (theme: string) => ipcRenderer.send('host:set-theme', theme),
  onNavigate: (listener: (path: string) => void) => {
    const wrapped = (_e: Electron.IpcRendererEvent, path: string) => listener(path);
    ipcRenderer.on('host:navigate', wrapped);
    return () => ipcRenderer.off('host:navigate', wrapped);
  },
});
