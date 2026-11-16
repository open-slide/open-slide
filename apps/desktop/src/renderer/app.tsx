import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { WorkspaceError } from '../shared/types';
import { type CreateTarget, CreateWorkspaceDialog } from './components/create-workspace-dialog';
import { ServerScreen } from './components/server-screen';
import { SettingsWindow } from './components/settings';
import { TabStrip } from './components/tab-strip';
import { Welcome } from './components/welcome';
import { desktop, useAppState, useWindowAppearance } from './lib/desktop';
import { useWorkspaceActions } from './lib/workspace-actions';

// First-run only, so the everyday windows never parse them.
const Intro = lazy(() => import('./components/intro').then((m) => ({ default: m.Intro })));
const Onboarding = lazy(() =>
  import('./components/onboarding').then((m) => ({ default: m.Onboarding })),
);

const route = window.location.hash.slice(1);
document.documentElement.dataset.route = route || 'main';

export function App() {
  return route === 'intro' ? (
    <Suspense>
      <Intro />
    </Suspense>
  ) : (
    <Shell />
  );
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

  // Welcome and the tour show a failure in place; every other screen has no
  // room for it, so it is raised as a sheet.
  const error = state?.workspaceError ?? null;
  const inlineError = screen === 'welcome' || screen === 'onboarding';
  const raisedError = inlineError || createTarget !== null ? null : error;

  // Tab contents are native views stacked above this page, so anything the
  // shell draws in the content area (screens, dialogs) needs them hidden.
  const overlay = screen !== 'tabs' || createTarget !== null || raisedError !== null;
  useEffect(() => desktop.setOverlay(overlay), [overlay]);

  if (!state) return null;

  // The restored tabs are known before the server is up, so they show while
  // it boots and can already be switched, closed, and reordered.
  const booting =
    screen === 'server' && (state.server.state === 'idle' || state.server.state === 'starting');

  return (
    <TooltipProvider delay={200}>
      <div className="flex h-full flex-col text-foreground">
        <TabStrip state={state} showTabs={screen === 'tabs' || booting} />
        <main className="relative min-h-0 flex-1">
          {screen === 'onboarding' && (
            <Suspense>
              <Onboarding
                state={state}
                error={error?.message ?? null}
                starting={actions.starting}
                onChoose={chooseWorkspace}
                onStart={() => void actions.quickStart()}
                onOpenRecent={actions.open}
              />
            </Suspense>
          )}
          {screen === 'welcome' && (
            <Welcome
              state={state}
              error={error?.message ?? null}
              starting={actions.starting}
              onChoose={chooseWorkspace}
              onStart={() => void actions.quickStart()}
              onOpenRecent={actions.open}
            />
          )}
          {screen === 'server' && (
            <ServerScreen
              key={state.workspace?.root}
              state={state}
              onChooseWorkspace={chooseWorkspace}
            />
          )}
        </main>
      </div>
      <CreateWorkspaceDialog
        target={createTarget}
        onClose={() => setCreateTarget(null)}
        onCreated={() => setCreateTarget(null)}
      />
      <WorkspaceErrorDialog error={raisedError} />
    </TooltipProvider>
  );
}

function WorkspaceErrorDialog({ error }: { error: WorkspaceError | null }) {
  // The message stays up while the sheet animates out.
  const [shown, setShown] = useState(error);
  if (error && error !== shown) setShown(error);
  const dismiss = () => {
    if (error) desktop.workspace.dismissError(error.id);
  };
  return (
    <Dialog
      open={error !== null}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-12 translate-y-0 rounded-[12px] sm:max-w-[440px]"
      >
        <DialogHeader>
          <DialogTitle>Couldn’t open the workspace</DialogTitle>
          <DialogDescription className="selectable break-words">{shown?.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button autoFocus onClick={dismiss}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
