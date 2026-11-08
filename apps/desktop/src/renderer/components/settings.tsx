import { Bot, FolderClosed, Palette, ShieldCheck } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { AppState, DesktopSettings, PackageManager } from '../../shared/types';
import { desktop, TELEMETRY_DOCS_URL, useAppState, useLog } from '../lib/desktop';
import { splitPath, tildify } from '../lib/paths';
import { AgentsSection } from './agents-section';
import { LogView, SectionCard, StatusDot } from './primitives';

type SectionId = 'workspace' | 'agents' | 'appearance' | 'privacy';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'workspace', label: 'Workspace', icon: <FolderClosed /> },
  { id: 'agents', label: 'Agents', icon: <Bot /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette /> },
  { id: 'privacy', label: 'Privacy', icon: <ShieldCheck /> },
];

const SECTION_KEY = 'settings-section';

function storedSection(): SectionId {
  try {
    const value = localStorage.getItem(SECTION_KEY);
    if (SECTIONS.some((s) => s.id === value)) return value as SectionId;
  } catch {}
  return 'workspace';
}

export function SettingsWindow() {
  const state = useAppState();
  const [section, setSection] = useState<SectionId>(storedSection);
  const [prefs, setPrefs] = useState<DesktopSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const label = SECTIONS.find((s) => s.id === section)?.label ?? 'Settings';
  const ready = state !== null;

  useEffect(() => {
    void desktop.settings.get().then(setPrefs);
  }, []);

  useEffect(() => {
    document.title = label;
    try {
      localStorage.setItem(SECTION_KEY, section);
    } catch {}
  }, [label, section]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) window.close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Settings windows size themselves to the pane, so the window follows the
  // content's natural height instead of scrolling inside a fixed frame.
  useLayoutEffect(() => {
    const header = headerRef.current;
    const body = bodyRef.current;
    if (!ready || !header || !body) return;
    const report = () => desktop.window.fitContent(header.offsetHeight + body.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(header);
    observer.observe(body);
    return () => observer.disconnect();
  }, [ready]);

  if (!state) return null;

  const isMac = state.platform === 'darwin';
  const update = async (patch: Partial<DesktopSettings>) =>
    setPrefs(await desktop.settings.update(patch));

  return (
    <div className="flex h-full flex-col text-foreground">
      <header
        ref={headerRef}
        className="window-chrome drag-region shrink-0 border-b border-hairline"
      >
        {isMac && (
          <h1 className="flex h-8 items-center justify-center text-[13px] font-semibold">
            <span>{label}</span>
          </h1>
        )}
        <nav
          aria-label="Settings"
          className={cn('flex justify-center gap-1 px-3 pb-1.5', !isMac && 'pt-1.5')}
        >
          {SECTIONS.map((s) => {
            const selected = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => setSection(s.id)}
                className={cn(
                  'no-drag flex h-[50px] min-w-[76px] flex-col items-center justify-center gap-1 rounded-[8px] px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  '[&_svg]:size-[21px] [&_svg]:stroke-[1.6]',
                  selected ? 'bg-foreground/[0.07] text-ring' : 'text-foreground/55',
                )}
              >
                {s.icon}
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    selected ? 'text-foreground' : 'text-foreground/70',
                  )}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div ref={bodyRef} className="flex flex-col gap-3 px-5 pt-4 pb-5">
          {section === 'workspace' && (
            <WorkspaceSection
              state={state}
              error={error}
              prefs={prefs}
              onUpdate={update}
              onChoose={() => desktop.sendCommand('open-workspace')}
              onCreate={() => desktop.sendCommand('new-workspace')}
              onOpenRecent={async (path) => {
                setError(null);
                const result = await desktop.workspace.open(path);
                if (!result.ok) setError(result.error);
              }}
            />
          )}
          {section === 'agents' && <AgentsSection />}
          {section === 'appearance' && (
            <AppearanceSection state={state} prefs={prefs} onUpdate={update} />
          )}
          {section === 'privacy' && <PrivacySection prefs={prefs} onUpdate={update} />}
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

function PrivacySection({
  prefs,
  onUpdate,
}: {
  prefs: DesktopSettings | null;
  onUpdate: (patch: Partial<DesktopSettings>) => void;
}) {
  return (
    <SectionCard
      title="Usage & crash reports"
      description="Send anonymous usage events and crash reports to help improve open-slide. Nothing from your decks, file paths, or agent conversations is included."
    >
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          variant="outline"
          size="sm"
          disabled={!prefs}
          value={[prefs?.telemetry === false ? 'off' : 'on']}
          onValueChange={(value: string[]) => {
            if (value[0]) onUpdate({ telemetry: value[0] === 'on' });
          }}
        >
          <ToggleGroupItem value="on">On</ToggleGroupItem>
          <ToggleGroupItem value="off">Off</ToggleGroupItem>
        </ToggleGroup>
        <Button size="sm" variant="ghost" onClick={() => desktop.openExternal(TELEMETRY_DOCS_URL)}>
          What’s collected
        </Button>
      </div>
    </SectionCard>
  );
}
