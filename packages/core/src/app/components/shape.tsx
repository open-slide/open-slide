import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ShapeKind } from '../lib/structure.ts';

export type { ShapeKind } from '../lib/structure.ts';

export type ShapeProps = {
  kind: ShapeKind;
  /** Any CSS color, including `var(--osd-accent)`. Defaults to none for lines. */
  fill?: string;
  stroke?: string;
  /** Stroke width in canvas px. */
  strokeWidth?: number;
  /** Corner radius for `rect`, in canvas px. */
  radius?: number;
  style?: CSSProperties;
  className?: string;
  /** Content drawn centered on top of the shape, such as a label. */
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'className' | 'children'>;

// The visual editor previews fill and stroke edits by writing these custom
// properties on the root before the new props are saved to source.
export const SHAPE_VARS = {
  fill: '--os-shape-fill',
  stroke: '--os-shape-stroke',
  strokeWidth: '--os-shape-stroke-width',
} as const;

type Point = [number, number];

function polygon(points: Point[]): string {
  return `M${points.map(([x, y]) => `${round(x)},${round(y)}`).join(' L')} Z`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function radial(count: number, w: number, h: number, inner?: number): Point[] {
  const points: Point[] = [];
  const steps = inner === undefined ? count : count * 2;
  for (let i = 0; i < steps; i++) {
    const r = inner !== undefined && i % 2 === 1 ? inner : 1;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / steps;
    points.push([w / 2 + (Math.cos(angle) * r * w) / 2, h / 2 + (Math.sin(angle) * r * h) / 2]);
  }
  return points;
}

// Paths are drawn in the box's own px so strokes keep their exact width no
// matter how the shape is stretched.
export function shapePath(kind: ShapeKind, w: number, h: number): string | null {
  switch (kind) {
    case 'triangle':
      return polygon([
        [w / 2, 0],
        [w, h],
        [0, h],
      ]);
    case 'right-triangle':
      return polygon([
        [0, 0],
        [w, h],
        [0, h],
      ]);
    case 'diamond':
      return polygon([
        [w / 2, 0],
        [w, h / 2],
        [w / 2, h],
        [0, h / 2],
      ]);
    case 'pentagon':
      return polygon(radial(5, w, h));
    case 'hexagon':
      return polygon([
        [w * 0.25, 0],
        [w * 0.75, 0],
        [w, h / 2],
        [w * 0.75, h],
        [w * 0.25, h],
        [0, h / 2],
      ]);
    case 'star':
      return polygon(radial(5, w, h, 0.382));
    case 'arrow': {
      const head = Math.min(w * 0.45, h * 0.9);
      return polygon([
        [0, h * 0.28],
        [w - head, h * 0.28],
        [w - head, 0],
        [w, h / 2],
        [w - head, h],
        [w - head, h * 0.72],
        [0, h * 0.72],
      ]);
    }
    case 'chevron': {
      const depth = Math.min(w * 0.35, h / 2);
      return polygon([
        [0, 0],
        [w - depth, 0],
        [w, h / 2],
        [w - depth, h],
        [0, h],
        [depth, h / 2],
      ]);
    }
    case 'callout': {
      const body = h * 0.8;
      const r = Math.min(w, body) * 0.12;
      const tail = Math.min(w * 0.18, body);
      return [
        `M${round(r)},0 H${round(w - r)} Q${round(w)},0 ${round(w)},${round(r)}`,
        `V${round(body - r)} Q${round(w)},${round(body)} ${round(w - r)},${round(body)}`,
        `H${round(w * 0.22 + tail)} L${round(w * 0.12)},${round(h)} L${round(w * 0.22)},${round(body)}`,
        `H${round(r)} Q0,${round(body)} 0,${round(body - r)} V${round(r)} Q0,0 ${round(r)},0 Z`,
      ].join(' ');
    }
    case 'line':
      return `M0,${round(h / 2)} H${round(w)}`;
    case 'line-arrow':
      return `M0,${round(h / 2)} H${round(w)}`;
    default:
      return null;
  }
}

function numericSize(value: CSSProperties['width']): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+(\.\d+)?px$/.test(value)) return Number.parseFloat(value);
  return null;
}

/**
 * A box with a filled and/or stroked outline. The visual editor inserts these
 * from its Shape menu; position and size come from `style` like any element.
 */
export function Shape({
  kind,
  fill,
  stroke,
  strokeWidth,
  radius,
  style,
  className,
  children,
  ...rest
}: ShapeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(() => ({
    width: numericSize(style?.width) ?? 0,
    height: numericSize(style?.height) ?? 0,
  }));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const next = { width: el.offsetWidth, height: el.offsetHeight };
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isLine = kind === 'line' || kind === 'line-arrow';
  const vars = {
    [SHAPE_VARS.fill]: fill ?? (isLine ? 'transparent' : 'currentColor'),
    [SHAPE_VARS.stroke]: stroke ?? 'transparent',
    [SHAPE_VARS.strokeWidth]: `${strokeWidth ?? (stroke ? 2 : 0)}px`,
  } as CSSProperties;

  const cssShape = kind === 'rect' || kind === 'ellipse';
  const box: CSSProperties = cssShape
    ? {
        boxSizing: 'border-box',
        background: `var(${SHAPE_VARS.fill})`,
        border: `var(${SHAPE_VARS.strokeWidth}) solid var(${SHAPE_VARS.stroke})`,
        borderRadius: kind === 'ellipse' ? '50%' : (radius ?? 0),
      }
    : {};

  const sw = strokeWidth ?? (stroke ? 2 : 0);
  const { width, height } = size;
  // Inset by half the stroke so the outline stays inside the box.
  const inset = isLine ? 0 : sw / 2;
  const path = cssShape
    ? null
    : shapePath(kind, Math.max(0, width - inset * 2), Math.max(0, height - inset * 2));
  const head = Math.max(sw * 3, 12);

  return (
    <div
      ref={ref}
      data-os-shape={kind}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...vars,
        ...box,
        ...style,
      }}
      {...rest}
    >
      {path && width > 0 && height > 0 && (
        <svg
          aria-hidden="true"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          <path
            d={path}
            transform={inset ? `translate(${inset} ${inset})` : undefined}
            style={{
              fill: isLine ? 'none' : `var(${SHAPE_VARS.fill})`,
              stroke: `var(${SHAPE_VARS.stroke})`,
              strokeWidth: `var(${SHAPE_VARS.strokeWidth})`,
              strokeLinejoin: 'round',
              strokeLinecap: 'round',
            }}
          />
          {kind === 'line-arrow' && (
            <path
              d={`M${round(width - head)},${round(height / 2 - head / 2)} L${round(width)},${round(height / 2)} L${round(width - head)},${round(height / 2 + head / 2)}`}
              style={{
                fill: 'none',
                stroke: `var(${SHAPE_VARS.stroke})`,
                strokeWidth: `var(${SHAPE_VARS.strokeWidth})`,
                strokeLinejoin: 'round',
                strokeLinecap: 'round',
              }}
            />
          )}
        </svg>
      )}
      {children !== undefined && <div style={{ position: 'relative' }}>{children}</div>}
    </div>
  );
}
