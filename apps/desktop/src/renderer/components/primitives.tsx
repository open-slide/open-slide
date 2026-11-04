import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function LineLoader({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-px w-56 overflow-hidden bg-hairline', className)}>
      <span
        aria-hidden
        className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
      />
    </div>
  );
}

export function LogView({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: follow the tail whenever text grows
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text]);
  return (
    <pre
      ref={ref}
      className={cn(
        'selectable max-h-56 min-h-16 overflow-auto rounded-[6px] border border-hairline bg-muted/50 p-2.5',
        'font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all text-muted-foreground',
        className,
      )}
    >
      {text || ' '}
    </pre>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-[10px] border border-border bg-card p-4 shadow-edge', className)}
    >
      {title && (
        <header className="mb-3">
          <h3 className="font-heading text-[13.5px] font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatusDot({ tone }: { tone: 'ok' | 'busy' | 'warn' | 'off' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-1.5 shrink-0 rounded-full',
        tone === 'ok' && 'bg-emerald-500',
        tone === 'busy' && 'animate-pulse bg-amber-500 motion-reduce:animate-none',
        tone === 'warn' && 'bg-destructive',
        tone === 'off' && 'bg-muted-foreground/40',
      )}
    />
  );
}
