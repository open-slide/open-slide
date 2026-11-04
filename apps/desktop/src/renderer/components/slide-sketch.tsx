import { cn } from '@/lib/utils';

export type SketchVariant = 'title' | 'chart' | 'image' | 'quote' | 'cover' | 'grid';

const PAPER = {
  '--sk-bg': '#fdfcfa',
  '--sk-ink': 'rgb(24 22 20 / 0.82)',
  '--sk-faint': 'rgb(24 22 20 / 0.12)',
  '--sk-accent': '#fe5226',
  '--sk-photo': 'linear-gradient(150deg, #ffb48f 0%, #fe5226 55%, #8a2306 100%)',
} as const;

function Bar({ className, accent = false }: { className: string; accent?: boolean }) {
  return (
    <span
      className={cn('absolute rounded-full', className)}
      style={{ background: accent ? 'var(--sk-accent)' : 'var(--sk-faint)' }}
    />
  );
}

function Ink({ className }: { className: string }) {
  return (
    <span
      className={cn('absolute rounded-full', className)}
      style={{ background: 'var(--sk-ink)' }}
    />
  );
}

// A wordless drawing of a slide layout, so decks read as decks at any size.
export function SlideSketch({
  variant,
  className,
  style,
}: {
  variant: SketchVariant;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cover = variant === 'cover';
  return (
    <div
      aria-hidden
      className={cn('relative aspect-video overflow-hidden', className)}
      style={{
        ...PAPER,
        background: cover
          ? 'linear-gradient(170deg, #ff8a5e 0%, #fe5226 50%, #ee4316 100%)'
          : 'var(--sk-bg)',
        ...style,
      }}
    >
      {variant === 'title' && (
        <>
          <Bar accent className="top-[22%] left-[9%] h-[5%] w-[14%]" />
          <Ink className="top-[36%] left-[9%] h-[11%] w-[62%]" />
          <Ink className="top-[52%] left-[9%] h-[11%] w-[44%]" />
          <Bar className="top-[72%] left-[9%] h-[5%] w-[36%]" />
        </>
      )}
      {variant === 'chart' && (
        <>
          <Ink className="top-[14%] left-[9%] h-[8%] w-[38%]" />
          <Bar className="top-[27%] left-[9%] h-[5%] w-[24%]" />
          {[34, 48, 42, 62, 78].map((h, i) => (
            <span
              key={h}
              className="absolute bottom-[14%] w-[9%] rounded-t-[3px]"
              style={{
                left: `${9 + i * 14}%`,
                height: `${h * 0.62}%`,
                background: i === 4 ? 'var(--sk-accent)' : 'var(--sk-faint)',
              }}
            />
          ))}
          <Bar className="bottom-[10%] left-[9%] h-[1.5%] w-[68%]" />
        </>
      )}
      {variant === 'image' && (
        <>
          <span
            className="absolute inset-y-0 left-0 w-[46%]"
            style={{ background: 'var(--sk-photo)' }}
          />
          <Bar accent className="top-[26%] left-[54%] h-[5%] w-[12%]" />
          <Ink className="top-[38%] left-[54%] h-[9%] w-[34%]" />
          <Bar className="top-[54%] left-[54%] h-[5%] w-[36%]" />
          <Bar className="top-[64%] left-[54%] h-[5%] w-[28%]" />
        </>
      )}
      {variant === 'quote' && (
        <>
          <span
            className="absolute top-[18%] left-1/2 h-[18%] w-[9%] -translate-x-1/2 rounded-full"
            style={{ background: 'var(--sk-accent)' }}
          />
          <Ink className="top-[46%] left-1/2 h-[9%] w-[66%] -translate-x-1/2" />
          <Ink className="top-[60%] left-1/2 h-[9%] w-[48%] -translate-x-1/2" />
          <Bar className="top-[77%] left-1/2 h-[5%] w-[20%] -translate-x-1/2" />
        </>
      )}
      {cover && (
        <>
          <span className="absolute top-[24%] left-[9%] h-[5%] w-[14%] rounded-full bg-white/60" />
          <span className="absolute top-[38%] left-[9%] h-[12%] w-[58%] rounded-full bg-white" />
          <span className="absolute top-[55%] left-[9%] h-[12%] w-[40%] rounded-full bg-white" />
          <span className="absolute -right-[10%] -bottom-[30%] aspect-square w-[46%] rounded-full bg-white/15" />
        </>
      )}
      {variant === 'grid' && (
        <>
          <Ink className="top-[14%] left-[9%] h-[8%] w-[32%]" />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute top-[34%] h-[52%] w-[25%] rounded-[6%]"
              style={{ left: `${9 + i * 28}%`, background: 'var(--sk-faint)' }}
            >
              <span
                className="absolute top-[16%] left-[14%] aspect-square w-[22%] rounded-full"
                style={{ background: i === 1 ? 'var(--sk-accent)' : 'var(--sk-ink)' }}
              />
              <span
                className="absolute top-[58%] left-[14%] h-[9%] w-[64%] rounded-full"
                style={{ background: 'var(--sk-ink)', opacity: 0.6 }}
              />
              <span
                className="absolute top-[74%] left-[14%] h-[9%] w-[44%] rounded-full"
                style={{ background: 'var(--sk-ink)', opacity: 0.3 }}
              />
            </span>
          ))}
        </>
      )}
    </div>
  );
}
