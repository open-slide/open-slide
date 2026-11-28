import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, plural, useLocale } from '@/lib/use-locale';
import { cn, pad2 } from '@/lib/utils';
import { SlidePageProvider } from '../../lib/page-context';
import type { Page, SlideModule } from '../../lib/sdk';
import { loadSlide, slidesByTheme } from '../../lib/slides';
import {
  type ThemeDemoModule,
  type ThemeSwatch,
  themeSwatches,
  themes,
  useThemeDemo,
} from '../../lib/themes';
import { SlideCanvas } from '../slide-canvas';
import { SafePage } from '../slide-error';
import { ModeBadge, NoDemoState, renderBodyWithSwatches, useCopy } from './theme-parts';

const PROMPT_COLLAPSED_PX = 360;

export function ThemeDetail({ themeId, onBack }: { themeId: string; onBack: () => void }) {
  const t = useLocale();
  const theme = useMemo(() => themes.find((th) => th.id === themeId), [themeId]);
  const demo = useThemeDemo(theme);
  const [pageIndex, setPageIndex] = useState(0);
  const { copiedKey, copy } = useCopy();

  const pages = demo?.default ?? [];
  const totalPages = pages.length;
  const usedBySlideIds = useMemo(() => (theme ? slidesByTheme(theme.id) : []), [theme]);
  const swatches = useMemo(() => (theme ? themeSwatches(theme.body, 12) : []), [theme]);
  const stripRef = useRef<HTMLOListElement>(null);

  // scrollIntoView would also scroll the page; only the strip should move.
  useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.children[pageIndex] as HTMLElement | undefined;
    if (!strip || !item) return;
    const pad = (strip.firstElementChild as HTMLElement).offsetLeft;
    const left = item.offsetLeft - pad;
    const right = item.offsetLeft + item.offsetWidth + pad;
    if (left < strip.scrollLeft) {
      strip.scrollTo({ left });
    } else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth });
    }
  }, [pageIndex]);

  useEffect(() => {
    if (totalPages <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setPageIndex((i) => Math.min(totalPages - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setPageIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        setPageIndex(0);
      } else if (e.key === 'End') {
        setPageIndex(totalPages - 1);
      } else {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalPages]);

  if (!theme) {
    return (
      <div>
        <BackButton onBack={onBack} />
      </div>
    );
  }

  const Current = pages[pageIndex];
  const promptCopied = copiedKey === 'prompt';
  const copyPrompt = () => copy('prompt', theme.body);

  const meta: ReactNode[] = [];
  if (totalPages > 0) {
    meta.push(format(plural(totalPages, t.themes.pageCount), { count: pad2(totalPages) }));
  }
  if (usedBySlideIds.length > 0) {
    meta.push(
      format(plural(usedBySlideIds.length, t.themes.usedByCount), {
        count: usedBySlideIds.length,
      }),
    );
  }
  meta.push(theme.file);

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <div className="flex flex-col gap-5">
        <BackButton onBack={onBack} />

        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0 max-w-[660px]">
            <h1 className="font-heading text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[28px]">
              {theme.name}
            </h1>
            {theme.description ? (
              <p className="mt-2 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
                {theme.description}
              </p>
            ) : null}
            <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              {theme.mode ? <ModeBadge mode={theme.mode} /> : null}
              {meta.map((item, i) => (
                <Fragment key={String(i)}>
                  {i > 0 || theme.mode ? (
                    <span aria-hidden className="text-[10px] text-muted-foreground/40">
                      ·
                    </span>
                  ) : null}
                  <span className="folio">{item}</span>
                </Fragment>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={copyPrompt} className="shrink-0">
            {promptCopied ? <Check /> : <Copy />}
            {promptCopied ? t.themes.copied : t.themes.copyPrompt}
          </Button>
        </header>
      </div>

      <div className="flex flex-col gap-3.5">
        <section
          aria-label={t.themes.previewAria}
          className="relative aspect-video overflow-hidden rounded-[10px] border border-hairline bg-card shadow-floating ring-1 ring-foreground/[0.05]"
        >
          {!theme.hasDemo ? (
            <NoDemoState />
          ) : !demo ? (
            <div className="grid h-full w-full place-items-center text-[11px] tracking-[0.08em] uppercase text-muted-foreground/60">
              {t.common.loading}
            </div>
          ) : Current ? (
            <SlideCanvas flat freezeMotion design={demo.design}>
              <SlidePageProvider index={pageIndex} total={totalPages}>
                <SafePage page={Current} />
              </SlidePageProvider>
            </SlideCanvas>
          ) : (
            <NoDemoState />
          )}
        </section>

        {demo && totalPages > 1 ? (
          <div className="flex items-center gap-4">
            <ol
              ref={stripRef}
              className="relative -m-1 flex min-w-0 flex-1 gap-2 overflow-x-auto p-1 [scrollbar-width:thin]"
            >
              {pages.map((page, i) => (
                <li key={String(i)} className="shrink-0">
                  <PageThumb
                    page={page}
                    index={i}
                    total={totalPages}
                    design={demo.design}
                    active={i === pageIndex}
                    label={format(t.themes.goToPageAria, { n: i + 1 })}
                    onSelect={() => setPageIndex(i)}
                  />
                </li>
              ))}
            </ol>
            <div className="flex shrink-0 items-center gap-1">
              <span className="folio mr-2 hidden sm:inline">
                {format(t.themes.pageOf, { n: pad2(pageIndex + 1), total: pad2(totalPages) })}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t.themes.prevPageAria}
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t.themes.nextPageAria}
                disabled={pageIndex === totalPages - 1}
                onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <PromptCard body={theme.body} file={theme.file} copied={promptCopied} onCopy={copyPrompt} />
        <aside className="flex min-w-0 flex-col gap-9">
          {swatches.length > 0 ? (
            <PaletteSection
              swatches={swatches}
              copiedKey={copiedKey}
              onCopy={(hex) => copy(`hex:${hex}`, hex)}
            />
          ) : null}
          <UsedBySection ids={usedBySlideIds} />
        </aside>
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  const t = useLocale();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className="-ml-2.5 self-start text-muted-foreground"
    >
      <ArrowLeft />
      {t.themes.backToGallery}
    </Button>
  );
}

function PageThumb({
  page,
  index,
  total,
  design,
  active,
  label,
  onSelect,
}: {
  page: Page;
  index: number;
  total: number;
  design: ThemeDemoModule['design'];
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
      className={cn(
        'relative block aspect-video w-[104px] overflow-hidden rounded-[5px] border border-hairline bg-card outline-none md:w-[124px]',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        'motion-safe:transition-[opacity,box-shadow] motion-safe:duration-150',
        active
          ? 'ring-2 ring-foreground/85'
          : 'opacity-60 hover:opacity-100 focus-visible:opacity-100',
      )}
    >
      <div inert className="pointer-events-none h-full w-full">
        <SlideCanvas flat freezeMotion design={design}>
          <SlidePageProvider index={index} total={total}>
            <SafePage page={page} />
          </SlidePageProvider>
        </SlideCanvas>
      </div>
      <span className="nums pointer-events-none absolute bottom-1 left-1 rounded-[3px] bg-black/55 px-1 font-mono text-[9px] leading-[14px] text-white/90">
        {pad2(index + 1)}
      </span>
    </button>
  );
}

function PromptCard({
  body,
  file,
  copied,
  onCopy,
}: {
  body: string;
  file: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const t = useLocale();
  const cardRef = useRef<HTMLElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    setExpanded(false);
    const el = preRef.current;
    if (!el || !body) return;
    setOverflows(el.scrollHeight > PROMPT_COLLAPSED_PX + 8);
  }, [body]);

  const collapsed = overflows && !expanded;
  const swatched = useMemo(() => renderBodyWithSwatches(body), [body]);

  return (
    <section
      ref={cardRef}
      className="min-w-0 scroll-mt-6 self-start overflow-hidden rounded-[10px] border border-hairline bg-card shadow-edge"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-muted/30 py-1.5 pr-1.5 pl-4">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2 className="eyebrow">{t.themes.prompt}</h2>
          <span className="folio truncate">{file}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onCopy}
          aria-label={copied ? t.themes.copied : t.themes.copyPrompt}
          title={t.themes.copyPrompt}
          className="shrink-0"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <div className="relative">
        <pre
          ref={preRef}
          style={collapsed ? { maxHeight: PROMPT_COLLAPSED_PX } : undefined}
          className={cn(
            'overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-[1.7] text-foreground/90',
            collapsed && 'overflow-y-hidden',
          )}
        >
          {swatched}
        </pre>
        {collapsed ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-gradient-to-t from-card via-card/90 to-transparent pb-4">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setExpanded(true)}
              className="pointer-events-auto rounded-full px-3 shadow-edge"
            >
              {t.themes.expandPrompt}
              <ChevronDown />
            </Button>
          </div>
        ) : null}
      </div>
      {overflows && expanded ? (
        <div className="flex justify-center border-t border-hairline py-1.5">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setExpanded(false);
              cardRef.current?.scrollIntoView({ block: 'nearest' });
            }}
          >
            {t.themes.collapsePrompt}
            <ChevronUp />
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function PaletteSection({
  swatches,
  copiedKey,
  onCopy,
}: {
  swatches: ThemeSwatch[];
  copiedKey: string | null;
  onCopy: (hex: string) => void;
}) {
  const t = useLocale();
  return (
    <section>
      <h2 className="eyebrow mb-2.5">{t.themes.palette}</h2>
      <ul className="-mx-1.5 grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-0.5">
        {swatches.map((s) => {
          const copied = copiedKey === `hex:${s.hex}`;
          return (
            <li key={s.hex} className="min-w-0">
              <button
                type="button"
                aria-label={format(t.themes.copyColorAria, { hex: s.hex })}
                onClick={() => onCopy(s.hex)}
                className="flex w-full min-w-0 items-center gap-2.5 rounded-[6px] p-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98] motion-safe:transition-[background-color,scale] motion-safe:duration-100"
              >
                <span
                  className="size-7 shrink-0 rounded-[5px] ring-1 ring-foreground/15 ring-inset"
                  style={{ background: s.hex }}
                />
                <span className="min-w-0">
                  {s.role ? (
                    <span className="block truncate text-[12px] font-medium leading-tight">
                      {s.role}
                    </span>
                  ) : null}
                  <span className="nums flex items-center gap-1 truncate font-mono text-[10.5px] uppercase leading-tight text-muted-foreground">
                    {copied ? <Check className="size-3 text-foreground" aria-hidden /> : null}
                    {copied ? t.themes.copied : s.hex}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UsedBySection({ ids }: { ids: string[] }) {
  const t = useLocale();
  return (
    <section>
      <div className="mb-2.5 flex items-baseline gap-2">
        <h2 className="eyebrow">{t.themes.usedBy}</h2>
        {ids.length > 0 ? <span className="folio">{pad2(ids.length)}</span> : null}
      </div>
      {ids.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-border px-4 py-5 text-center text-[12px] leading-relaxed text-muted-foreground">
          {t.themes.usedByEmpty}
        </p>
      ) : (
        <ul className="-mx-1.5 flex flex-col gap-0.5">
          {ids.map((id) => (
            <li key={id}>
              <UsedBySlideRow id={id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UsedBySlideRow({ id }: { id: string }) {
  const [slide, setSlide] = useState<SlideModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSlide(id)
      .then((mod) => {
        if (!cancelled) setSlide(mod);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const FirstPage = slide?.default[0];
  const displayTitle = slide?.meta?.title ?? id;

  return (
    <Link
      to={`/s/${id}`}
      className="flex min-w-0 items-center gap-3 rounded-[7px] p-1.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 motion-safe:transition-colors motion-safe:duration-100"
    >
      <div className="relative aspect-video w-[84px] shrink-0 overflow-hidden rounded-[4px] border border-hairline bg-card">
        {FirstPage ? (
          <div inert className="pointer-events-none h-full w-full">
            <SlideCanvas flat freezeMotion design={slide?.design}>
              <SlidePageProvider index={0} total={slide?.default.length ?? 1}>
                <SafePage page={FirstPage} />
              </SlidePageProvider>
            </SlideCanvas>
          </div>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-medium leading-snug tracking-tight">
          {displayTitle}
        </p>
        <p className="truncate font-mono text-[10.5px] text-muted-foreground/80">{id}</p>
      </div>
    </Link>
  );
}
