import { useCallback, useState } from 'react';
import type { CreateTarget } from '../components/create-workspace-dialog';
import { desktop, settle } from './desktop';

export function useWorkspaceActions(openCreate: (target: CreateTarget) => void) {
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const open = useCallback(async (path: string) => {
    setError(null);
    const result = await settle(desktop.workspace.open(path));
    if (!result.ok) setError(result.error);
    return result.ok;
  }, []);

  const choose = useCallback(async () => {
    setError(null);
    const picked = await desktop.workspace.choose();
    if (!picked) return false;
    if (picked.kind === 'project') return open(picked.path);
    if (picked.kind === 'empty') {
      openCreate({ parent: picked.path, name: '', fixed: true });
      return false;
    }
    setError(
      `“${picked.name}” isn’t an open-slide workspace. Pick a folder with one, an empty folder to set up, or create a new workspace.`,
    );
    return false;
  }, [open, openCreate]);

  const createNew = useCallback(async () => {
    setError(null);
    openCreate({
      parent: await desktop.workspace.defaultParent(),
      name: 'my-slides',
      fixed: false,
    });
  }, [openCreate]);

  const quickStart = useCallback(async () => {
    setError(null);
    setStarting(true);
    const result = await settle(desktop.workspace.createDefault());
    setStarting(false);
    if (!result.ok) setError(result.error);
  }, []);

  return { error, starting, open, choose, createNew, quickStart };
}
