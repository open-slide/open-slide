import { cn } from '@/lib/utils';

export type SketchVariant = 'title' | 'chart' | 'image' | 'quote' | 'cover' | 'grid' | 'list';

const PAPER = {
  '--sk-bg': '#fdfcfa',
  '--sk-ink': 'rgb(24 22 20 / 0.82)',
  '--sk-faint': 'rgb(24 22 20 / 0.12)',
  '--sk-accent': '#fe5226',
  '--sk-photo': 'linear-gradient(150deg, #ffb48f 0%, #fe5226 55%, #8a2306 100%)',
} as const;

const TONE = {
  ink: 'bg-(--sk-ink)',
  faint: 'bg-(--sk-faint)',
  accent: 'bg-(--sk-accent)',
} as const;

function Mark({ tone = 'faint', className }: { tone?: keyof typeof TONE; className: string }) {
  return <span className={cn('absolute rounded-full', TONE[tone], className)} />;
}

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
          <Mark tone="accent" className="top-[22%] left-[9%] h-[5%] w-[14%]" />
          <Mark tone="ink" className="top-[36%] left-[9%] h-[11%] w-[62%]" />
          <Mark tone="ink" className="top-[52%] left-[9%] h-[11%] w-[44%]" />
          <Mark className="top-[72%] left-[9%] h-[5%] w-[36%]" />
        </>
      )}
      {variant === 'chart' && (
        <>
          <Mark tone="ink" className="top-[14%] left-[9%] h-[8%] w-[38%]" />
          <Mark className="top-[27%] left-[9%] h-[5%] w-[24%]" />
          {[34, 48, 42, 62, 78].map((h, i) => (
            <span
              key={h}
              className={cn(
                'absolute bottom-[14%] w-[9%] rounded-t-[3px]',
                i === 4 ? TONE.accent : TONE.faint,
              )}
              style={{ left: `${9 + i * 14}%`, height: `${h * 0.62}%` }}
            />
          ))}
          <Mark className="bottom-[10%] left-[9%] h-[1.5%] w-[68%]" />
        </>
      )}
      {variant === 'image' && (
        <>
          <span className="absolute inset-y-0 left-0 w-[46%] [background:var(--sk-photo)]" />
          <Mark tone="accent" className="top-[26%] left-[54%] h-[5%] w-[12%]" />
          <Mark tone="ink" className="top-[38%] left-[54%] h-[9%] w-[34%]" />
          <Mark className="top-[54%] left-[54%] h-[5%] w-[36%]" />
          <Mark className="top-[64%] left-[54%] h-[5%] w-[28%]" />
        </>
      )}
      {variant === 'quote' && (
        <>
          <Mark tone="accent" className="top-[18%] left-1/2 h-[18%] w-[9%] -translate-x-1/2" />
          <Mark tone="ink" className="top-[46%] left-1/2 h-[9%] w-[66%] -translate-x-1/2" />
          <Mark tone="ink" className="top-[60%] left-1/2 h-[9%] w-[48%] -translate-x-1/2" />
          <Mark className="top-[77%] left-1/2 h-[5%] w-[20%] -translate-x-1/2" />
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
      {variant === 'list' && (
        <>
          <Mark tone="ink" className="top-[17%] left-[9%] h-[9%] w-[42%]" />
          {[54, 44, 50].map((width, i) => (
            <span
              key={width}
              className="absolute left-[9%] flex h-[6%] items-center gap-[5%]"
              style={{ top: `${41 + i * 15}%`, width: `${width}%` }}
            >
              <span className={cn('aspect-square h-full rounded-full', TONE.accent)} />
              <span className={cn('h-[72%] flex-1 rounded-full', TONE.faint)} />
            </span>
          ))}
        </>
      )}
      {variant === 'grid' && (
        <>
          <Mark tone="ink" className="top-[14%] left-[9%] h-[8%] w-[32%]" />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn('absolute top-[34%] h-[52%] w-[25%] rounded-[6%]', TONE.faint)}
              style={{ left: `${9 + i * 28}%` }}
            >
              <Mark
                tone={i === 1 ? 'accent' : 'ink'}
                className="top-[16%] left-[14%] aspect-square w-[22%]"
              />
              <Mark tone="ink" className="top-[58%] left-[14%] h-[9%] w-[64%] opacity-60" />
              <Mark tone="ink" className="top-[74%] left-[14%] h-[9%] w-[44%] opacity-30" />
            </span>
          ))}
        </>
      )}
    </div>
  );
}
