import config from 'virtual:open-slide/config';
import { Check, ChevronDown, CircleAlert, Copy } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSlidePageIndex } from '../lib/page-context';
import type { Page } from '../lib/sdk';
import {
  buildFixPrompt,
  clearPageError,
  describeRenderError,
  formatLocation,
  reportPageError,
  type SlideErrorInfo,
} from '../lib/slide-errors';
import { format, useLocale } from '../lib/use-locale';

type PageErrorBoundaryProps = {
  resetKey: unknown;
  onError?: (error: unknown, componentStack?: string) => void;
  fallback?: (error: unknown) => ReactNode;
  children: ReactNode;
};

export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  { failed: boolean; error: unknown }
> {
  state = { failed: false, error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info.componentStack ?? undefined);
  }

  componentDidUpdate(prev: PageErrorBoundaryProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false, error: null });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback?.(this.state.error) ?? null;
  }
}

export function SafePage({ page: PageComponent }: { page: Page }) {
  const slot = useSlidePageIndex() ?? -1;
  return (
    <PageErrorBoundary
      resetKey={PageComponent}
      onError={(error, componentStack) =>
        reportPageError(PageComponent, slot, describeRenderError(error, componentStack))
      }
      fallback={(error) => <PageCrashCard error={error} />}
    >
      <PageComponent />
      <ClearPageErrorOnCommit page={PageComponent} slot={slot} />
    </PageErrorBoundary>
  );
}

function ClearPageErrorOnCommit({ page, slot }: { page: Page; slot: number }) {
  useEffect(() => {
    clearPageError(page, slot);
  }, [page, slot]);
  return null;
}

function PageCrashCard({ error }: { error: unknown }) {
  const t = useLocale();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div
      role="alert"
      data-inspector-ui
      className="absolute inset-0 flex flex-col justify-center gap-8 bg-[#fff6f5] px-40 text-[#3b0a06]"
    >
      <div className="flex items-center gap-5 font-mono text-[30px] font-medium tracking-[0.08em] text-[#c2321f] uppercase">
        <CircleAlert className="size-10" aria-hidden />
        {t.slideError.pageCrashed}
      </div>
      <p className="line-clamp-4 font-mono text-[40px] leading-[1.35] break-words">{message}</p>
    </div>
  );
}

export function CopyFixPromptButton({
  info,
  slideId,
  pageNumber,
  className,
}: {
  info: SlideErrorInfo;
  slideId: string;
  pageNumber?: number;
  className?: string;
}) {
  const t = useLocale();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = async () => {
    const prompt = buildFixPrompt(info, { slideId, slidesDir: config.slidesDir, pageNumber });
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error('[open-slide] copy fix prompt failed', err);
      toast.error(t.slideError.copyFailed);
    }
  };

  return (
    <Button size="sm" variant="default" onClick={copy} className={className}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? t.slideError.copied : t.slideError.copyPrompt}
    </Button>
  );
}

function ErrorDetails({ info, className }: { info: SlideErrorInfo; className?: string }) {
  const location = formatLocation(info, config.slidesDir ?? 'slides');
  const trace = info.kind === 'compile' ? null : (info.componentStack ?? info.stack);
  return (
    <div className={cn('flex min-w-0 flex-col gap-3', className)}>
      {location && (
        <p
          className="truncate font-mono text-[11.5px] text-muted-foreground"
          title={formatLocation(info) ?? undefined}
        >
          {location}
        </p>
      )}
      <pre className="overflow-auto rounded-[6px] border border-border bg-card p-4 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-foreground shadow-edge">
        {info.message}
        {info.frame && `\n\n${info.frame}`}
      </pre>
      {trace && (
        <pre className="max-h-56 overflow-auto rounded-[6px] border border-border bg-muted/40 p-4 font-mono text-[11px] leading-relaxed whitespace-pre text-muted-foreground">
          {trace}
        </pre>
      )}
    </div>
  );
}

function useErrorTitle(info: SlideErrorInfo, pageNumber?: number) {
  const t = useLocale();
  if (info.kind === 'compile') return t.slideError.compileTitle;
  if (info.kind === 'module') return t.slideError.moduleTitle;
  if (info.kind === 'missing') return t.slideError.notFoundTitle;
  return format(t.slideError.renderTitle, { n: pageNumber ?? '?' });
}

export function SlideErrorScreen({
  info,
  slideId,
  className,
}: {
  info: SlideErrorInfo;
  slideId: string;
  className?: string;
}) {
  const t = useLocale();
  const title = useErrorTitle(info);
  const fixable = import.meta.env.DEV && info.kind !== 'missing';
  return (
    <div className={cn('flex flex-col', className)} data-osd-slide-error={info.kind}>
      <span className="eyebrow text-destructive/80">{t.common.loadFailed}</span>
      <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {fixable && (
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {t.slideError.fixHint}
        </p>
      )}
      <ErrorDetails info={info} className="mt-5" />
      {fixable && (
        <div className="mt-5 flex">
          <CopyFixPromptButton info={info} slideId={slideId} />
        </div>
      )}
    </div>
  );
}

export function SlideErrorBanner({
  info,
  slideId,
  pageNumber,
  stale,
}: {
  info: SlideErrorInfo;
  slideId: string;
  pageNumber?: number;
  stale?: boolean;
}) {
  const t = useLocale();
  const [open, setOpen] = useState(false);
  const title = useErrorTitle(info, pageNumber);
  return (
    <div
      role="alert"
      data-inspector-ui
      data-osd-slide-error={info.kind}
      className="pointer-events-none absolute inset-x-3 top-3 z-40 flex justify-center md:top-4"
    >
      <div className="island-arrive pointer-events-auto flex max-h-[min(70vh,560px)] w-full max-w-xl flex-col overflow-hidden rounded-[10px] border border-destructive/25 bg-popover/95 text-[12.5px] shadow-overlay backdrop-blur-md">
        <div className="flex items-center gap-2.5 py-2 pr-2 pl-3">
          <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{title}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {stale ? t.slideError.staleNotice : info.message}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="shrink-0"
          >
            {t.slideError.details}
            <ChevronDown
              className={cn('size-3.5 motion-safe:transition-transform', open && 'rotate-180')}
            />
          </Button>
          {import.meta.env.DEV && (
            <CopyFixPromptButton
              info={info}
              slideId={slideId}
              pageNumber={pageNumber}
              className="shrink-0"
            />
          )}
        </div>
        {open && (
          <div className="min-h-0 overflow-auto border-t border-hairline p-3">
            <ErrorDetails info={info} />
          </div>
        )}
      </div>
    </div>
  );
}
