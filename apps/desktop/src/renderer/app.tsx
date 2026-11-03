import { useCallback, useEffect, useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { type CreateTarget, CreateWorkspaceDialog } from './components/create-workspace-dialog';
import { ServerScreen } from './components/server-screen';
import { Settings } from './components/settings';
import { TabStrip } from './components/tab-strip';
import { Welcome } from './components/welcome';
import { desktop, useAppState, useColorScheme } from './lib/desktop';
import { useWorkspaceActions } from './lib/workspace-actions';

export function App() {
  useColorScheme();
  const state = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const actions = useWorkspaceActions(setCreateTarget);

  const chooseWorkspace = useCallback(async () => {
    if (await actions.choose()) setSettingsOpen(false);
  }, [actions.choose]);

  const openRecent = useCallback(
    async (path: string) => {
      if (await actions.open(path)) setSettingsOpen(false);
    },
    [actions.open],
  );

  useEffect(
    () =>
      desktop.onCommand((command) => {
        if (command === 'open-settings') setSettingsOpen(true);
        else if (command === 'open-workspace') void chooseWorkspace();
        else void actions.createNew();
      }),
    [chooseWorkspace, actions.createNew],
  );

  const screen = !state
    ? 'loading'
    : settingsOpen
      ? 'settings'
      : !state.workspace
        ? 'welcome'
        : state.server.state !== 'ready'
          ? 'server'
          : 'tabs';

  // Tab contents are native views stacked above this page, so anything the
  // shell draws in the content area (screens, dialogs) needs them hidden.
  const overlay = screen !== 'tabs' || createTarget !== null;
  useEffect(() => desktop.setOverlay(overlay), [overlay]);

  if (!state) return null;

  return (
    <TooltipProvider delay={200}>
      <div className="flex h-full flex-col text-foreground">
        <TabStrip
          state={state}
          showTabs={state.workspace !== null && state.server.state === 'ready'}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((open) => !open)}
        />
        <main className="relative min-h-0 flex-1">
          {screen === 'welcome' && (
            <Welcome
              state={state}
              error={actions.error}
              onChoose={chooseWorkspace}
              onCreate={actions.createNew}
              onOpenRecent={openRecent}
            />
          )}
          {screen === 'server' && (
            <ServerScreen state={state} onChooseWorkspace={chooseWorkspace} />
          )}
          {screen === 'settings' && (
            <Settings
              state={state}
              error={actions.error}
              onClose={() => setSettingsOpen(false)}
              onChooseWorkspace={chooseWorkspace}
              onCreateWorkspace={actions.createNew}
              onOpenRecent={openRecent}
            />
          )}
        </main>
      </div>
      <CreateWorkspaceDialog
        target={createTarget}
        onClose={() => setCreateTarget(null)}
        onCreated={() => {
          setCreateTarget(null);
          setSettingsOpen(false);
        }}
      />
    </TooltipProvider>
  );
}
