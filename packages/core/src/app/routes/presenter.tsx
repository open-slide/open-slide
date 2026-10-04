import {
  AArrowDown,
  AArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Square,
  Sun,
} from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { hasModifier, isBackwardKey, isForwardKey, isTypingTarget } from '@/lib/keys';
import { useDocumentTitle } from '@/lib/use-document-title';
import { format, useLocale } from '@/lib/use-locale';
import { useNow } from '@/lib/use-now';
import { cn, formatClock, pad2 } from '@/lib/utils';
import { NoteMarkdown } from '../components/note-markdown';
import {
  createPageTimes,
  type PageTimes,
  pageBudget,
  pageElapsedMs,
  scheduleDeltaMs,
} from '../components/present/page-timer';
import {
  type PresenterState,
  usePresenterChannel,
} from '../components/present/use-presenter-channel';
import { SlideCanvas } from '../components/slide-canvas';
import { isDeckWarmed, markDeckWarmed, SlidePreloadLayer } from '../components/slide-preload-layer';
import { SlidePageProvider } from '../lib/page-context';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from '../lib/sdk';
import { loadSlide, slideIds } from '../lib/slides';
import { type StepController, StepHost } from '../lib/step-context';
import { useSlideModule } from '../lib/use-slide-module';

export function Presenter() {
  const { slideId = '' } = useParams();
  const { slide, error } = useSlideModule(slideId);
  useDocumentTitle(slide?.meta?.title);

  // Presenter view is a passive mirror of the projection window. It only
  // tracks the index it last heard about; navigation buttons send commands
  // back to the projection so both windows stay in lock-step.
  const [state, setState] = useState<PresenterState | null>(null);
  // Local timer fallback — counts up from when the presenter window opened
  // until the projection window publishes its actual `startedAt`.
  const [localStart, setLocalStart] = useState(() => Date.now());
  const [localPageTimes, setLocalPageTimes] = useState(() => createPageTimes(localStart));
  const [hasProjection, setHasProjection] = useState(false);
  const requestedRef = useRef(false);
  const t = useLocale();
  const [, setWarmedTick] = useState(0);
  const handleAssetsWarmed = useCallback(() => {
    markDeckWarmed(slideId);
    setWarmedTick((n) => n + 1);
  }, [slideId]);

  const channel = usePresenterChannel(slideId, (msg) => {
    if (msg.type === 'state') {
      setState(msg.state);
      setHasProjection(true);
    }
  });

  // A deck switch reuses this route instance, so the handshake state from
  // the previous deck must be dropped before rejoining on the new channel.
  // Render-phase reset so the new deck never renders with the old state.
  // Until the projection answers, the fallbacks mirror what it does on a
  // switch: the talk clock keeps running and the page timers start over.
  const prevSlideIdRef = useRef(slideId);
  if (prevSlideIdRef.current !== slideId) {
    prevSlideIdRef.current = slideId;
    if (state) setLocalStart(state.startedAt);
    setLocalPageTimes(createPageTimes(Date.now()));
    setState(null);
    setHasProjection(false);
    requestedRef.current = false;
  }

  // Hydrate from the projection window once.
  // biome-ignore lint/correctness/useExhaustiveDependencies: slideId re-fires the handshake on a deck switch even when the channel memo keeps its identity (available toggling false→true in one commit nets to no change)
  useEffect(() => {
    if (!channel.available || requestedRef.current) return;
    requestedRef.current = true;
    channel.send({ type: 'request-state' });
  }, [channel, slideId]);

  const navigate = useNavigate();
  const send = channel.send;
  const switchDeck = useCallback(
    (id: string) => {
      if (id === slideId) return;
      send({ type: 'switch-slide', slideId: id });
      navigate(`/s/${encodeURIComponent(id)}/presenter`, { replace: true });
    },
    [slideId, send, navigate],
  );
  const goPrev = useCallback(() => send({ type: 'prev' }), [send]);
  const goNext = useCallback(() => send({ type: 'next' }), [send]);
  const goTo = useCallback((i: number) => send({ type: 'goto', index: i }), [send]);
  const toggleBlack = useCallback(() => send({ type: 'toggle-blackout', mode: 'black' }), [send]);
  const toggleWhite = useCallback(() => send({ type: 'toggle-blackout', mode: 'white' }), [send]);
  // Also re-requests state so Reset doubles as a way to rejoin a projection
  // whose initial reply this window missed.
  const resetTimer = useCallback(() => {
    const now = Date.now();
    setLocalStart(now);
    setLocalPageTimes(createPageTimes(now));
    send({ type: 'reset-timer' });
    send({ type: 'request-state' });
  }, [send]);

  // Local-window key bindings mirror the projection's main shortcuts so the
  // presenter can drive without the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The deck-switcher menu owns its own arrow-key navigation.
      if (e.defaultPrevented) return;
      if (isTypingTarget(e.target)) return;
      if (hasModifier(e)) return;
      if (isForwardKey(e)) {
        e.preventDefault();
        goNext();
      } else if (isBackwardKey(e)) {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBlack();
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        toggleWhite();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, toggleBlack, toggleWhite]);

  if (error) {
    return (
      <div className="dark grid h-dvh place-items-center bg-background p-8 text-foreground">
        <div className="max-w-md text-center">
          <span className="eyebrow text-destructive/80">{t.common.loadFailed}</span>
          <h2 className="mt-2 font-heading text-xl font-semibold">{t.common.failedToLoadSlide}</h2>
          <pre className="mt-4 overflow-auto rounded-[6px] border border-border bg-card p-4 text-left text-[11.5px] whitespace-pre-wrap shadow-edge">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="dark grid h-dvh place-items-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-px w-56 overflow-hidden bg-border">
            <span
              aria-hidden
              className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
            />
          </div>
          <div className="text-[11.5px]">{format(t.presenter.loadingSlide, { slideId })}</div>
        </div>
      </div>
    );
  }

  const pages = slide.default;
  const total = pages.length;
  const index = Math.max(0, Math.min(total - 1, state?.index ?? 0));
  const note = slide.notes?.[index];
  const blackout = state?.blackout ?? null;
  const startedAt = state?.startedAt ?? localStart;
  const pageTimes = state?.pageTimes ?? localPageTimes;
  const stepIndex = Math.max(0, state?.stepIndex ?? 0);
  const stepCount = Math.max(0, state?.stepCount ?? 0);

  const stepsRemaining = stepIndex < stepCount;
  const hasNextSlide = index < total - 1;
  const hasNext = stepsRemaining || hasNextSlide;
  const nextPageIndex = stepsRemaining ? index : Math.min(total - 1, index + 1);
  const nextRevealed = stepsRemaining ? stepIndex + 1 : 0;

  const CurrentPage = pages[index];
  const NextPage = hasNext ? pages[nextPageIndex] : null;

  // Hold the loader while a hidden layer warms the whole deck's images and
  // fonts, so the previews first paint with every asset already in cache.
  if (!isDeckWarmed(slideId)) {
    return (
      <div className="dark grid h-dvh place-items-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-px w-56 overflow-hidden bg-border">
            <span
              aria-hidden
              className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
            />
          </div>
          <div className="text-[11.5px]">{t.presenter.loadingAssets}</div>
        </div>
        <SlidePreloadLayer
          pages={pages}
          index={index}
          design={slide.design}
          includeCurrent
          onDone={handleAssetsWarmed}
        />
      </div>
    );
  }

  return (
    <div className="dark flex h-dvh w-screen flex-col overflow-hidden bg-background text-foreground">
      <PresenterTopBar
        index={index}
        total={total}
        startedAt={startedAt}
        pageTimes={pageTimes}
        durations={slide.durations}
        slideId={slideId}
        slideTitle={slide.meta?.title ?? slideId}
        connected={hasProjection}
        onSwitchDeck={switchDeck}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 px-6 pb-4 lg:grid-cols-[2fr_1fr]">
        <NowShowing
          pageTimes={pageTimes}
          index={index}
          budget={pageBudget(slide.durations, index)}
          showBudget={slide.durations !== undefined}
        >
          <SlideCanvas flat design={slide.design}>
            <SlidePageProvider index={index} total={total}>
              <PreviewStepHost revealed={stepIndex}>
                <CurrentPage />
              </PreviewStepHost>
            </SlidePageProvider>
          </SlideCanvas>
          {blackout && (
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 grid place-items-center text-[11px] tracking-[0.08em] uppercase',
                'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150',
                blackout === 'black' ? 'bg-black text-white/35' : 'bg-white text-black/35',
              )}
            >
              {blackout === 'black' ? t.presenter.blackScreen : t.presenter.whiteScreen}
            </div>
          )}
        </NowShowing>

        {/* Next + notes */}
        <aside className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <SectionLabel>{hasNext ? t.presenter.upNext : t.presenter.lastSlide}</SectionLabel>
            <div
              className="relative w-full overflow-hidden rounded-[8px] bg-black ring-1 ring-border"
              style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
            >
              {NextPage ? (
                <SlideCanvas flat freezeMotion design={slide.design}>
                  <SlidePageProvider index={nextPageIndex} total={total}>
                    <PreviewStepHost revealed={nextRevealed}>
                      <NextPage />
                    </PreviewStepHost>
                  </SlidePageProvider>
                </SlideCanvas>
              ) : (
                <div className="grid h-full place-items-center text-[11.5px] text-muted-foreground">
                  {t.presenter.endOfDeck}
                </div>
              )}
            </div>
          </div>

          <SpeakerNotes note={note} />

          <PresenterJumpControl total={total} current={index} onJump={goTo} />
        </aside>
      </div>

      <PresenterBottomBar
        index={index}
        total={total}
        blackout={blackout}
        onPrev={goPrev}
        onNext={goNext}
        onBlackout={toggleBlack}
        onWhiteout={toggleWhite}
        onReset={resetTimer}
      />
    </div>
  );
}

// The canvas arrives as `children` so the once-a-second tick re-renders only
// this frame's chrome, not the slide preview inside it.
function NowShowing({
  pageTimes,
  index,
  budget,
  showBudget,
  children,
}: {
  pageTimes: PageTimes;
  index: number;
  budget: number | undefined;
  showBudget: boolean;
  children: ReactNode;
}) {
  const t = useLocale();
  const now = useNow(showBudget);
  const elapsed = Math.floor(pageElapsedMs(pageTimes, index, now) / 1000);
  const over = budget !== undefined && elapsed > budget;
  const pct = budget ? Math.min(1, elapsed / budget) : 0;
  return (
    <section className="flex min-h-0 flex-col gap-3">
      <SectionLabel>{t.presenter.nowShowing}</SectionLabel>
      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden rounded-[8px] bg-black',
          over ? 'ring-2 ring-destructive' : 'ring-1 ring-border',
        )}
      >
        {children}
      </div>
      {showBudget && (
        <div className="flex h-5 items-center gap-3">
          <SectionLabel>{t.presenter.slideTime}</SectionLabel>
          {budget !== undefined && (
            <div
              role="progressbar"
              aria-label={t.presenter.slideTime}
              aria-valuemin={0}
              aria-valuemax={budget}
              aria-valuenow={Math.min(budget, elapsed)}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10"
            >
              <div
                key={index}
                className={cn(
                  'h-full w-full origin-left motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-linear',
                  over ? 'bg-destructive' : 'bg-foreground/60',
                )}
                style={{ transform: `scaleX(${pct})` }}
              />
            </div>
          )}
          <span
            className={cn(
              'ml-auto font-mono text-[12px] tabular-nums',
              over ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {formatClock(elapsed)}
            {budget !== undefined && ` / ${formatClock(budget)}`}
          </span>
          {over && budget !== undefined && (
            <span
              title={format(t.presenter.overBudget, { time: formatClock(elapsed - budget) })}
              className="rounded-[3px] border border-destructive/40 bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-destructive"
            >
              +{formatClock(elapsed - budget)}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function PresenterTopBar({
  index,
  total,
  startedAt,
  pageTimes,
  durations,
  slideId,
  slideTitle,
  connected,
  onSwitchDeck,
}: {
  index: number;
  total: number;
  startedAt: number;
  pageTimes: PageTimes;
  durations: (number | undefined)[] | undefined;
  slideId: string;
  slideTitle: string;
  connected: boolean;
  onSwitchDeck: (slideId: string) => void;
}) {
  const t = useLocale();
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-hairline px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="eyebrow text-white/45">{t.presenter.eyebrow}</span>
        {slideIds.length > 1 ? (
          <DeckSwitcher slideId={slideId} slideTitle={slideTitle} onSwitchDeck={onSwitchDeck} />
        ) : (
          <span className="truncate font-heading text-[14px] font-semibold tracking-tight">
            {slideTitle}
          </span>
        )}
        {!connected && (
          <span className="rounded-[3px] border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] uppercase text-amber-200/85">
            {t.presenter.notLinked}
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        <Clock />
        {durations && <ScheduleDelta pageTimes={pageTimes} durations={durations} index={index} />}
        <ElapsedClock startedAt={startedAt} />
        <div className="font-mono text-[18px] tabular-nums">
          <span className="text-foreground">{pad2(index + 1)}</span>
          <span className="text-foreground/30"> / </span>
          <span className="text-muted-foreground">{pad2(total)}</span>
        </div>
      </div>
    </header>
  );
}

// Listing decks means importing every deck's chunk for its meta and pages.
// That warms the module cache for switches; assets only load on render, so
// this stays cheap.
function useDeckModules(): Record<string, SlideModule> {
  const [modules, setModules] = useState<Record<string, SlideModule>>({});
  useEffect(() => {
    let cancelled = false;
    for (const id of slideIds) {
      loadSlide(id)
        .then((mod) => {
          if (cancelled) return;
          setModules((cur) => (cur[id] === mod ? cur : { ...cur, [id]: mod }));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, []);
  return modules;
}

function DeckSwitcher({
  slideId,
  slideTitle,
  onSwitchDeck,
}: {
  slideId: string;
  slideTitle: string;
  onSwitchDeck: (slideId: string) => void;
}) {
  const t = useLocale();
  const modules = useDeckModules();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const trimmed = query.trim().toLowerCase();
  const filtered = slideIds.filter((id) => {
    if (!trimmed) return true;
    const title = modules[id]?.meta?.title;
    return id.toLowerCase().includes(trimmed) || title?.toLowerCase().includes(trimmed);
  });
  const active = Math.min(activeIndex, Math.max(0, filtered.length - 1));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery('');
      setActiveIndex(0);
    }
  };

  const select = (id: string) => {
    setOpen(false);
    onSwitchDeck(id);
  };

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(Math.min(filtered.length - 1, active + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(Math.max(0, active - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const id = filtered[active];
      if (id) select(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        aria-label={t.presenter.switchDeck}
        title={t.presenter.switchDeck}
        className="group -mx-1.5 flex min-w-0 items-center gap-1 rounded-[5px] px-1.5 py-0.5 outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <span className="truncate font-heading text-[14px] font-semibold tracking-tight">
          {slideTitle}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="dark top-[16%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">{t.presenter.switchDeck}</DialogTitle>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onSearchKeyDown}
          placeholder={t.presenter.searchDecks}
          className="w-full border-b border-hairline bg-transparent px-4 py-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-[12px] text-muted-foreground">
              {t.presenter.noDecksFound}
            </div>
          ) : (
            filtered.map((id, i) => {
              const mod = modules[id];
              const FirstPage = mod?.default[0];
              return (
                <button
                  type="button"
                  key={id}
                  data-index={i}
                  onClick={() => select(id)}
                  onMouseMove={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[6px] p-2 text-left outline-none transition-[background-color,scale] duration-100 active:scale-[0.99] focus-visible:ring-1 focus-visible:ring-ring/40',
                    i === active && 'bg-muted',
                  )}
                >
                  <div
                    className="w-24 shrink-0 overflow-hidden rounded-[4px] bg-black ring-1 ring-border"
                    style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
                  >
                    {FirstPage && (
                      <SlideCanvas flat freezeMotion design={mod.design}>
                        <SlidePageProvider index={0} total={mod.default.length}>
                          <PreviewStepHost revealed={0}>
                            <FirstPage />
                          </PreviewStepHost>
                        </SlidePageProvider>
                      </SlideCanvas>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-foreground">
                      {mod?.meta?.title ?? id}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[10.5px] tabular-nums text-muted-foreground">
                      {id}
                      {mod && ` · ${pad2(mod.default.length)}`}
                    </div>
                  </div>
                  {id === slideId && <Check className="size-3.5 shrink-0 text-muted-foreground" />}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDelta({
  pageTimes,
  durations,
  index,
}: {
  pageTimes: PageTimes;
  durations: (number | undefined)[];
  index: number;
}) {
  const t = useLocale();
  const now = useNow();
  // Truncate like the page timer's whole seconds so an overrun reads the same
  // here as in the slide's `+mm:ss` badge.
  const delta = Math.trunc(scheduleDeltaMs(pageTimes, durations, index, now) / 1000);
  const time = formatClock(Math.abs(delta));
  const label =
    delta > 0
      ? format(t.presenter.ahead, { time })
      : delta < 0
        ? format(t.presenter.behind, { time })
        : t.presenter.onSchedule;
  return (
    <span
      className={cn(
        'rounded-[3px] border px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
        delta < 0 && 'border-destructive/40 bg-destructive/15 text-destructive',
        delta > 0 && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200/90',
        delta === 0 && 'border-border bg-card text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

function PresenterBottomBar({
  index,
  total,
  blackout,
  onPrev,
  onNext,
  onBlackout,
  onWhiteout,
  onReset,
}: {
  index: number;
  total: number;
  blackout: 'black' | 'white' | null;
  onPrev: () => void;
  onNext: () => void;
  onBlackout: () => void;
  onWhiteout: () => void;
  onReset: () => void;
}) {
  const t = useLocale();
  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-hairline px-6 py-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrev} disabled={index === 0}>
          <ChevronLeft className="size-4" /> {t.presenter.prev}
        </Button>
        <Button variant="outline" onClick={onNext} disabled={index >= total - 1}>
          {t.presenter.next} <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={blackout === 'black' ? 'brand' : 'outline'}
          onClick={onBlackout}
          aria-pressed={blackout === 'black'}
        >
          <Square className="size-4 fill-current" /> {t.presenter.black}
        </Button>
        <Button
          variant={blackout === 'white' ? 'brand' : 'outline'}
          onClick={onWhiteout}
          aria-pressed={blackout === 'white'}
        >
          <Sun className="size-4" /> {t.presenter.white}
        </Button>
        <Button variant="ghost" onClick={onReset} title={t.presenter.resetTimer}>
          <RotateCcw className="size-4" /> {t.presenter.reset}
        </Button>
      </div>
    </footer>
  );
}

const NOTES_FONT_SIZES = [11, 12, 13.5, 15, 17, 20, 24, 28];
const NOTES_FONT_SIZE_DEFAULT_INDEX = 2;
const NOTES_FONT_SIZE_STORAGE_KEY = 'open-slide:presenter-notes-font-size';

function SpeakerNotes({ note }: { note: string | undefined }) {
  const t = useLocale();
  const [sizeIndex, setSizeIndex] = useState(() => {
    if (typeof window === 'undefined') return NOTES_FONT_SIZE_DEFAULT_INDEX;
    const stored = Number(window.localStorage.getItem(NOTES_FONT_SIZE_STORAGE_KEY));
    return NOTES_FONT_SIZES.includes(stored)
      ? NOTES_FONT_SIZES.indexOf(stored)
      : NOTES_FONT_SIZE_DEFAULT_INDEX;
  });

  useEffect(() => {
    window.localStorage.setItem(NOTES_FONT_SIZE_STORAGE_KEY, String(NOTES_FONT_SIZES[sizeIndex]));
  }, [sizeIndex]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <SectionLabel>{t.presenter.speakerNotes}</SectionLabel>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
            disabled={sizeIndex === 0}
            title={t.presenter.notesTextSmaller}
            aria-label={t.presenter.notesTextSmaller}
          >
            <AArrowDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSizeIndex((i) => Math.min(NOTES_FONT_SIZES.length - 1, i + 1))}
            disabled={sizeIndex === NOTES_FONT_SIZES.length - 1}
            title={t.presenter.notesTextLarger}
            aria-label={t.presenter.notesTextLarger}
          >
            <AArrowUp className="size-4" />
          </Button>
        </div>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto rounded-[6px] border border-border bg-card p-3 leading-relaxed text-card-foreground"
        style={{ fontSize: NOTES_FONT_SIZES[sizeIndex] }}
      >
        {note?.trim() ? (
          <NoteMarkdown text={note} />
        ) : (
          <span className="text-muted-foreground">
            {t.presenter.noNotesPrefix}
            <code className="rounded-[3px] bg-muted px-1 py-0.5 font-mono text-[0.9em]">
              export const notes = […]
            </code>
            {t.presenter.noNotesSuffix}
          </span>
        )}
      </div>
    </div>
  );
}

function PresenterJumpControl({
  total,
  current,
  onJump,
}: {
  total: number;
  current: number;
  onJump: (index: number) => void;
}) {
  const [value, setValue] = useState('');
  const t = useLocale();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number.parseInt(value, 10);
        if (Number.isFinite(n) && n >= 1 && n <= total) {
          onJump(n - 1);
          setValue('');
        }
      }}
      className="flex items-center gap-2"
    >
      <SectionLabel>{t.presenter.jump}</SectionLabel>
      <input
        type="number"
        min={1}
        max={total}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={(current + 1).toString()}
        className="h-8 w-20 rounded-[5px] border border-border bg-card px-2 font-mono text-[12px] tabular-nums outline-none focus-visible:border-foreground/30"
      />
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">/ {total}</span>
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

function PreviewStepHost({ revealed, children }: { revealed: number; children: ReactNode }) {
  const noopControllerRef = useRef<StepController | null>(null);
  return (
    <StepHost
      isActivePage={false}
      entryDirection="jump"
      controllerRef={noopControllerRef}
      controlledRevealed={revealed}
    >
      {children}
    </StepHost>
  );
}

function Clock() {
  const now = useNow();
  const t = useLocale();
  return (
    <time
      title={t.presenter.currentTime}
      className="font-mono text-[12px] tabular-nums text-muted-foreground"
    >
      {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </time>
  );
}

function ElapsedClock({ startedAt }: { startedAt: number }) {
  const now = useNow();
  const t = useLocale();
  return (
    <time
      title={t.presenter.elapsed}
      className="font-mono text-[18px] tabular-nums text-foreground"
    >
      {formatClock((now - startedAt) / 1000)}
    </time>
  );
}
