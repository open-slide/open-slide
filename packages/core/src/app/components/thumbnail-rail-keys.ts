export function getThumbnailKeyTarget(key: string, index: number, count: number): number | null {
  if (count <= 0) return null;
  let target: number;
  switch (key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      target = index - 1;
      break;
    case 'ArrowDown':
    case 'ArrowRight':
      target = index + 1;
      break;
    case 'Home':
      target = 0;
      break;
    case 'End':
      target = count - 1;
      break;
    default:
      return null;
  }
  if (target < 0 || target >= count || target === index) return null;
  return target;
}
