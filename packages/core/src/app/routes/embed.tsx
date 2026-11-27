import { ChevronLeft, ChevronRight, ExternalLink, Maximize, Minimize } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PresentProgressBar } from '@/components/present/progress-bar';
import { useIdle } from '@/components/present/use-idle';
import { useTouchSwipe } from '@/components/present/use-touch-swipe';
import { SlideCanvas } from '@/components/slide-canvas';
import { SlidePreloadLayer } from '@/components/slide-preload-layer';
import { SlideTransitionLayer } from '@/components/slide-transition-layer';
import {
  hasModifier,
  isBackwardKey,
  isForwardKey,
  isShortcutControlTarget,
  isTypingTarget,
} from '@/lib/keys';
import { deckUrl } from '@/lib/share-links';
import { formatLoadError } from '@/lib/slide-errors';
import type { EntryDirection, StepAggregate, StepController } from '@/lib/step-context';
import { useClickPageNavigation } from '@/lib/use-click-page-navigation';
import { useDocumentTitle } from '@/lib/use-document-title';
import { useLocale } from '@/lib/use-locale';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useSlideModule } from '@/lib/use-slide-module';
import { cn, pad2 } from '@/lib/utils';

const IDLE_HIDE_MS = 2000;

export function Embed() {
  const { slideId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { slide, error } = useSlideModule(slideId);
  const t = useLocale();
  const prefersReducedMotion = usePrefersReducedMotion();
  useDocumentTitle(slide?.meta?.title ?? slideId);

  const pages = slide?.default ?? [];
  const pageCount = pages.length;
  const [requestedIndex, setRequestedIndex] = useState(
    () => Math.trunc(Number(searchParams.get('p') ?? '1')) - 1,
  );
  const index = Number.isFinite(requestedIndex)
    ? Math.max(0, Math.min(pageCount - 1, requestedIndex))
    : 0;

  const rootRef = useRef<HTMLDivElement>(null);
  const stepControllerRef = useRef<StepController | null>(null);
  const [entryDirection, setEntryDirection] = useState<EntryDirection>('jump');
  const [steps, setSteps] = useState<StepAggregate>({ revealed: 0, stepCount: 0 });
  const handleStepsChange = useCallback((next: StepAggregate) => {
    setSteps((cur) =>
      cur.revealed === next.revealed && cur.stepCount === next.stepCount ? cur : next,
    );
  }, []);
  const canPrev = index > 0 || steps.revealed > 0;
  const canNext = index < pageCount - 1 || steps.revealed < steps.stepCount;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(pageCount - 1, next));
      if (clamped === index) return;
      const delta = clamped - index;
      setEntryDirection(delta === 1 ? 'forward' : delta === -1 ? 'backward' : 'jump');
      setRequestedIndex(clamped);
    },
    [index, pageCount],
  );
  const goNext = useCallback(() => {
    if (stepControllerRef.current?.advance()) return;
    goTo(index + 1);
  }, [goTo, index]);
  const goPrev = useCallback(() => {
    if (stepControllerRef.current?.retreat()) return;
    goTo(index - 1);
  }, [goTo, index]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || hasModifier(e)) return;
      if (e.key === ' ' && isShortcutControlTarget(e.target)) return;
      if (isForwardKey(e)) {
        e.preventDefault();
        goNext();
      } else if (isBackwardKey(e)) {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(pageCount - 1);
      } else if ((e.key === 'f' || e.key === 'F') && canFullscreen) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, goTo, pageCount, canFullscreen, toggleFullscreen]);

  useClickPageNavigation({
    ref: rootRef,
    canPrev: true,
    canNext: true,
    onPrev: goPrev,
    onNext: goNext,
  });
  useTouchSwipe({ ref: rootRef, onPrev: goPrev, onNext: goNext });

  // Starts engaged so viewers see the controls exist before they fade out.
  const [engaged, setEngaged] = useState(true);
  const idle = useIdle(IDLE_HIDE_MS);
  const [chromeFocused, setChromeFocused] = useState(false);
  const chromeVisible = chromeFocused || (engaged && !idle);

  if (error && !slide) {
    return (
      <EmbedFrame>
        <pre className="m-0 max-w-full overflow-auto p-6 font-mono text-[12px] whitespace-pre-wrap text-white/60">
          {formatLoadError(error)}
        </pre>
      </EmbedFrame>
    );
  }

  if (!slide) {
    return (
      <EmbedFrame>
        <div className="relative h-px w-40 overflow-hidden bg-white/15">
          <span
            aria-hidden
            className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-white/80"
          />
        </div>
      </EmbedFrame>
    );
  }

  if (pageCount === 0) {
    return (
      <EmbedFrame>
        <p className="text-[13px] text-white/60">{t.slide.nothingToShow}</p>
      </EmbedFrame>
    );
  }

  return (
    <div
      ref={rootRef}
      onPointerMove={() => setEngaged(true)}
      onPointerDown={() => setEngaged(true)}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setEngaged(false);
      }}
      className={cn(
        'fixed inset-0 flex items-center justify-center overflow-hidden bg-black select-none',
        !chromeVisible && 'cursor-none',
      )}
    >
      <div className="h-full w-full">
        <SlideCanvas flat design={slide.design}>
          <SlideTransitionLayer
            pages={pages}
            index={index}
            total={pageCount}
            moduleTransition={slide.transition}
            disabled={prefersReducedMotion}
            stepControllerRef={stepControllerRef}
            entryDirection={entryDirection}
            onStepAggregateChange={handleStepsChange}
          />
        </SlideCanvas>
      </div>
      <SlidePreloadLayer pages={pages} index={index} design={slide.design} />

      <div data-osd-chrome style={{ display: 'contents' }}>
        <PresentProgressBar index={index} total={pageCount} visible={chromeVisible} />
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-3',
            'motion-safe:transition-[translate,opacity] motion-safe:duration-200 motion-safe:ease-swift',
            chromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
        >
          <div
            role="toolbar"
            aria-label={slide.meta?.title ?? slideId}
            onFocus={(e) => setChromeFocused(e.target.matches(':focus-visible'))}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setChromeFocused(false);
            }}
            className={cn(
              'flex h-9 items-center gap-0.5 rounded-full border border-white/10 bg-black/60 px-1 text-white/85 shadow-[0_8px_30px_-8px_oklch(0_0_0/0.65)] backdrop-blur-md',
              chromeVisible ? 'pointer-events-auto' : 'pointer-events-none',
            )}
          >
            <EmbedButton label={t.present.prevSlideAria} onClick={goPrev} disabled={!canPrev}>
              <ChevronLeft className="size-4" />
            </EmbedButton>
            <span className="min-w-[3.75rem] px-1 text-center font-mono text-[11px] tracking-[0.08em] tabular-nums text-white/80">
              <span className="text-white">{pad2(index + 1)}</span>
              <span className="text-white/35"> / </span>
              <span>{pad2(pageCount)}</span>
            </span>
            <EmbedButton label={t.present.nextSlideAria} onClick={goNext} disabled={!canNext}>
              <ChevronRight className="size-4" />
            </EmbedButton>
            <span aria-hidden className="mx-0.5 h-3.5 w-px bg-white/15" />
            {canFullscreen && (
              <EmbedButton
                label={isFullscreen ? t.present.exitFullscreenAria : t.present.enterFullscreenAria}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </EmbedButton>
            )}
            <a
              href={deckUrl(import.meta.env.BASE_URL, slideId, index + 1)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.present.openInNewTabAria}
              title={t.present.openInNewTabAria}
              className={embedButtonClass}
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedFrame({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-black">{children}</div>
  );
}

const embedButtonClass = cn(
  'inline-flex size-7 shrink-0 touch-manipulation items-center justify-center rounded-full transition-[background-color,color,opacity,scale] duration-150',
  'text-white/85 hover:bg-white/12 hover:text-white focus-visible:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35',
  'active:scale-[0.94] disabled:pointer-events-none disabled:opacity-30',
);

function EmbedButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={embedButtonClass}
    >
      {children}
    </button>
  );
}
