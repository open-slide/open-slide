import { useSyncExternalStore } from 'react';
import type { Page } from './sdk';

export type SlideErrorKind = 'compile' | 'module' | 'render' | 'missing';

export type SlideErrorInfo = {
  kind: SlideErrorKind;
  message: string;
  file?: string;
  loc?: { line: number; column: number };
  frame?: string;
  stack?: string;
  componentStack?: string;
};

type ViteErrorPayload = {
  message?: string;
  stack?: string;
  id?: string;
  frame?: string;
  loc?: { file?: string; line: number; column: number };
};

const IMPORT_FAILURE_RE =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export function isImportFailure(error: unknown): boolean {
  return error instanceof Error && IMPORT_FAILURE_RE.test(error.message);
}

export function cleanDevUrls(text: string): string {
  return text
    .replace(/\bhttps?:\/\/[^\s/]+\/(?:[^\s]*?\/)?@fs\//g, '/')
    .replace(/\?t=\d+/g, '')
    .replace(/[?&]v=[0-9a-f]+/g, '');
}

// Oxc folds the code frame and position into `message` and leaves `loc` unset.
const FRAME_LOCATION_RE = /\[\s*([^\]\s]+):(\d+):(\d+)\s*\]/;
const TRANSFORM_PREFIX_RE = /^Transform failed with \d+ errors?:\s*/;

export function fromViteError(err: ViteErrorPayload): SlideErrorInfo {
  const file = err.loc?.file ?? err.id;
  const message = cleanDevUrls(err.message?.trim() ?? '').replace(TRANSFORM_PREFIX_RE, '');
  const framed = message.match(FRAME_LOCATION_RE);
  const loc = err.loc
    ? { line: err.loc.line, column: err.loc.column }
    : framed
      ? { line: Number(framed[2]), column: Number(framed[3]) }
      : undefined;
  return {
    kind: 'compile',
    message: message || 'Unknown compile error',
    file: file ? cleanDevUrls(file) : undefined,
    loc,
    frame: err.frame?.trim() || undefined,
    stack: err.stack?.trim() || undefined,
  };
}

export function parseViteErrorPage(html: string): ViteErrorPayload | null {
  const match = html.match(/const error = (\{.*\})\s*\n/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ViteErrorPayload;
  } catch {
    return null;
  }
}

let lastViteError: { at: number; err: ViteErrorPayload } | null = null;
const viteErrorWaiters = new Set<() => void>();
let suppressOverlayUntil = 0;

function clearViteOverlay() {
  for (const el of document.querySelectorAll('vite-error-overlay')) el.remove();
}

if (import.meta.hot) {
  import.meta.hot.on('vite:error', (payload: { err: ViteErrorPayload }) => {
    lastViteError = { at: Date.now(), err: payload.err };
    for (const wake of viteErrorWaiters) wake();
    // Vite mounts its overlay right after notifying listeners.
    if (Date.now() < suppressOverlayUntil) setTimeout(clearViteOverlay, 0);
  });
}

function recentViteError(since: number): ViteErrorPayload | null {
  return lastViteError && lastViteError.at >= since ? lastViteError.err : null;
}

function waitForViteError(since: number, ms: number): Promise<ViteErrorPayload | null> {
  const ready = recentViteError(since);
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      viteErrorWaiters.delete(done);
      resolve(recentViteError(since));
    };
    const timer = setTimeout(done, ms);
    viteErrorWaiters.add(done);
  });
}

async function fetchCompileError(error: Error): Promise<ViteErrorPayload | null> {
  const url = error.message.match(/\bhttps?:\/\/\S+/)?.[0];
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (res.ok) return null;
    return parseViteErrorPage(await res.text());
  } catch {
    return null;
  }
}

function errorStack(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.stack) return undefined;
  return cleanDevUrls(error.stack.trim());
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// The browser only reports "failed to fetch module"; the real transform error
// arrives via Vite's HMR channel or the 500 body of the failing module URL.
// The slide route shows that error itself, so Vite's overlay is dismissed.
export async function describeLoadError(error: unknown, since: number): Promise<SlideErrorInfo> {
  if (!isImportFailure(error)) {
    const message = errorMessage(error);
    // Thrown by the generated `loadSlide` in virtual:open-slide/slides.
    if (message.startsWith('Slide not found: ')) return { kind: 'missing', message };
    return { kind: 'module', message, stack: errorStack(error) };
  }
  if (import.meta.env.DEV) {
    suppressOverlayUntil = Date.now() + 2000;
    clearViteOverlay();
    const detail =
      (await waitForViteError(since, 300)) ?? (await fetchCompileError(error as Error));
    if (detail) return fromViteError(detail);
  }
  return { kind: 'compile', message: cleanDevUrls(errorMessage(error)) };
}

export function describeRenderError(error: unknown, componentStack?: string): SlideErrorInfo {
  return {
    kind: 'render',
    message: errorMessage(error),
    stack: errorStack(error),
    componentStack: componentStack ? cleanDevUrls(componentStack.trim()) : undefined,
  };
}

export function formatLocation(info: SlideErrorInfo, slidesDir?: string): string | null {
  if (!info.file) return null;
  let file = info.file;
  if (slidesDir) {
    const at = file.lastIndexOf(`/${slidesDir}/`);
    if (at !== -1) file = file.slice(at + 1);
  }
  return info.loc ? `${file}:${info.loc.line}:${info.loc.column}` : file;
}

export function formatLoadError(info: SlideErrorInfo): string {
  const parts = [info.message];
  const location = formatLocation(info);
  if (location) parts.push(location);
  if (info.frame) parts.push(info.frame);
  if (info.stack && info.kind !== 'compile') parts.push(info.stack);
  return parts.join('\n\n');
}

export function buildFixPrompt(
  info: SlideErrorInfo,
  opts: { slideId: string; slidesDir?: string; pageNumber?: number },
): string {
  const deck = `${opts.slidesDir ?? 'slides'}/${opts.slideId}/`;
  const what =
    info.kind === 'compile'
      ? `fails to compile`
      : info.kind === 'module'
        ? `throws while its module loads`
        : `throws while rendering page ${opts.pageNumber ?? '?'}`;
  const lines = [
    `The open-slide deck \`${deck}\` ${what}, so it can't be shown.`,
    'Find the root cause in the slide source and fix it so the deck renders again. Keep the content and design otherwise unchanged.',
    '',
    `Error: ${info.message}`,
  ];
  const location = formatLocation(info);
  if (location) lines.push(`File: ${location}`);
  if (info.frame) lines.push('', '```', info.frame, '```');
  if (info.stack && info.kind !== 'compile') lines.push('', 'Stack:', '```', info.stack, '```');
  if (info.componentStack) lines.push('', 'Component stack:', '```', info.componentStack, '```');
  return lines.join('\n');
}

const pageErrors = new WeakMap<Page, SlideErrorInfo>();
const listeners = new Set<() => void>();
let version = 0;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportPageError(page: Page, info: SlideErrorInfo): void {
  if (pageErrors.has(page)) return;
  pageErrors.set(page, info);
  version++;
  for (const l of listeners) l();
}

export function getPageError(page: Page | undefined): SlideErrorInfo | undefined {
  return page ? pageErrors.get(page) : undefined;
}

export function usePageErrorsVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}
