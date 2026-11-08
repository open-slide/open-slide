import { FolderOpen, Sparkles, X } from 'lucide-react';
import logo from '@/assets/open-slide.svg';
import { cn } from '@/lib/utils';
import type { AppState } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { splitPath, tildify } from '../lib/paths';
import { LineLoader } from './primitives';

export function Welcome({
  state,
  error,
  starting,
  onChoose,
  onStart,
  onOpenRecent,
}: {
  state: AppState;
  error: string | null;
  starting: boolean;
  onChoose: () => void;
  onStart: () => void;
  onOpenRecent: (path: string) => void;
}) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-6 pb-10">
      <div className="rise-in flex w-full max-w-[560px] flex-col">
        <img src={logo} alt="" className="size-10" draggable={false} />
        <h1 className="mt-5 font-heading text-[24px] font-semibold tracking-tight">
          Welcome to open-slide
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
          Jump straight in and your decks are kept for you, or open an open-slide folder you already
          have.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <ActionTile
            icon={<Sparkles className="size-4" />}
            title="Start creating"
            description={
              starting ? 'Getting things ready…' : 'Jump straight in. Nothing to set up.'
            }
            busy={starting}
            disabled={starting}
            onClick={onStart}
          />
          <ActionTile
            icon={<FolderOpen className="size-4" />}
            title="Open a folder…"
            description="Pick up an open-slide folder you already have."
            disabled={starting}
            onClick={onChoose}
          />
        </div>

        {error && (
          <p className="mt-4 rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-[12.5px] leading-relaxed text-destructive">
            {error}
          </p>
        )}

        {state.recent.length > 0 && (
          <div className="mt-9">
            <span className="eyebrow">Recent</span>
            <ul className="mt-2 flex flex-col">
              {state.recent.map((path) => (
                <li key={path} className="group relative">
                  <button
                    type="button"
                    onClick={() => onOpenRecent(path)}
                    className="flex w-full min-w-0 items-baseline gap-3 rounded-[7px] px-2.5 py-2 pr-9 text-left outline-none transition-colors hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <span className="shrink-0 text-[13px] font-medium">{splitPath(path).name}</span>
                    <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
                      {tildify(path)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${path} from recent`}
                    title="Remove from recent"
                    onClick={() => desktop.workspace.forget(path)}
                    className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-[5px] text-muted-foreground opacity-0 outline-none transition-[opacity,background-color] hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionTile({
  icon,
  title,
  description,
  busy = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className={cn(
        'relative flex flex-col items-start gap-3 overflow-hidden rounded-[10px] border border-border bg-card p-4 text-left shadow-edge outline-none',
        'transition-[background-color,opacity] duration-100 enabled:active:bg-muted/70',
        'focus-visible:ring-2 focus-visible:ring-ring/40',
        disabled && !busy && 'opacity-50',
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-[7px] bg-muted text-foreground/80">
        {icon}
      </span>
      <span>
        <span className="block font-heading text-[13.5px] font-semibold tracking-tight">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
      {busy && <LineLoader className="absolute inset-x-0 bottom-0 w-full bg-transparent" />}
    </button>
  );
}
