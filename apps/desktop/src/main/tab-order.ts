// `to` is a gap in the strip as it is drawn, with the dragged tab still in
// place, so a move to the right lands one slot earlier once the tab is lifted
// out. Slot 0 belongs to Home.
export function moveTab<T>(tabs: readonly T[], from: number, to: number): T[] {
  const next = [...tabs];
  if (from < 1 || from >= next.length || !Number.isInteger(to)) return next;
  const [tab] = next.splice(from, 1);
  const index = from < to ? to - 1 : to;
  next.splice(Math.max(1, Math.min(index, next.length)), 0, tab);
  return next;
}
