import { ChevronDown, FolderClosed, LayoutGrid, Presentation, Settings, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AppState, TabInfo } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { rovingIndex } from '../lib/roving';

const EDGE_FADE = 20;

function tabElement(list: HTMLElement | null, id: string | null): HTMLElement | null {
  return id ? (list?.querySelector<HTMLElement>(`[data-tab-id="${id}"]`) ?? null) : null;
}

export function TabStrip({ state, showTabs }: { state: AppState; showTabs: boolean }) {
  const isMac = state.platform === 'darwin';
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const rovingId = state.tabs.some((tab) => tab.id === focusedId) ? focusedId : state.activeTabId;
  const { activeTabId } = state;
  const tabCount = state.tabs.length;

  const endDrag = () => {
    setDragging(null);
    setDropIndex(null);
  };

  const onDrop = () => {
    if (dragging && dropIndex !== null) desktop.tabs.move(dragging, dropIndex);
    endDrag();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: tabs opening or closing moves the active one
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !showTabs) return;
    const reveal = () =>
      tabElement(list, activeTabId)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const measure = () => {
      const start = list.scrollLeft > 1;
      const end = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    reveal();
    measure();
    const observer = new ResizeObserver(() => {
      reveal();
      measure();
    });
    observer.observe(list);
    list.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener('scroll', measure);
    };
  }, [activeTabId, tabCount, showTabs]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the list only exists while tabs show
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || list.scrollWidth <= list.clientWidth) return;
      e.preventDefault();
      list.scrollLeft += e.deltaY;
    };
    list.addEventListener('wheel', onWheel, { passive: false });
    return () => list.removeEventListener('wheel', onWheel);
  }, [showTabs]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const from = e.target as HTMLElement;
    if (from.getAttribute('role') !== 'tab') return;
    const at = state.tabs.findIndex((tab) => tab.id === from.dataset.tabId);
    if (at < 0) return;
    const to = rovingIndex(e.key, at, state.tabs.length);
    if (to === null) return;
    e.preventDefault();
    tabElement(listRef.current, state.tabs[to].id)?.focus();
  };

  const fade = (on: boolean) => (on ? 'transparent' : 'black');
  const mask =
    edges.start || edges.end
      ? `linear-gradient(to right, ${fade(edges.start)}, black ${EDGE_FADE}px, black calc(100% - ${EDGE_FADE}px), ${fade(edges.end)})`
      : undefined;

  return (
    <header
      className="window-chrome drag-region relative z-10 flex h-10 shrink-0 items-center gap-1"
      style={{
        paddingLeft: isMac && !state.fullscreen ? 84 : 8,
        paddingRight: isMac ? 8 : 148,
      }}
    >
      {showTabs ? (
        <div
          ref={listRef}
          role="tablist"
          aria-label="Open decks"
          className="flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
          onDragOver={(e) => dragging && e.preventDefault()}
          onDrop={onDrop}
          onKeyDown={onKeyDown}
        >
          {state.tabs.map((tab, index) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={tab.id === activeTabId}
              roving={tab.id === rovingId}
              dropBefore={dragging !== null && dropIndex === index && dragging !== tab.id}
              onFocus={() => setFocusedId(tab.id)}
              onDragStart={() => setDragging(tab.id)}
              onDragEnd={endDrag}
              onDragOver={(after) => {
                if (!dragging) return;
                const next = Math.max(1, after ? index + 1 : index);
                if (next === dropIndex) return;
                if (dropIndex !== null) desktop.haptic('levelChange');
                setDropIndex(next);
              }}
            />
          ))}
          <div aria-hidden className="h-full min-w-6 flex-1" />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {state.workspace && (
        <button
          type="button"
          title={`Switch workspace (${state.workspace.root})`}
          aria-label="Switch workspace"
          aria-haspopup="menu"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            desktop.workspace.showPicker({
              x: Math.round(rect.left),
              y: Math.round(rect.bottom + 4),
            });
          }}
          className="no-drag flex h-7 max-w-[240px] shrink-0 items-center gap-1.5 rounded-[7px] px-2 text-[12px] font-medium text-foreground/70 outline-none transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <FolderClosed className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{state.workspace.name}</span>
          <ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden />
        </button>
      )}

      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        onClick={() => desktop.settings.open()}
        className="no-drag flex size-7 shrink-0 items-center justify-center rounded-[7px] text-foreground/60 outline-none transition-[background-color,color,scale] duration-100 hover:bg-foreground/[0.06] hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Settings className="size-4" />
      </button>
    </header>
  );
}

function TabButton({
  tab,
  active,
  roving,
  dropBefore,
  onFocus,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  tab: TabInfo;
  active: boolean;
  roving: boolean;
  dropBefore: boolean;
  onFocus: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (after: boolean) => void;
}) {
  const activate = () => desktop.tabs.activate(tab.id);
  const showMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    desktop.tabs.showMenu(tab.id);
  };
  const surface = cn(
    'no-drag h-7 items-center rounded-[7px] outline-none transition-[background-color,color,box-shadow] duration-100 focus-visible:ring-2 focus-visible:ring-ring/50',
    active
      ? 'bg-background text-foreground shadow-edge ring-1 ring-foreground/[0.06]'
      : 'text-foreground/60 hover:bg-foreground/[0.05] hover:text-foreground',
  );

  if (tab.kind === 'home') {
    return (
      <button
        type="button"
        role="tab"
        data-tab-id={tab.id}
        aria-selected={active}
        tabIndex={roving ? 0 : -1}
        aria-label="Home"
        title="Home"
        onFocus={onFocus}
        onClick={activate}
        onContextMenu={showMenu}
        className={cn('flex w-8 shrink-0 justify-center', surface)}
      >
        <LayoutGrid className="size-3.5" />
      </button>
    );
  }

  const icon = tab.loading ? (
    <span aria-hidden className="relative block size-3.5 shrink-0">
      <span className="absolute inset-[3px] animate-pulse rounded-full bg-foreground/40 motion-reduce:animate-none" />
    </span>
  ) : (
    <Presentation className="size-3.5 shrink-0 opacity-55" aria-hidden />
  );

  return (
    <div
      role="tab"
      data-tab-id={tab.id}
      aria-selected={active}
      tabIndex={roving ? 0 : -1}
      draggable
      title={tab.title}
      onFocus={(e) => {
        if (e.target === e.currentTarget) onFocus();
      }}
      onClick={activate}
      onContextMenu={showMenu}
      onAuxClick={(e) => {
        if (e.button === 1) desktop.tabs.close(tab.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          desktop.tabs.close(tab.id);
        }
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onDragOver(e.clientX > rect.left + rect.width / 2);
      }}
      className={cn(
        'group relative flex min-w-[96px] max-w-[160px] flex-1 basis-[140px] gap-1.5 pr-1 pl-2 text-[12.5px] font-medium',
        surface,
      )}
    >
      {dropBefore && (
        <span aria-hidden className="absolute inset-y-1 -left-[3px] w-0.5 rounded-full bg-ring" />
      )}
      {icon}
      <span className="min-w-0 flex-1 truncate">{tab.title}</span>
      <button
        type="button"
        aria-label={`Close ${tab.title}`}
        tabIndex={roving ? 0 : -1}
        onClick={(e) => {
          e.stopPropagation();
          desktop.tabs.close(tab.id);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-[4px] text-foreground/50 outline-none transition-[opacity,background-color] hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
        )}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
