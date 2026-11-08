import { desktop } from './desktop';

function report(error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  const registry = globalThis as { _posthogChunkIds?: Record<string, string> };
  desktop.reportError({
    name: err.name,
    message: err.message,
    stack: err.stack ?? null,
    chunkIds: registry._posthogChunkIds ?? null,
  });
}

window.addEventListener('error', (e) => report(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => report(e.reason));
