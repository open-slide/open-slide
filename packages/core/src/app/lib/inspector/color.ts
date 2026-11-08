export function rgbToHex(value: string): string | null {
  const m = value.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim());
  if (parts.length < 3) return null;
  const r = clampByte(Number(parts[0]));
  const g = clampByte(Number(parts[1]));
  const b = clampByte(Number(parts[2]));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
}

export function isTransparent(value: string): boolean {
  if (!value) return true;
  if (value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return true;
  return /^rgba\([^)]*,\s*0\)$/.test(value);
}

// Resolves any CSS color (tokens, `currentColor`, named colors) in the
// element's own context by letting the browser compute it on a probe.
export function resolveColor(context: HTMLElement, value: string): string | null {
  if (!value || value === 'none') return null;
  const probe = document.createElement('span');
  probe.style.color = value;
  if (!probe.style.color) return null;
  probe.style.display = 'none';
  context.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return isTransparent(computed) ? null : rgbToHex(computed);
}
