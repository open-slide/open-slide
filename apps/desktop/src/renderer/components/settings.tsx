import { Bot, FolderClosed, Palette, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AppState, Backdrop, DesktopSettings, PackageManager } from '../../shared/types';
import { desktop, TELEMETRY_DOCS_URL, useLog } from '../lib/desktop';
import { baseName, tildify } from '../lib/paths';
import { rovingIndex } from '../lib/roving';
import { openWorkspace } from '../lib/workspace-actions';
import { AgentsSection } from './agents-section';
import { LogView, Segmented, SettingRow, SettingsGroup, StatusDot } from './primitives';

type SectionId = 'workspace' | 'agents' | 'appearance' | 'privacy';

const SECTIONS: { id: SectionId; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Where your decks live and how they run.',
    icon: <FolderClosed />,
  },
  {
    id: 'agents',
    label: 'Agents',
    description:
      'The agent panel inside each deck drives Claude Code or Codex. If an agent isn’t on this computer yet, signing in downloads it once.',
    icon: <Bot />,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'How the open-slide window looks.',
    icon: <Palette />,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'What open-slide shares to help improve the app.',
    icon: <ShieldCheck />,
  },
];

const SECTION_KEY = 'settings-section';

function storedSection(): SectionId {
  try {
    const value = localStorage.getItem(SECTION_KEY);
    if (SECTIONS.some((s) => s.id === value)) return value as SectionId;
  } catch {}
  return 'workspace';
}

type Session = { open: boolean; backdrop: Backdrop | null };

async function decoded(backdrop: Backdrop | null): Promise<Backdrop | null> {
  if (!backdrop) return null;
  const image = new Image();
  image.src = backdrop.src;
  await image.decode().catch(() => {});
  return backdrop;
}

export function useSettingsSession() {
  const [session, setSession] = useState<Session | null>(null);
  const open = session?.open ?? false;

  useEffect(
    () =>
      desktop.settings.onOpen(async (incoming) => {
        const backdrop = await decoded(incoming);
        setSession((current) => ({ open: true, backdrop: backdrop ?? current?.backdrop ?? null }));
      }),
    [],
  );

  useEffect(
    () => desktop.settings.onClose(() => setSession((s) => s && { ...s, open: false })),
    [],
  );

  useEffect(() => desktop.settings.setOpen(open), [open]);

  return {
    session,
    close: () => setSession((s) => s && { ...s, open: false }),
    // Keeps the backdrop through the exit animation, so the deck never blinks out early.
    finish: () => setSession((s) => (s?.open ? s : null)),
  };
}

export function SettingsDialog({
  state,
  session,
  showBackdrop,
  onClose,
  onClosed,
}: {
  state: AppState;
  session: Session | null;
  showBackdrop: boolean;
  onClose: () => void;
  onClosed: () => void;
}) {
  const open = session?.open ?? false;
  const backdrop = showBackdrop ? (session?.backdrop ?? null) : null;
  const [section, setSection] = useState<SectionId>(storedSection);
  const [prefs, setPrefs] = useState<DesktopSettings | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  useEffect(() => {
    if (!open) return;
    const load = () => void desktop.settings.get().then(setPrefs);
    load();
    return desktop.window.onFocus((focused) => {
      if (focused) load();
    });
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(SECTION_KEY, section);
    } catch {}
  }, [section]);

  const update = async (patch: Partial<DesktopSettings>) =>
    setPrefs(await desktop.settings.update(patch));
  const leave = (action: () => void) => {
    onClose();
    action();
  };
  const sectionProps = { state, prefs, onUpdate: update, onLeave: leave };

  const onNavKey = (e: React.KeyboardEvent) => {
    const at = SECTIONS.findIndex((s) => s.id === section);
    const to = rovingIndex(e.key, at, SECTIONS.length, 'vertical');
    if (to === null) return;
    e.preventDefault();
    const next = SECTIONS[to];
    setSection(next.id);
    navRef.current?.querySelector<HTMLElement>(`#settings-tab-${next.id}`)?.focus();
  };

  return (
    <>
      {backdrop && (
        <img
          src={backdrop.src}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none fixed left-0 w-full object-cover object-left-top"
          style={{ top: backdrop.top, height: `calc(100% - ${backdrop.top}px)` }}
        />
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        onOpenChangeComplete={(next) => {
          if (!next) onClosed();
        }}
      >
        <DialogContent
          initialFocus={panelRef}
          className={cn(
            'settings-dialog flex h-[min(720px,calc(100%-96px))] w-[min(1000px,calc(100%-96px))] max-w-none gap-0 overflow-hidden rounded-[14px] bg-background p-0 backdrop-blur-none sm:max-w-none',
            'duration-200 ease-(--ease-swift) data-ending-style:duration-150',
            'data-starting-style:scale-[0.98] data-ending-style:scale-[0.98]',
            'motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100',
          )}
        >
          <nav className="flex w-[216px] shrink-0 flex-col gap-3 border-r border-hairline bg-foreground/[0.025] p-2.5">
            <p className="px-2.5 pt-2 text-[12px] font-medium text-muted-foreground">Settings</p>
            <div
              ref={navRef}
              role="tablist"
              aria-label="Settings"
              aria-orientation="vertical"
              onKeyDown={onNavKey}
              className="flex flex-col gap-px"
            >
              {SECTIONS.map((s) => {
                const selected = section === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    id={`settings-tab-${s.id}`}
                    aria-selected={selected}
                    aria-controls="settings-panel"
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setSection(s.id)}
                    className={cn(
                      'flex h-8 items-center gap-2.5 rounded-[7px] px-2.5 text-[13px] outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring/50',
                      '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]',
                      selected
                        ? 'bg-foreground/[0.07] font-medium text-foreground'
                        : 'text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground',
                    )}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            key={section}
            ref={panelRef}
            tabIndex={-1}
            id="settings-panel"
            role="tabpanel"
            aria-labelledby={`settings-tab-${section}`}
            className="min-w-0 flex-1 overflow-y-auto outline-none [scrollbar-gutter:stable]"
          >
            <div className="mx-auto flex w-full max-w-[680px] flex-col gap-8 px-10 pt-10 pb-12">
              <header className="border-b border-hairline pb-5">
                <DialogTitle className="text-[20px]">{current.label}</DialogTitle>
                <DialogDescription className="mt-1.5">{current.description}</DialogDescription>
              </header>
              {section === 'workspace' && (
                <WorkspaceSection key={state.workspace?.root ?? ''} {...sectionProps} />
              )}
              {section === 'agents' && <AgentsSection />}
              {section === 'appearance' && <AppearanceSection {...sectionProps} />}
              {section === 'privacy' && <PrivacySection {...sectionProps} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type SectionProps = {
  state: AppState;
  prefs: DesktopSettings | null;
  onUpdate: (patch: Partial<DesktopSettings>) => void;
  onLeave: (action: () => void) => void;
};

const SERVER_STATUS: Record<
  AppState['server']['state'],
  { tone: React.ComponentProps<typeof StatusDot>['tone']; label: string }
> = {
  idle: { tone: 'off', label: 'Stopped' },
  'not-installed': { tone: 'warn', label: 'Dependencies not installed' },
  installing: { tone: 'busy', label: 'Installing dependencies…' },
  starting: { tone: 'busy', label: 'Starting…' },
  ready: { tone: 'ok', label: 'Running' },
  error: { tone: 'warn', label: 'Stopped with an error' },
};

const chooseWorkspace = () => desktop.sendCommand('open-workspace');
const createWorkspace = () => desktop.sendCommand('new-workspace');

function WorkspaceSection({ state, prefs, onUpdate, onLeave }: SectionProps) {
  const { workspace, server } = state;
  const error = state.workspaceError?.message;
  const status = SERVER_STATUS[server.state];
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useLog('server');
  const [managers, setManagers] = useState<PackageManager[]>([]);

  useEffect(() => {
    void desktop.workspace.packageManagers().then(setManagers);
  }, []);

  useEffect(() => {
    if (!showLog) return;
    let current = true;
    void desktop.server.log().then((text) => {
      if (current) setLog(text);
    });
    return () => {
      current = false;
    };
  }, [showLog, setLog]);

  const others = state.recent.filter((r) => r !== workspace?.root);

  return (
    <>
      <SettingsGroup title="Current workspace">
        {workspace ? (
          <SettingRow
            label={workspace.name}
            description={
              <span
                className="selectable block truncate font-mono text-[11.5px]"
                title={workspace.root}
              >
                {tildify(workspace.root)}
              </span>
            }
          >
            <Button size="sm" variant="ghost" onClick={() => desktop.workspace.reveal()}>
              {state.platform === 'darwin' ? 'Reveal in Finder' : 'Show folder'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onLeave(chooseWorkspace)}>
              Change…
            </Button>
          </SettingRow>
        ) : (
          <SettingRow label="No workspace open" description="Pick a folder of decks to serve.">
            <Button size="sm" onClick={() => onLeave(chooseWorkspace)}>
              Open workspace…
            </Button>
          </SettingRow>
        )}
        {error && (
          <p className="selectable px-4 py-3 text-[12.5px] leading-relaxed text-destructive">
            {error}
          </p>
        )}
      </SettingsGroup>

      {workspace && (
        <SettingsGroup
          title="Dev server"
          description="Runs this workspace on the @open-slide/core built into the app."
        >
          <SettingRow
            label={
              <span className="flex items-center gap-2">
                <StatusDot tone={status.tone} />
                {status.label}
              </span>
            }
            description={
              server.state === 'ready' && (
                <button
                  type="button"
                  onClick={() => desktop.openExternal(server.url)}
                  className="selectable font-mono text-[11.5px] underline decoration-foreground/20 underline-offset-2 hover:text-foreground"
                >
                  {server.url}
                </button>
              )
            }
          >
            <Button size="sm" variant="ghost" onClick={() => setShowLog((v) => !v)}>
              {showLog ? 'Hide log' : 'Show log'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => desktop.server.restart()}>
              Restart
            </Button>
          </SettingRow>
          {showLog && (
            <div className="p-3">
              <LogView text={log} className="max-h-72" />
            </div>
          )}
        </SettingsGroup>
      )}

      {others.length > 0 && (
        <SettingsGroup title="Recent workspaces">
          {others.map((path) => (
            <SettingRow
              key={path}
              label={baseName(path)}
              description={
                <span className="block truncate font-mono text-[11.5px]" title={path}>
                  {tildify(path)}
                </span>
              }
            >
              <Button size="sm" variant="ghost" onClick={() => desktop.workspace.forget(path)}>
                Remove
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLeave(() => openWorkspace(path))}
              >
                Open
              </Button>
            </SettingRow>
          ))}
        </SettingsGroup>
      )}

      <SettingsGroup title="New workspaces">
        <SettingRow
          label="Create a workspace"
          description="Scaffolds a folder with the authoring skills for Claude Code and Codex."
        >
          <Button size="sm" variant="outline" onClick={() => onLeave(createWorkspace)}>
            New workspace…
          </Button>
        </SettingRow>
        <SettingRow
          label="Package manager"
          description="What new workspaces install with. Existing ones keep the one their lockfile names."
        >
          <Segmented
            mono
            value={prefs?.packageManager ?? null}
            options={managers}
            onChange={(packageManager) => onUpdate({ packageManager })}
          />
        </SettingRow>
      </SettingsGroup>
    </>
  );
}

function AppearanceSection({ state, prefs, onUpdate }: SectionProps) {
  const supported = state.platform === 'darwin' || state.platform === 'win32';
  return (
    <SettingsGroup>
      <SettingRow
        label="Window material"
        description={
          supported
            ? 'Translucent lets the desktop show through the sidebar, thumbnail rail, and panels. Decks and content stay opaque.'
            : 'Translucent windows need macOS or Windows 11.'
        }
      >
        <Segmented
          disabled={!supported || !prefs}
          value={prefs?.translucent && supported ? 'translucent' : 'solid'}
          options={['translucent', 'solid']}
          labels={{ translucent: 'Translucent', solid: 'Solid' }}
          onChange={(next) => next && onUpdate({ translucent: next === 'translucent' })}
        />
      </SettingRow>
    </SettingsGroup>
  );
}

function PrivacySection({ prefs, onUpdate }: SectionProps) {
  return (
    <SettingsGroup>
      <SettingRow
        label="Usage & crash reports"
        description={
          <>
            Anonymous usage events and crash reports. Nothing from your decks, file paths, or agent
            conversations is included.{' '}
            <button
              type="button"
              onClick={() => desktop.openExternal(TELEMETRY_DOCS_URL)}
              className="font-medium text-foreground/80 underline decoration-foreground/25 underline-offset-2 hover:decoration-foreground/60"
            >
              What’s collected
            </button>
          </>
        }
      >
        <Segmented
          disabled={!prefs}
          value={prefs?.telemetry === false ? 'off' : 'on'}
          options={['on', 'off']}
          labels={{ on: 'On', off: 'Off' }}
          onChange={(next) => next && onUpdate({ telemetry: next === 'on' })}
        />
      </SettingRow>
    </SettingsGroup>
  );
}
