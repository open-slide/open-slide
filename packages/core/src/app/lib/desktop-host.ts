export type HapticPattern = 'alignment' | 'levelChange' | 'generic';

// Drafts wait for an explicit Save; pending work is already on its way to disk
// and only needs time to land.
export type UnsavedStatus = { drafts: boolean; pending: boolean };

// `discard` drops drafts but still lets autosaved work land; `abandon` drops
// everything, for when the user chose to lose what could not be saved.
export type UnsavedAction = 'save' | 'discard' | 'abandon';

export type UnsavedOutcome = { ok: true } | { ok: false; error: string };

export type UnsavedGuard = {
  status: () => UnsavedStatus;
  settle: (action: UnsavedAction) => Promise<UnsavedOutcome>;
};

// Injected by the open-slide desktop app's preload into every tab. Home and
// each deck live in their own tab there, so moving between them asks the host
// to switch tabs instead of navigating this page. This file is the whole
// contract and imports nothing, so the desktop app type-checks its preload
// against it.
export type DesktopHost = {
  translucent: boolean;
  openDeck: (slideId: string) => void;
  openHome: (path?: string) => void;
  setTheme: (theme: string) => void;
  // Absent in desktop builds that predate trackpad haptics.
  haptic?: (pattern: HapticPattern) => void;
  // Saves the current page as a PDF via a native save dialog; resolves false
  // when the user cancels. Absent in desktop builds that predate it.
  printToPdf?: (filename: string) => Promise<boolean>;
  onNavigate: (listener: (path: string) => void) => () => void;
  // The host asks the guard before it closes or reloads this page, since
  // destroying a page runs no React cleanup. Absent in builds that predate it.
  guardUnsaved?: (guard: UnsavedGuard) => () => void;
  // Reports the window material being switched while the page is open.
  onTranslucentChange?: (listener: (translucent: boolean) => void) => () => void;
};
