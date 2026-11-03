import { Bot, ChevronLeft, FolderClosed, Info, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { AppState, DesktopSettings, PackageManager } from '../../shared/types';
import { desktop, useLog } from '../lib/desktop';
import { splitPath, tildify } from '../lib/paths';
import { AgentsSection } from './agents-section';
import { LogView, SectionCard, StatusDot } from './primitives';

type SectionId = 'workspace' | 'agents' | 'appearance' | 'about';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'workspace', label: 'Workspace', icon: <FolderClosed /> },
  { id: 'agents', label: 'Agents', icon: <Bot /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette /> },
  { id: 'about', label: 'About', icon: <Info /> },
];

export function Settings({
  state,
  error,
  onClose,
  onChooseWorkspace,
  onCreateWorkspace,
  onOpenRecent,
}: {
  state: AppState;
  error: string | null;
  onClose: () => void;
  onChooseWorkspace: () => void;
  onCreateWorkspace: () => void;
  onOpenRecent: (path: string) => void;
}) {
  const [section, setSection] = useState<SectionId>('workspace');
  const [prefs, setPrefs] = useState<DesktopSettings | null>(null);

  useEffect(() => {
    void desktop.settings.get().then(setPrefs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = async (patch: Partial<DesktopSettings>) =>
    setPrefs(await desktop.settings.update(patch));

  return (
    <div className="flex h-full min-h-0">
      <nav className="flex w-[13.5rem] shrink-0 flex-col gap-0.5 px-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="mb-3 flex h-7 items-center gap-1 self-start rounded-[6px] pr-2 pl-1 text-[12.5px] font-medium text-foreground/60 outline-none transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {state.workspace ? 'Back to decks' : 'Back'}
        </button>
        <span className="eyebrow mb-1.5 px-2">Settings</span>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-current={section === s.id ? 'page' : undefined}
            onClick={() => setSection(s.id)}
            className={cn(
              'flex h-8 items-center gap-2 rounded-[6px] px-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 [&_svg]:size-4 [&_svg]:text-muted-foreground',
              section === s.id
                ? 'bg-foreground/[0.07] font-medium text-foreground'
                : 'text-foreground/75 hover:bg-foreground/[0.04] hover:text-foreground',
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col py-2 pr-2">
        <div className="min-h-0 flex-1 overflow-y-auto rounded-[10px] bg-background shadow-edge ring-1 ring-foreground/[0.06]">
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 px-8 py-9">
            <h1 className="font-heading text-[20px] font-semibold tracking-tight">
              {SECTIONS.find((s) => s.id === section)?.label}
            </h1>
            {section === 'workspace' && (
              <WorkspaceSection
                state={state}
                error={error}
                prefs={prefs}
                onUpdate={update}
                onChoose={onChooseWorkspace}
                onCreate={onCreateWorkspace}
                onOpenRecent={onOpenRecent}
              />
            )}
            {section === 'agents' && <AgentsSection />}
            {section === 'appearance' && (
              <AppearanceSection state={state} prefs={prefs} onUpdate={update} />
            )}
            {section === 'about' && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function serverTone(state: AppState['server']['state']) {
  if (state === 'ready') return 'ok' as const;
  if (state === 'error' || state === 'not-installed') return 'warn' as const;
  if (state === 'idle') return 'off' as const;
  return 'busy' as const;
}

const SERVER_LABEL: Record<AppState['server']['state'], string> = {
  idle: 'Stopped',
  'not-installed': 'Dependencies not installed',
  installing: 'Installing dependencies…',
  starting: 'Starting…',
  ready: 'Running',
  error: 'Stopped with an error',
};

function WorkspaceSection({
  state,
  error,
  prefs,
  onUpdate,
  onChoose,
  onCreate,
  onOpenRecent,
}: {
  state: AppState;
  error: string | null;
  prefs: DesktopSettings | null;
  onUpdate: (patch: Partial<DesktopSettings>) => void;
  onChoose: () => void;
  onCreate: () => void;
  onOpenRecent: (path: string) => void;
}) {
  const { workspace, server } = state;
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useLog('server');
  const [managers, setManagers] = useState<PackageManager[]>([]);

  useEffect(() => {
    void desktop.workspace.packageManagers().then(setManagers);
  }, []);

  useEffect(() => {
    if (showLog) void desktop.server.log().then(setLog);
  }, [showLog, setLog]);

  const others = state.recent.filter((r) => r !== workspace?.root);

  return (
    <>
      <SectionCard
        title="Current workspace"
        description="The folder open-slide serves your decks from."
      >
        {workspace ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[13.5px] font-medium">{workspace.name}</p>
              <p
                className="selectable mt-0.5 truncate font-mono text-[11.5px] text-muted-foreground"
                title={workspace.root}
              >
                {tildify(workspace.root)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onChoose}>
                Change…
              </Button>
              <Button size="sm" variant="outline" onClick={onCreate}>
                New workspace…
              </Button>
              <Button size="sm" variant="ghost" onClick={() => desktop.workspace.reveal()}>
                {state.platform === 'darwin' ? 'Reveal in Finder' : 'Show folder'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={onChoose}>
              Open workspace…
            </Button>
            <Button size="sm" variant="outline" onClick={onCreate}>
              New workspace…
            </Button>
          </div>
        )}
        {error && <p className="mt-3 text-[12.5px] leading-relaxed text-destructive">{error}</p>}
      </SectionCard>

      {workspace && (
        <SectionCard title="Dev server" description="Runs this workspace’s own @open-slide/core.">
          <div className="flex items-center gap-2 text-[13px]">
            <StatusDot tone={serverTone(server.state)} />
            <span>{SERVER_LABEL[server.state]}</span>
            {server.state === 'ready' && (
              <button
                type="button"
                onClick={() => desktop.openExternal(server.url)}
                className="selectable ml-1 font-mono text-[11.5px] text-muted-foreground underline decoration-foreground/20 underline-offset-2 hover:text-foreground"
              >
                {server.url}
              </button>
            )}
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setShowLog((v) => !v)}>
                {showLog ? 'Hide log' : 'Show log'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => desktop.server.restart()}>
                Restart
              </Button>
            </div>
          </div>
          {showLog && <LogView text={log} className="mt-3 max-h-72" />}
        </SectionCard>
      )}

      {others.length > 0 && (
        <SectionCard title="Recent workspaces">
          <ul className="-mx-1.5 flex flex-col">
            {others.map((path) => (
              <li
                key={path}
                className="flex items-center gap-2 rounded-[6px] px-1.5 py-1 hover:bg-muted/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{splitPath(path).name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {tildify(path)}
                  </p>
                </div>
                <Button size="xs" variant="outline" onClick={() => onOpenRecent(path)}>
                  Open
                </Button>
                <Button size="xs" variant="ghost" onClick={() => desktop.workspace.forget(path)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard
        title="New workspaces"
        description="The package manager new workspaces install with. Existing workspaces keep the one their lockfile names."
      >
        <ToggleGroup
          variant="outline"
          size="sm"
          value={prefs?.packageManager ? [prefs.packageManager] : []}
          onValueChange={(value: string[]) =>
            onUpdate({ packageManager: (value[0] as PackageManager | undefined) ?? null })
          }
        >
          {managers.map((pm) => (
            <ToggleGroupItem key={pm} value={pm} className="font-mono">
              {pm}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SectionCard>
    </>
  );
}

function AppearanceSection({
  state,
  prefs,
  onUpdate,
}: {
  state: AppState;
  prefs: DesktopSettings | null;
  onUpdate: (patch: Partial<DesktopSettings>) => void;
}) {
  const supported = state.platform === 'darwin' || state.platform === 'win32';
  return (
    <SectionCard
      title="Window material"
      description={
        supported
          ? 'Translucent lets the desktop show through the sidebar, thumbnail rail, and panels. Decks and content stay opaque.'
          : 'Translucent windows need macOS or Windows 11.'
      }
    >
      <ToggleGroup
        variant="outline"
        size="sm"
        disabled={!supported || !prefs}
        value={[prefs?.translucent && supported ? 'translucent' : 'solid']}
        onValueChange={(value: string[]) => {
          if (value[0]) onUpdate({ translucent: value[0] === 'translucent' });
        }}
      >
        <ToggleGroupItem value="translucent">Translucent</ToggleGroupItem>
        <ToggleGroupItem value="solid">Solid</ToggleGroupItem>
      </ToggleGroup>
    </SectionCard>
  );
}

function AboutSection() {
  return (
    <SectionCard>
      <p className="text-[13px] leading-relaxed">
        open-slide for desktop runs each workspace’s own{' '}
        <code className="font-mono text-[12px]">@open-slide/core</code> dev server and opens every
        deck in its own tab.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => desktop.openExternal('https://open-slide.dev/docs')}
        >
          Docs
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => desktop.openExternal('https://github.com/open-slide/open-slide')}
        >
          GitHub
        </Button>
      </div>
    </SectionCard>
  );
}
