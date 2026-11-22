import { type RefObject, useLayoutEffect } from 'react';

export function useAutoGrow(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  max: number,
): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the text changes
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.min(max, Math.max(40, node.scrollHeight))}px`;
  }, [ref, value, max]);
}
