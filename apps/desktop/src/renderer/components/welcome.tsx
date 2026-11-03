import { FolderOpen, Plus, X } from 'lucide-react';
import logo from '@/assets/open-slide.svg';
import { cn } from '@/lib/utils';
import type { AppState } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { splitPath, tildify } from '../lib/paths';

export function Welcome({
  state,
  error,
  onChoose,
  onCreate,
  onOpenRecent,
}: {
  state: AppState;
  error: string | null;
  onChoose: () => void;
  onCreate: () => void;
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
          Decks live in a workspace folder. Open one you already have, or create a new one — the
          agent skills come preconfigured.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <ActionTile
            icon={<FolderOpen className="size-4" />}
            title="Open workspace…"
            description="Pick a folder that holds an open-slide workspace."
            onClick={onChoose}
          />
          <ActionTile
            icon={<Plus className="size-4" />}
            title="Create workspace…"
            description="Scaffold a new workspace and install it."
            onClick={onCreate}
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
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-start gap-3 rounded-[10px] border border-border bg-card p-4 text-left shadow-edge outline-none',
        'transition-[box-shadow,border-color,scale] duration-150 hover:border-foreground/15 hover:shadow-floating active:scale-[0.99]',
        'focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-[7px] bg-muted text-foreground/80 transition-colors group-hover:bg-foreground group-hover:text-background">
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
    </button>
  );
}
