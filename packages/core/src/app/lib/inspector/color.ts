import { parseColor, type Rgba, toHex } from '../pptx/css';

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
  return parseColor(value) ?? paintRgb(value);
}

export function rgbToHex(value: string): string | null {
  const rgba = toRgba(value);
  return rgba ? `#${toHex(rgba).toLowerCase()}` : null;
}

export function isTransparent(value: string): boolean {
  if (!value) return true;
  const rgba = toRgba(value);
  return rgba ? rgba.a === 0 : false;
}

export function opaqueHex(value: string): string | null {
  return isTransparent(value) ? null : rgbToHex(value);
}
