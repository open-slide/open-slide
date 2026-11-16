type Rgba = { r: number; g: number; b: number; a: number };

const RGB_RE = /^rgba?\(([^)]+)\)$/;

function parseRgb(value: string): Rgba | null {
  const m = value.match(RGB_RE);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const alpha = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
  return {
    r: clampByte(Number(parts[0])),
    g: clampByte(Number(parts[1])),
    b: clampByte(Number(parts[2])),
    a: parts[3]?.endsWith('%') ? alpha / 100 : alpha,
  };
}

let painter: CanvasRenderingContext2D | null | undefined;
const painted = new Map<string, Rgba | null>();

// Computed styles keep oklch(), lab(), color() and the like as written, so
// anything that isn't rgb() is painted onto a pixel and read back as sRGB.
function paintRgb(value: string): Rgba | null {
  if (painted.has(value)) return painted.get(value) ?? null;
  if (painter === undefined) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      painter = canvas.getContext('2d', { willReadFrequently: true });
    } catch {
      painter = null;
    }
  }
  let result: Rgba | null = null;
  if (painter && typeof CSS !== 'undefined' && CSS.supports('color', value)) {
    painter.clearRect(0, 0, 1, 1);
    painter.fillStyle = value;
    painter.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = painter.getImageData(0, 0, 1, 1).data;
    result = { r, g, b, a: a / 255 };
  }
  if (painted.size >= 256) painted.clear();
  painted.set(value, result);
  return result;
}

function toRgba(value: string): Rgba | null {
  if (!value) return null;
  return parseRgb(value) ?? paintRgb(value);
}

export function rgbToHex(value: string): string | null {
  const rgba = toRgba(value);
  if (!rgba) return null;
  return `#${[rgba.r, rgba.g, rgba.b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
}

export function isTransparent(value: string): boolean {
  if (!value || value === 'transparent') return true;
  const rgba = toRgba(value);
  return rgba ? rgba.a === 0 : false;
}
