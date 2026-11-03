import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Injected by the open-slide desktop app's preload into every tab. Home and
// each deck live in their own tab there, so moving between them asks the host
// to switch tabs instead of navigating this page.
export type DesktopHost = {
  translucent: boolean;
  openDeck: (slideId: string) => void;
  openHome: (path?: string) => void;
  setTheme: (theme: string) => void;
  onNavigate: (listener: (path: string) => void) => () => void;
};

declare global {
  interface Window {
    openSlideDesktop?: DesktopHost;
  }
}

export const desktopHost: DesktopHost | undefined =
  typeof window === 'undefined' ? undefined : window.openSlideDesktop;

const DECK_PATH_RE = /^\/s\/([^/]+)\/?$/;

function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
}

export function deckIdFromPath(pathname: string): string | null {
  const m = DECK_PATH_RE.exec(stripBase(pathname));
  return m ? decodeURIComponent(m[1]) : null;
}

function isHomePath(pathname: string): boolean {
  return !stripBase(pathname).startsWith('/s/');
}

// Returns true when the host took over, so callers skip their own navigation.
export function openDeckInHost(slideId: string): boolean {
  if (!desktopHost) return false;
  desktopHost.openDeck(slideId);
  return true;
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

  useEffect(() => desktopHost?.onNavigate((path) => navigate(path)), [navigate]);

  useEffect(() => {
    if (theme) desktopHost?.setTheme(theme);
  }, [theme]);

  return null;
}
