import { ArrowUp, Square } from 'lucide-react';
import { type ReactNode, type RefObject, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  running,
  busy,
  disabled,
  placeholder,
  chips,
  textareaRef,
}: {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  onStop: () => void;
  running: boolean;
  busy?: boolean;
  disabled?: boolean;
  placeholder: string;
  chips?: ReactNode;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const t = useLocale();
  const canSend = !running && !busy && !disabled && value.trim().length > 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the text changes
  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.min(160, Math.max(40, node.scrollHeight))}px`;
  }, [value, textareaRef]);

  return (
    <div className="shrink-0 border-t border-hairline bg-sidebar px-3 pt-2.5 pb-3">
      <div
        className={cn(
          'flex flex-col rounded-[8px] border border-border bg-background shadow-edge transition-colors duration-100',
          'focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/30',
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          rows={1}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-3 pt-2.5 text-[12.5px] leading-[1.5] outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
        />
        <div className="flex items-end justify-between gap-2 px-2 pb-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1">{chips}</div>
          {running ? (
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={t.agent.stop}
              title={t.agent.stop}
              onClick={onStop}
            >
              <Square className="size-3 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon-sm"
              aria-label={t.agent.send}
              title={t.agent.send}
              disabled={!canSend}
              onClick={onSend}
            >
              <ArrowUp className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContextChip({
  children,
  tone = 'default',
  onClick,
  title,
}: {
  children: ReactNode;
  tone?: 'default' | 'brand';
  onClick?: () => void;
  title?: string;
}) {
  const className = cn(
    'inline-flex h-6 max-w-[180px] items-center gap-1 rounded-[5px] border px-1.5 text-[10.5px] leading-none',
    tone === 'brand'
      ? 'border-brand/40 bg-brand/10 text-brand'
      : 'border-hairline bg-muted/50 text-muted-foreground',
    onClick &&
      'cursor-pointer outline-none hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={className}>
        <span className="truncate">{children}</span>
      </button>
    );
  }
  return (
    <span title={title} className={className}>
      <span className="truncate">{children}</span>
    </span>
  );
}
