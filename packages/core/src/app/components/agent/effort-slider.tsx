import { Sparkles, Zap } from 'lucide-react';
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { AgentEffort, AgentProviderId } from '../../../agent/types';

export function EffortSlider({
  levels,
  value,
  provider,
  onChange,
}: {
  levels: AgentEffort[];
  value: AgentEffort | null;
  provider: AgentProviderId;
  onChange: (next: AgentEffort | null) => void;
}) {
  const t = useLocale();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const last = levels.length - 1;
  const index = value ? levels.indexOf(value) : -1;
  const auto = index < 0;
  const settled = auto ? 0.5 : last > 0 ? index / last : 1;
  const progress = drag ?? settled;
  const peak = !auto && index === last && last > 0;

  const previous = useRef(index);
  const direction = index >= previous.current ? 'up' : 'down';
  useEffect(() => {
    previous.current = index;
  }, [index]);

  const select = (next: number) => {
    const clamped = Math.max(0, Math.min(last, next));
    if (clamped !== index) onChange(levels[clamped]);
  };

  const positionAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= THUMB) return settled;
    return Math.max(0, Math.min(1, (clientX - rect.left - THUMB / 2) / (rect.width - THUMB)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    const pos = positionAt(e.clientX);
    setDrag(pos);
    select(Math.round(pos * last));
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return;
    const pos = positionAt(e.clientX);
    setDrag(pos);
    select(Math.round(pos * last));
  };

  const endDrag = () => setDrag(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = auto ? Math.round(last / 2) : index;
    const step: Record<string, number> = {
      ArrowRight: from + 1,
      ArrowUp: from + 1,
      ArrowLeft: from - 1,
      ArrowDown: from - 1,
      PageUp: last,
      End: last,
      PageDown: 0,
      Home: 0,
    };
    if (!(e.key in step)) return;
    e.preventDefault();
    select(step[e.key]);
  };

  const label = auto ? t.agent.effortAuto : t.agent.efforts[levels[index]];

  return (
    <div
      className="effort-slider"
      data-agent-provider={provider}
      data-auto={auto || undefined}
      data-peak={peak || undefined}
      data-dragging={drag !== null || undefined}
      style={{ '--p': progress } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">{t.agent.reasoning}</span>
        <button
          type="button"
          aria-pressed={auto}
          onClick={() => onChange(null)}
          className={cn(
            'h-5 rounded-full px-2 text-[10.5px] font-medium text-muted-foreground outline-none transition-[background-color,color,transform] duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.96]',
            auto ? 'bg-foreground text-background hover:text-background' : 'bg-muted',
          )}
        >
          {t.agent.effortAuto}
        </button>
      </div>

      <div className="mt-1.5 h-5 overflow-hidden">
        <span
          key={label}
          data-direction={direction}
          className="effort-slider-label effort-slider-level block truncate text-[14px] leading-5 font-semibold tracking-tight"
        >
          {label}
        </span>
      </div>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={t.agent.reasoning}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={auto ? Math.round(last / 2) : index}
        aria-valuetext={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={onKeyDown}
        className="effort-slider-track"
      >
        <span aria-hidden className="effort-slider-rail" />
        <span aria-hidden className="effort-slider-glow" />
        <span aria-hidden className="effort-slider-fill" />
        {levels.map((level, i) => (
          <span
            key={level}
            aria-hidden
            className="effort-slider-tick"
            data-lit={(!auto && i <= index) || undefined}
            style={{ '--at': last > 0 ? i / last : 1 } as CSSProperties}
          />
        ))}
        <span aria-hidden className="effort-slider-thumb">
          {peak && <span key={index} className="effort-slider-burst" />}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap className="size-3" aria-hidden />
          {t.agent.effortFaster}
        </span>
        <span className="effort-slider-smarter flex items-center gap-1">
          {t.agent.effortSmarter}
          <Sparkles className="size-3" aria-hidden />
        </span>
      </div>
    </div>
  );
}

const THUMB = 16;
