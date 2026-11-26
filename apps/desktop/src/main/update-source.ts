import { app } from 'electron';
import electronUpdater from 'electron-updater';
import type { UpdateSource } from './updater';

function supported(): boolean {
  if (!app.isPackaged || process.env.OPEN_SLIDE_UPDATES === '0') return false;
  return process.platform !== 'linux' || !!process.env.APPIMAGE;
}

export function electronUpdateSource(): UpdateSource | null {
  if (!supported()) return null;
  const { autoUpdater } = electronUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  return {
    check: () =>
      autoUpdater.checkForUpdates().then((result) => {
        // Its failure is reported through the `error` event.
        result?.downloadPromise?.catch(() => {});
      }),
    install: () => autoUpdater.quitAndInstall(),
    subscribe: (handlers) => {
      autoUpdater.on('update-available', (info) => handlers.available(info.version));
      autoUpdater.on('download-progress', (progress) => handlers.progress(progress.percent));
      autoUpdater.on('update-not-available', () => handlers.none());
      autoUpdater.on('update-downloaded', (info) => handlers.downloaded(info.version));
      autoUpdater.on('error', (error) => handlers.error(error));
    },
  };
}
