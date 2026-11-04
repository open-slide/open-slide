import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron';
import type { ShellApi } from '../shared/types';

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const wrapped = (_e: IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.off(channel, wrapped);
}

const api: ShellApi = {
  getState: () => ipcRenderer.invoke('state:get'),
  onState: (listener) => subscribe('state', listener),
  onLog: (listener) => subscribe('log', listener),
  onCommand: (listener) => subscribe('command', listener),
  setOverlay: (open) => ipcRenderer.send('overlay:set', open),
  openExternal: (url) => ipcRenderer.send('external:open', url),
  sendCommand: (command) => ipcRenderer.send('shell:command', command),
  window: {
    isFocused: () => ipcRenderer.invoke('window:is-focused'),
    onFocus: (listener) => subscribe('window:focus', listener),
    fitContent: (height) => ipcRenderer.send('window:fit-content', height),
    openSettings: () => ipcRenderer.send('settings:open-window'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch) => ipcRenderer.invoke('settings:update', patch),
  },
  tabs: {
    activate: (id) => ipcRenderer.send('tabs:activate', id),
    close: (id) => ipcRenderer.send('tabs:close', id),
    move: (id, toIndex) => ipcRenderer.send('tabs:move', id, toIndex),
    showMenu: (id) => ipcRenderer.send('tabs:menu', id),
  },
  workspace: {
    choose: () => ipcRenderer.invoke('workspace:choose'),
    chooseParent: () => ipcRenderer.invoke('workspace:choose-parent'),
    defaultParent: () => ipcRenderer.invoke('workspace:default-parent'),
    packageManagers: () => ipcRenderer.invoke('workspace:package-managers'),
    open: (path) => ipcRenderer.invoke('workspace:open', path),
    create: (request) => ipcRenderer.invoke('workspace:create', request),
    install: () => ipcRenderer.invoke('workspace:install'),
    reveal: (path) => ipcRenderer.send('workspace:reveal', path),
    forget: (path) => ipcRenderer.send('workspace:forget', path),
  },
  server: {
    restart: () => ipcRenderer.send('server:restart'),
    log: () => ipcRenderer.invoke('server:log'),
  },
  agents: {
    list: () => ipcRenderer.invoke('agents:list'),
    login: (id) => ipcRenderer.invoke('agents:login', id),
    logout: (id) => ipcRenderer.invoke('agents:logout', id),
    sendLoginInput: (id, text) => ipcRenderer.send('agents:login-input', id, text),
    cancelLogin: (id) => ipcRenderer.send('agents:login-cancel', id),
    onLogin: (listener) => subscribe('agents:login-event', listener),
  },
};

contextBridge.exposeInMainWorld('desktop', api);
