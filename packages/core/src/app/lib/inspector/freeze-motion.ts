import { useEffect } from 'react';

export type FreezeMode = 'edit' | 'comment';

// Pauses slide animations and transitions while an overlay measures and
// hit-tests the canvas, so element rects stay put under the pointer.
export function useFreezeSlideMotion(mode: FreezeMode | null): void {
  useEffect(() => {
    if (!mode) return;
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;
    const style = document.createElement('style');
    style.textContent = FREEZE_CSS;
    document.head.appendChild(style);
    root.dataset.inspectorEditing = mode;
    return () => {
      style.remove();
      delete root.dataset.inspectorEditing;
    };
  }, [mode]);
}

const FREEZE_CSS = `
[data-inspector-editing] { touch-action: none; }
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *),
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::before,
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::after {
  animation-duration: 1ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: forwards !important;
  transition: none !important;
  view-transition-name: none !important;
  user-select: none;
}
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *, [data-visual-gesture], [data-visual-gesture] *),
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *, [data-visual-gesture], [data-visual-gesture] *)::before,
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *, [data-visual-gesture], [data-visual-gesture] *)::after {
  cursor: default !important;
}
[data-inspector-editing] [data-visual-gesture],
[data-inspector-editing] [data-visual-gesture] *,
[data-inspector-editing] [data-visual-gesture] *::before,
[data-inspector-editing] [data-visual-gesture] *::after {
  cursor: var(--osd-gesture-cursor, default) !important;
}
[data-inspector-editing="comment"] *:not([data-inspector-ui], [data-inspector-ui] *),
[data-inspector-editing="comment"] *:not([data-inspector-ui], [data-inspector-ui] *)::before,
[data-inspector-editing="comment"] *:not([data-inspector-ui], [data-inspector-ui] *)::after {
  cursor: crosshair !important;
}
`;
