export type SlideSourceHit = {
  file: string;
  line: number;
  column: number;
  anchor: HTMLElement;
};

export type FindSlideSourceOptions = {
  // Visual editor uses this: skip component-invocation JSX (`<MyComp/>`)
  // since most components don't forward `style`. Comments leave it off
  // so any JSX can be annotated.
  hostOnly?: boolean;
};

type FiberLike = {
  return: FiberLike | null;
  stateNode?: unknown;
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number };
  memoizedProps?: { __source?: { fileName?: string; lineNumber?: number; columnNumber?: number } };
};

export const DEFAULT_DECK_FILE = 'index.tsx';

export type SlideLoc = { file: string; line: number; column: number };

export function parseSlideLoc(loc: string): SlideLoc | null {
  const parts = loc.split(':');
  if (parts.length < 2) return null;
  const column = Number(parts[parts.length - 1]);
  const line = Number(parts[parts.length - 2]);
  const file = parts.length > 2 ? parts.slice(0, -2).join(':') : DEFAULT_DECK_FILE;
  if (!file || !Number.isFinite(line) || !Number.isFinite(column)) return null;
  return { file, line, column };
}

function escapeAttrValue(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

export function slideLocSelector(loc: SlideLoc): string {
  const full = `[data-slide-loc="${escapeAttrValue(`${loc.file}:${loc.line}:${loc.column}`)}"]`;
  if (loc.file !== DEFAULT_DECK_FILE) return full;
  return `${full}, [data-slide-loc="${loc.line}:${loc.column}"]`;
}

function getFiber(el: Element): FiberLike | null {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  if (!key) return null;
  return (el as unknown as Record<string, FiberLike>)[key] ?? null;
}

function getSource(fiber: FiberLike) {
  return fiber._debugSource ?? fiber.memoizedProps?.__source;
}

// `_debugSource.fileName` may carry Vite's HMR query (`?t=…`) and, on
// Windows, backslash separators. Both break the naive `endsWith` match.
function normalizeDebugFileName(fileName: string): string {
  return fileName.split(/[?#]/)[0].replace(/\\/g, '/');
}

export function findSlideSource(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions,
): SlideSourceHit | null {
  // Primary path: the `data-slide-loc` attribute injected by the
  // loc-tags Vite plugin. Immune to HMR-stale fiber state.
  const tagged = el.closest<HTMLElement>('[data-slide-loc]');
  if (tagged) {
    const loc = tagged.dataset.slideLoc;
    if (loc) {
      const parsed = parseSlideLoc(loc);
      if (parsed) return { ...parsed, anchor: tagged };
    }
  }

  // Fallback for JSX rendered from imported component files (which the
  // loc-tags plugin doesn't transform).
  const needle = `/slides/${slideId}/`;
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  while (fiber) {
    const src = getSource(fiber);
    const isHost = fiber.stateNode instanceof HTMLElement;
    const name = src?.fileName ? normalizeDebugFileName(src.fileName) : '';
    const at = name.lastIndexOf(needle);
    if (at >= 0 && name.endsWith('.tsx') && src?.lineNumber && (!opts?.hostOnly || isHost)) {
      return {
        file: name.slice(at + needle.length),
        line: src.lineNumber,
        column: src.columnNumber ?? 0,
        anchor: isHost ? (fiber.stateNode as HTMLElement) : anchor,
      };
    }
    if (isHost) {
      anchor = fiber.stateNode as HTMLElement;
    }
    fiber = fiber.return;
  }
  return null;
}
