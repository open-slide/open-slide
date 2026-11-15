import { useCallback, useState } from 'react';
import type { CreateTarget } from '../components/create-workspace-dialog';
import { desktop, settle } from './desktop';

// Failures are not kept here: the main process owns them and reports them in
// the app state, so every window shows the same one wherever it was caused.
export function useWorkspaceActions(openCreate: (target: CreateTarget) => void) {
  const [starting, setStarting] = useState(false);

  const open = useCallback((path: string) => void settle(desktop.workspace.open(path)), []);

  const choose = useCallback(async () => {
    const picked = await desktop.workspace.choose().catch(() => null);
    if (picked) openCreate({ parent: picked.create, name: '', fixed: true });
  }, [openCreate]);

  const createNew = useCallback(async () => {
    openCreate({
      parent: await desktop.workspace.defaultParent(),
      name: 'my-slides',
      fixed: false,
    });
  }, [openCreate]);

  const quickStart = useCallback(async () => {
    setStarting(true);
    await settle(desktop.workspace.createDefault());
    setStarting(false);
  }, []);

  return { starting, open, choose, createNew, quickStart };
}
