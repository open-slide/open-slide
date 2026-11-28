import { ArrowUp, Square } from 'lucide-react';
import type { MouseEvent, ReactNode, RefObject } from 'react';
import { useAutoGrow } from '@/lib/use-auto-grow';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

const INTERACTIVE = 'button, a, input, textarea';

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  running,
  busy,
  placeholder,
  context,
  controls,
  textareaRef,
}: {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  onStop: () => void;
  running: boolean;
  busy?: boolean;
  placeholder: string;
  context?: ReactNode;
  controls?: ReactNode;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const t = useLocale();
  const canSend = !running && !busy && value.trim().length > 0;
  useAutoGrow(textareaRef, value, 200);

  const focusField = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target;
    // React bubbles events out of portals, so the model menu's clicks land here too.
    if (!(target instanceof Element) || !e.currentTarget.contains(target)) return;
    if (target.closest(INTERACTIVE)) return;
    e.preventDefault();
    textareaRef.current?.focus();
  };

  return (
    <div className="relative z-10 shrink-0 bg-sidebar px-3 pb-3">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full h-5 bg-gradient-to-t from-sidebar to-transparent supports-[animation-timeline:scroll()]:hidden"
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer-only shortcut; the textarea stays the keyboard target */}
      <div
        data-agent-composer
        onMouseDown={focusField}
        className={cn(
          'relative flex cursor-text flex-col rounded-[12px] border border-border bg-background shadow-edge transition-[border-color,box-shadow] duration-150',
          'focus-within:border-foreground/30 focus-within:ring-[3px] focus-within:ring-ring/15',
        )}
      >
        {context && <div className="flex flex-wrap items-center gap-1 px-2 pt-2">{context}</div>}
        {/* The placeholder is CSS-generated because iCloud Passwords reads "Code" in a native
            placeholder ("Claude Code") as a one-time-code field and pops AutoFill on focus. */}
        <div
          data-placeholder={value ? undefined : placeholder}
          className={cn(
            'relative before:pointer-events-none before:absolute before:inset-x-3 before:truncate before:text-[12.5px] before:leading-[1.5] before:text-muted-foreground/60 before:content-[attr(data-placeholder)]',
            context ? 'before:top-1.5' : 'before:top-2.5',
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
            aria-placeholder={placeholder}
            className={cn(
              'block w-full resize-none bg-transparent px-3 text-[12.5px] leading-[1.5] outline-none',
              context ? 'pt-1.5' : 'pt-2.5',
            )}
          />
        </div>
        <div className="flex items-center justify-between gap-1 px-1.5 pb-1.5">
          <div className="flex min-w-0 items-center gap-0.5">{controls}</div>
          {running ? (
            <button
              type="button"
              aria-label={t.agent.stop}
              title={t.agent.stop}
              onClick={onStop}
              className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-background outline-none transition-opacity duration-100 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Square className="size-2.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={t.agent.send}
              title={t.agent.send}
              disabled={!canSend}
              onClick={onSend}
              className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-background outline-none transition-[background-color,color,opacity] duration-100 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:bg-foreground/10 disabled:text-muted-foreground disabled:hover:opacity-100"
            >
              <ArrowUp className="size-3.5" strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContextChip({
  children,
  icon,
  tone = 'default',
  onClick,
  title,
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'brand';
  onClick?: () => void;
  title?: string;
}) {
  const className = cn(
    'inline-flex h-6 max-w-[200px] items-center gap-1 rounded-[6px] border px-1.5 text-[11px] leading-none [&_svg]:size-3 [&_svg]:shrink-0',
    tone === 'brand'
      ? 'border-brand/40 bg-brand/10 text-brand'
      : 'border-hairline bg-muted/50 text-muted-foreground',
    onClick &&
      'cursor-pointer outline-none hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
  );
  const body = (
    <>
      {icon}
      <span className="truncate">{children}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={className}>
        {body}
      </button>
    );
  }
  return (
    <span title={title} className={className}>
      {body}
    </span>
  );
}
