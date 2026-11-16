export type HapticPattern = 'alignment' | 'levelChange' | 'generic';

// Drafts wait for an explicit Save; pending work is already on its way to disk.
export type UnsavedStatus = { drafts: boolean; pending: boolean };

// `discard` drops drafts but lets autosaved work land; `abandon` drops everything.
export type UnsavedAction = 'save' | 'discard' | 'abandon';

export type UnsavedOutcome = { ok: true } | { ok: false; error: string };

export type UnsavedGuard = {
  status: () => UnsavedStatus;
  settle: (action: UnsavedAction) => Promise<UnsavedOutcome>;
};

// Injected by the desktop app's preload into every tab. This file imports
// nothing so the preload can type-check against it; optional members are
// missing in older desktop builds.
export type DesktopHost = {
  translucent: boolean;
  openDeck: (slideId: string) => void;
  openHome: (path?: string) => void;
  setTheme: (theme: string) => void;
  haptic?: (pattern: HapticPattern) => void;
  // Resolves false when the user cancels the save dialog.
  printToPdf?: (filename: string) => Promise<boolean>;
  onNavigate: (listener: (path: string) => void) => () => void;
  // Destroying a page runs no React cleanup, so the host asks before it closes or reloads one.
  guardUnsaved?: (guard: UnsavedGuard) => () => void;
  onTranslucentChange?: (listener: (translucent: boolean) => void) => () => void;
};
