export type SlideSourceHit = {
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
  alternate?: FiberLike | null;
  _debugOwner?: FiberLike | null;
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number };
  memoizedProps?: {
    __source?: { fileName?: string; lineNumber?: number; columnNumber?: number };
    'data-slide-call'?: unknown;
  };
};

function getFiber(el: Element): FiberLike | null {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  if (!key) return null;
  return (el as unknown as Record<string, FiberLike>)[key] ?? null;
}

// The node caches the fiber it was created with, which may be the stale
// alternate after an update; the committed one holds the node's props.
function getCommittedFiber(el: Element): FiberLike | null {
  const fiber = getFiber(el);
  if (!fiber?.alternate) return fiber;
  const key = Object.keys(el).find((k) => k.startsWith('__reactProps$'));
  const props = key ? (el as unknown as Record<string, unknown>)[key] : undefined;
  return fiber.alternate.memoizedProps === props ? fiber.alternate : fiber;
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
      const idx = loc.indexOf(':');
      if (idx > 0) {
        const line = Number(loc.slice(0, idx));
        const column = Number(loc.slice(idx + 1));
        if (Number.isFinite(line) && Number.isFinite(column)) {
          return { line, column, anchor: tagged };
        }
      }
    }
  }

  // Fallback for JSX rendered from imported component files (which the
  // loc-tags plugin doesn't transform).
  const needle = `/slides/${slideId}/index.tsx`;
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  while (fiber) {
    const src = getSource(fiber);
    const isHost = fiber.stateNode instanceof HTMLElement;
    if (
      src?.fileName &&
      normalizeDebugFileName(src.fileName).endsWith(needle) &&
      src.lineNumber &&
      (!opts?.hostOnly || isHost)
    ) {
      return {
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

function parseLoc(loc: unknown): { line: number; column: number } | null {
  if (typeof loc !== 'string') return null;
  const idx = loc.indexOf(':');
  if (idx <= 0) return null;
  const line = Number(loc.slice(0, idx));
  const column = Number(loc.slice(idx + 1));
  return Number.isFinite(line) && Number.isFinite(column) ? { line, column } : null;
}

// Source location of the outermost `<Component/>` call (stamped as
// `data-slide-call` by the loc-tags plugin) whose definition rendered
// `el`. Follows owners rather than parents, so JSX passed in as children
// stays with the call site that wrote it.
export function findCallSite(el: HTMLElement): { line: number; column: number } | null {
  let owner = getCommittedFiber(el)?._debugOwner ?? null;
  let call: { line: number; column: number } | null = null;
  while (owner) {
    const loc = parseLoc(owner.memoizedProps?.['data-slide-call']);
    if (!loc) break;
    call = loc;
    owner = owner._debugOwner ?? null;
  }
  return call;
}

export function findCallAnchor(
  root: HTMLElement,
  call: { line: number; column: number },
): HTMLElement | null {
  for (const element of root.querySelectorAll<HTMLElement>('[data-slide-loc]')) {
    const hit = findCallSite(element);
    if (hit?.line === call.line && hit.column === call.column) return element;
  }
  return null;
}
