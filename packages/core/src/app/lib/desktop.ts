import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DesktopHost, HapticPattern } from './desktop-host';
import { slideIds } from './slides';
import { hasUnsaved, settleUnsaved, unsavedStatus } from './unsaved';

declare global {
  interface Window {
    openSlideDesktop?: DesktopHost;
  }
}

export const desktopHost: DesktopHost | undefined =
  typeof window === 'undefined' ? undefined : window.openSlideDesktop;

if (desktopHost) {
  desktopHost.guardUnsaved?.({ status: unsavedStatus, settle: settleUnsaved });
  // Covers unloads the host does not start itself, such as a dev-server reload.
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsaved()) e.preventDefault();
  });
}

const DECK_PATH_RE = /^\/s\/([^/]+)\/?$/;
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(pathname: string): string {
  return BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
}

function deckIdFromPath(pathname: string): string | null {
  const m = DECK_PATH_RE.exec(stripBase(pathname));
  return m ? decodeURIComponent(m[1]) : null;
}

function isHomePath(pathname: string): boolean {
  return !stripBase(pathname).startsWith('/s/');
}

// True when the host took over, so the caller skips its own navigation.
export function openDeckInHost(slideId: string): boolean {
  if (!desktopHost) return false;
  desktopHost.openDeck(slideId);
  return true;
}

export function haptic(pattern: HapticPattern) {
  desktopHost?.haptic?.(pattern);
}

export function openHomeInHost(path?: string): boolean {
  if (!desktopHost) return false;
  desktopHost.openHome(path);
  return true;
}

function interceptLinkClick(host: DesktopHost, e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return;
  }
  const anchor = (e.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== '_self')) {
    return;
  }
  if (anchor.hasAttribute('download')) return;
  const url = new URL(anchor.href);
  if (url.origin !== window.location.origin) return;
  const currentDeck = deckIdFromPath(window.location.pathname);
  const targetDeck = deckIdFromPath(url.pathname);
  if (targetDeck && targetDeck !== currentDeck) {
    e.preventDefault();
    host.openDeck(targetDeck);
  } else if (currentDeck && isHomePath(url.pathname)) {
    e.preventDefault();
    host.openHome(stripBase(url.pathname) + url.search);
  }
}

export function DesktopBridge() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (!desktopHost) return;
    const host = desktopHost;
    const onClick = (e: MouseEvent) => interceptLinkClick(host, e);
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(
    () =>
      desktopHost?.onNavigate((path) => {
        // A pre-warmed page's slide list predates decks created after it booted.
        const deck = deckIdFromPath(path);
        if (deck && !slideIds.includes(deck)) {
          window.location.replace(`${BASE}${path}`);
          return;
        }
        navigate(path);
      }),
    [navigate],
  );

  useEffect(() => {
    if (theme) desktopHost?.setTheme(theme);
  }, [theme]);

  useEffect(
    () =>
      desktopHost?.onTranslucentChange?.((translucent) => {
        document.documentElement.toggleAttribute('data-translucent', translucent);
      }),
    [],
  );

  return null;
}
