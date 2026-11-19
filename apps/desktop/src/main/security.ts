import { session, type WebContents } from 'electron';

const TAB_PERMISSIONS = new Set(['fullscreen', 'clipboard-sanitized-write']);
const SHELL_PERMISSIONS = new Set(['clipboard-sanitized-write']);

type Pages = {
  isServerUrl: (url: string) => boolean;
  isHostPage: (contents: WebContents) => boolean;
  isShellPage: (contents: WebContents) => boolean;
};

export function restrictContents(contents: WebContents, isServerUrl: Pages['isServerUrl']) {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const guard = (e: Electron.Event, url: string) => {
    if (url.startsWith('devtools://') || isServerUrl(url)) return;
    e.preventDefault();
  };
  contents.on('will-navigate', (e) => guard(e, e.url));
  contents.on('will-redirect', (e) => guard(e, e.url));
  contents.on('will-attach-webview', (e) => e.preventDefault());
}

export function installPermissionPolicy(pages: Pages) {
  const permitted = (contents: WebContents | null, permission: string, origin: string) => {
    if (!contents) return false;
    if (pages.isHostPage(contents)) {
      return pages.isServerUrl(origin) && TAB_PERMISSIONS.has(permission);
    }
    return pages.isShellPage(contents) && SHELL_PERMISSIONS.has(permission);
  };
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(permitted(contents, permission, details.requestingUrl));
  });
  ses.setPermissionCheckHandler(permitted);
}
