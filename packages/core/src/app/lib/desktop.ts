import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DesktopHost, HapticPattern } from './desktop-host';
import { deckIdFromPath, isHomePath, stripBase } from './desktop-routes';
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

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

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
  const currentDeck = deckIdFromPath(window.location.pathname, BASE);
  const targetDeck = deckIdFromPath(url.pathname, BASE);
  if (targetDeck && targetDeck !== currentDeck) {
    e.preventDefault();
    host.openDeck(targetDeck);
  } else if (currentDeck && isHomePath(url.pathname, BASE)) {
    e.preventDefault();
    host.openHome(stripBase(url.pathname, BASE) + url.search);
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
        const deck = deckIdFromPath(path, BASE);
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
