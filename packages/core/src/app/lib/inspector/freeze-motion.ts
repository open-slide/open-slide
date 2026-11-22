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

// A speech-bubble pin with its tip at the bottom-left corner; the hotspot
// sits on that tip so the pointer "stamps" where the comment will land.
const COMMENT_CURSOR_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>",
  "<path d='M12 3a9 9 0 0 1 9 9a9 9 0 0 1-9 9H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 9-9z' ",
  "fill='#fff' stroke='#111' stroke-width='1.5' stroke-linejoin='round'/></svg>",
].join('');
const COMMENT_CURSOR = `url("data:image/svg+xml;utf8,${encodeURIComponent(COMMENT_CURSOR_SVG)}") 3 21, crosshair`;

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
  cursor: ${COMMENT_CURSOR} !important;
}
`;
