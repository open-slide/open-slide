import { useCallback, useEffect, useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { type CreateTarget, CreateWorkspaceDialog } from './components/create-workspace-dialog';
import { Intro } from './components/intro';
import { Onboarding } from './components/onboarding';
import { ServerScreen } from './components/server-screen';
import { SettingsWindow } from './components/settings';
import { TabStrip } from './components/tab-strip';
import { Welcome } from './components/welcome';
import { desktop, useAppState, useWindowAppearance } from './lib/desktop';
import { useWorkspaceActions } from './lib/workspace-actions';

const route = window.location.hash.slice(1);
document.documentElement.dataset.route = route || 'main';

export function App() {
  return route === 'intro' ? <Intro /> : <Shell />;
}

function Shell() {
  useWindowAppearance();
  return route === 'settings' ? <SettingsWindow /> : <MainWindow />;
}

function MainWindow() {
  const state = useAppState();
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const actions = useWorkspaceActions(setCreateTarget);

  const chooseWorkspace = useCallback(() => void actions.choose(), [actions.choose]);

  useEffect(
    () =>
      desktop.onCommand((command) => {
        if (command === 'open-workspace') chooseWorkspace();
        else void actions.createNew();
      }),
    [chooseWorkspace, actions.createNew],
  );

  const screen = !state
    ? 'loading'
    : state.onboarding
      ? 'onboarding'
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
        <TabStrip state={state} showTabs={screen === 'tabs'} />
        <main className="relative min-h-0 flex-1">
          {screen === 'onboarding' && (
            <Onboarding
              state={state}
              error={actions.error}
              onChoose={chooseWorkspace}
              onCreate={actions.createNew}
              onOpenRecent={(path) => void actions.open(path)}
            />
          )}
          {screen === 'welcome' && (
            <Welcome
              state={state}
              error={actions.error}
              onChoose={chooseWorkspace}
              onCreate={actions.createNew}
              onOpenRecent={(path) => void actions.open(path)}
            />
          )}
          {screen === 'server' && (
            <ServerScreen state={state} onChooseWorkspace={chooseWorkspace} />
          )}
        </main>
      </div>
      <CreateWorkspaceDialog
        target={createTarget}
        onClose={() => setCreateTarget(null)}
        onCreated={() => setCreateTarget(null)}
      />
    </TooltipProvider>
  );
}
