import { Moon, Sun } from 'lucide-react';
import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { HEX_SOURCE, type ThemeSwatch } from '../../lib/themes';

export function ModeBadge({ mode }: { mode: 'dark' | 'light' }) {
  const t = useLocale();
  const Icon = mode === 'dark' ? Moon : Sun;
  return (
    <span className="inline-flex h-[18px] shrink-0 items-center gap-1 rounded-full border border-hairline bg-muted/60 pr-2 pl-1.5 text-[10.5px] font-medium text-muted-foreground">
      <Icon className="size-3" aria-hidden />
      {mode === 'dark' ? t.themes.modeDark : t.themes.modeLight}
    </span>
  );
}

export function SwatchStrip({
  swatches,
  className,
}: {
  swatches: ThemeSwatch[];
  className?: string;
}) {
  if (swatches.length === 0) return null;
  return (
    <span aria-hidden className={cn('flex items-center gap-[3px]', className)}>
      {swatches.map((s) => (
        <span
          key={s.hex}
          className="size-3 rounded-full ring-1 ring-foreground/15 ring-inset"
          style={{ background: s.hex }}
        />
      ))}
    </span>
  );
}

export function NoDemoState({ compact = false }: { compact?: boolean }) {
  const t = useLocale();
  return (
    <div className="grid h-full w-full place-items-center bg-muted/40 px-6 text-center">
      <div className={compact ? undefined : 'max-w-sm'}>
        <p
          className={cn(
            'font-heading font-semibold tracking-tight',
            compact ? 'text-[12px] text-foreground/80' : 'text-[15px]',
          )}
        >
          {t.themes.noDemoYet}
        </p>
        <p
          className={cn(
            'text-muted-foreground',
            compact ? 'mt-1 text-[10.5px] leading-snug' : 'mt-1.5 text-[12.5px] leading-relaxed',
          )}
        >
          {t.themes.noDemoHintPrefix}
          <code
            className={cn(
              'rounded-[3px] bg-card py-0.5 font-mono text-foreground',
              compact ? 'px-1 text-[10px]' : 'px-1.5 text-[11.5px]',
            )}
          >
            /create-theme
          </code>
          {t.themes.noDemoHintSuffix}
        </p>
      </div>
    </div>
  );
}

export function useCopy(resetMs = 1600) {
  const t = useLocale();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (key: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        toast.error(t.themes.copyFailed);
        return false;
      }
      setCopiedKey(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedKey(null), resetMs);
      return true;
    },
    [resetMs, t.themes.copyFailed],
  );

  return { copiedKey, copy };
}

export function renderBodyWithSwatches(body: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of body.matchAll(new RegExp(HEX_SOURCE, 'g'))) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      out.push(<Fragment key={`t${key}`}>{body.slice(lastIndex, index)}</Fragment>);
    }
    const hex = match[0];
    out.push(
      <span
        key={`s${key}`}
        aria-hidden
        className="mr-[0.3em] inline-block size-[0.9em] -translate-y-[0.08em] rounded-[3px] align-middle ring-1 ring-foreground/20 ring-inset"
        style={{ background: hex }}
      />,
    );
    out.push(<Fragment key={`h${key}`}>{hex}</Fragment>);
    lastIndex = index + hex.length;
    key += 1;
  }
  if (lastIndex < body.length) {
    out.push(<Fragment key={`t${key}`}>{body.slice(lastIndex)}</Fragment>);
  }
  return out;
}
