import { FolderClosed, LayoutGrid, Presentation, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AppState, TabInfo } from '../../shared/types';
import { desktop } from '../lib/desktop';

const iconButton =
  'no-drag flex size-7 shrink-0 items-center justify-center rounded-[7px] text-foreground/60 outline-none transition-[background-color,color,scale] duration-100 hover:bg-foreground/[0.06] hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/50';

export function TabStrip({ state, showTabs }: { state: AppState; showTabs: boolean }) {
  const isMac = state.platform === 'darwin';
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const onDrop = () => {
    if (dragging && dropIndex !== null) desktop.tabs.move(dragging, dropIndex);
    setDragging(null);
    setDropIndex(null);
  };

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
          role="tablist"
          aria-label="Open decks"
          className="flex min-w-0 flex-1 items-center gap-1"
          onDragOver={(e) => dragging && e.preventDefault()}
          onDrop={onDrop}
        >
          {state.tabs.map((tab, index) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={tab.id === state.activeTabId}
              dropBefore={dragging !== null && dropIndex === index && dragging !== tab.id}
              onDragStart={() => setDragging(tab.id)}
              onDragEnd={() => {
                setDragging(null);
                setDropIndex(null);
              }}
              onDragOver={(after) => {
                if (!dragging) return;
                const next = Math.max(1, after ? index + 1 : index);
                if (next === dropIndex) return;
                if (dropIndex !== null) desktop.haptic('levelChange');
                setDropIndex(next);
              }}
            />
          ))}
          <div className="h-full min-w-6 flex-1" />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {state.workspace && (
        <button
          type="button"
          title={state.workspace.root}
          onClick={() => desktop.workspace.reveal()}
          className="no-drag hidden h-7 max-w-[200px] shrink-0 items-center gap-1.5 rounded-[7px] px-2 text-[12px] font-medium text-foreground/55 outline-none transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 md:flex"
        >
          <FolderClosed className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{state.workspace.name}</span>
        </button>
      )}

      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        onClick={() => desktop.window.openSettings()}
        className={iconButton}
      >
        <Settings className="size-4" />
      </button>
    </header>
  );
}

function TabButton({
  tab,
  active,
  dropBefore,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  tab: TabInfo;
  active: boolean;
  dropBefore: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (after: boolean) => void;
}) {
  const isHome = tab.kind === 'home';
  const surface = active
    ? 'bg-background text-foreground shadow-edge ring-1 ring-foreground/[0.06]'
    : 'text-foreground/60 hover:bg-foreground/[0.05] hover:text-foreground';

  if (isHome) {
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        aria-label="Home"
        title="Home"
        onClick={() => desktop.tabs.activate(tab.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          desktop.tabs.showMenu(tab.id);
        }}
        className={cn(
          'no-drag flex h-7 w-8 shrink-0 items-center justify-center rounded-[7px] outline-none transition-[background-color,color,box-shadow] duration-100 focus-visible:ring-2 focus-visible:ring-ring/50',
          surface,
        )}
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

  const close = (className: string) => (
    <button
      type="button"
      aria-label={`Close ${tab.title}`}
      onClick={(e) => {
        e.stopPropagation();
        desktop.tabs.close(tab.id);
      }}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-[4px] text-foreground/50 outline-none transition-[opacity,background-color] hover:bg-foreground/10 hover:text-foreground',
        className,
      )}
    >
      <X className="size-3" />
    </button>
  );

  return (
    <div
      role="tab"
      aria-selected={active}
      tabIndex={0}
      draggable
      title={tab.title}
      onClick={() => desktop.tabs.activate(tab.id)}
      onAuxClick={(e) => {
        if (e.button === 1) desktop.tabs.close(tab.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        desktop.tabs.showMenu(tab.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') desktop.tabs.activate(tab.id);
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
        'no-drag group relative flex h-7 min-w-[72px] max-w-[160px] flex-1 basis-[140px] items-center gap-1.5 rounded-[7px] pr-1 pl-2 text-[12.5px] font-medium outline-none transition-[background-color,color,box-shadow] duration-100 focus-visible:ring-2 focus-visible:ring-ring/50',
        surface,
      )}
    >
      {dropBefore && (
        <span aria-hidden className="absolute inset-y-1 -left-[3px] w-0.5 rounded-full bg-ring" />
      )}
      {icon}
      <span className="min-w-0 flex-1 truncate">{tab.title}</span>
      {close(
        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
      )}
    </div>
  );
}
