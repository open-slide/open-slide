import type { CSSProperties } from 'react';

export type SketchVariant = 'cover' | 'title' | 'chart' | 'image' | 'quote' | 'grid';

const INK = 'rgb(24 22 20 / 0.82)';
const FAINT = 'rgb(24 22 20 / 0.11)';
const ACCENT = '#fe5226';
const PHOTO = 'linear-gradient(150deg, #ffb48f 0%, #fe5226 55%, #8a2306 100%)';
const COVER = 'linear-gradient(170deg, #ff8a5e 0%, #fe5226 50%, #ee4316 100%)';

function Pill({ at, color }: { at: [number, number, number, number]; color: string }) {
  const [top, left, height, width] = at;
  return (
    <span
      className="absolute rounded-full"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        height: `${height}%`,
        width: `${width}%`,
        background: color,
      }}
    />
  );
}

// A wordless drawing of a slide layout, so decks read as decks at any size.
export function SlideSketch({
  variant,
  className = '',
  style,
}: {
  variant: SketchVariant;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`relative aspect-video overflow-hidden ${className}`}
      style={{ background: variant === 'cover' ? COVER : '#fdfcfa', ...style }}
    >
      {variant === 'cover' ? (
        <>
          <Pill at={[24, 9, 5, 14]} color="rgb(255 255 255 / 0.6)" />
          <Pill at={[38, 9, 12, 58]} color="#fff" />
          <Pill at={[55, 9, 12, 40]} color="#fff" />
          <span className="absolute -right-[10%] -bottom-[30%] aspect-square w-[46%] rounded-full bg-white/15" />
        </>
      ) : null}
      {variant === 'title' ? (
        <>
          <Pill at={[22, 9, 5, 14]} color={ACCENT} />
          <Pill at={[36, 9, 11, 62]} color={INK} />
          <Pill at={[52, 9, 11, 44]} color={INK} />
          <Pill at={[72, 9, 5, 36]} color={FAINT} />
        </>
      ) : null}
      {variant === 'chart' ? (
        <>
          <Pill at={[14, 9, 8, 38]} color={INK} />
          <Pill at={[27, 9, 5, 24]} color={FAINT} />
          {[34, 48, 42, 62, 78].map((h, i) => (
            <span
              key={h}
              className="absolute bottom-[14%] w-[9%] rounded-t-[3px]"
              style={{
                left: `${9 + i * 14}%`,
                height: `${h * 0.62}%`,
                background: i === 4 ? ACCENT : FAINT,
              }}
            />
          ))}
        </>
      ) : null}
      {variant === 'image' ? (
        <>
          <span className="absolute inset-y-0 left-0 w-[46%]" style={{ background: PHOTO }} />
          <Pill at={[26, 54, 5, 12]} color={ACCENT} />
          <Pill at={[38, 54, 9, 34]} color={INK} />
          <Pill at={[54, 54, 5, 36]} color={FAINT} />
          <Pill at={[64, 54, 5, 28]} color={FAINT} />
        </>
      ) : null}
      {variant === 'quote' ? (
        <>
          <Pill at={[18, 45.5, 18, 9]} color={ACCENT} />
          <Pill at={[46, 17, 9, 66]} color={INK} />
          <Pill at={[60, 26, 9, 48]} color={INK} />
          <Pill at={[77, 40, 5, 20]} color={FAINT} />
        </>
      ) : null}
      {variant === 'grid' ? (
        <>
          <Pill at={[14, 9, 8, 32]} color={INK} />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute top-[34%] h-[52%] w-[25%] rounded-[6%]"
              style={{ left: `${9 + i * 28}%`, background: FAINT }}
            >
              <span
                className="absolute top-[14%] left-[14%] aspect-square w-[22%] rounded-full"
                style={{ background: i === 1 ? ACCENT : 'rgb(24 22 20 / 0.22)' }}
              />
              <span
                className="absolute top-[56%] left-[14%] h-[9%] w-[64%] rounded-full"
                style={{ background: 'rgb(24 22 20 / 0.3)' }}
              />
            </span>
          ))}
        </>
      ) : null}
    </div>
  );
}
