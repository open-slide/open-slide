import { LayoutGrid, Presentation } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { SwitcherTab } from '../../shared/types';
import { desktop, useSwitcher } from '../lib/desktop';

// Keys never reach this page's handlers: the main process reads them, since it
// is the one that knows when Ctrl is let go.
export function TabSwitcher() {
  const state = useSwitcher();
  const selected = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const selectedId = state?.selectedId;

  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the selection as it moves
  useLayoutEffect(() => {
    selected.current?.scrollIntoView({ block: 'nearest' });
    if (document.activeElement !== list.current) list.current?.focus({ preventScroll: true });
  }, [selectedId]);

  if (!state) return null;

  return (
    <div
      role="presentation"
      className="flex h-full items-center justify-center p-8"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) desktop.switcher.pick(null);
      }}
    >
      <div
        ref={list}
        role="listbox"
        aria-label="Open tabs"
        tabIndex={-1}
        aria-activedescendant={selectedId ? optionId(selectedId) : undefined}
        className="switcher-in flex max-h-full outline-none max-w-[980px] flex-wrap justify-center gap-1 overflow-y-auto rounded-[18px] border border-border bg-popover p-2.5 text-popover-foreground shadow-overlay [scrollbar-width:none]"
      >
        {state.tabs.map((tab) => (
          <Card
            key={tab.id}
            ref={tab.id === selectedId ? selected : undefined}
            tab={tab}
            selected={tab.id === selectedId}
          />
        ))}
      </div>
    </div>
  );
}

function optionId(tabId: string): string {
  return `switcher-tab-${tabId}`;
}

function Card({
  tab,
  selected,
  ref,
}: {
  tab: SwitcherTab;
  selected: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const Icon = tab.kind === 'home' ? LayoutGrid : Presentation;
  return (
    <button
      ref={ref}
      type="button"
      id={optionId(tab.id)}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onClick={() => desktop.switcher.pick(tab.id)}
      className={cn(
        'flex w-[188px] flex-col gap-2 rounded-[12px] p-2 outline-none',
        selected ? 'bg-foreground/[0.07]' : 'hover:bg-foreground/[0.04]',
      )}
    >
      <span
        className={cn(
          'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[7px] bg-muted shadow-edge',
          selected && 'ring-2 ring-ring ring-offset-2 ring-offset-popover',
        )}
      >
        {tab.cover ? (
          <img src={tab.cover} alt="" draggable={false} className="size-full object-cover" />
        ) : (
          <Icon className="size-6 text-foreground/30" aria-hidden />
        )}
      </span>
      <span
        className={cn(
          'w-full truncate px-0.5 text-center text-[12.5px] font-medium',
          selected ? 'text-foreground' : 'text-foreground/60',
        )}
      >
        {tab.title}
      </span>
    </button>
  );
}
