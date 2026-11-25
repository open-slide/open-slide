import { useCallback, useState } from 'react';
import type { AppState } from '../../shared/types';
import type { CreateTarget } from '../components/create-workspace-dialog';
import { desktop, settle } from './desktop';

export type WorkspaceChoiceProps = {
  state: AppState;
  error: string | null;
  starting: boolean;
  onChoose: () => void;
  onStart: () => void;
  onOpenRecent: (path: string) => void;
};

export const openWorkspace = (path: string) => void settle(desktop.workspace.open(path));

export function useWorkspaceActions(openCreate: (target: CreateTarget) => void) {
  const [starting, setStarting] = useState(false);

  const choose = useCallback(async () => {
    const picked = await desktop.workspace.choose().catch(() => null);
    if (picked) {
      openCreate({
        parent: picked.create,
        name: picked.inPlace ? '' : (picked.defaultName ?? 'slides'),
        inPlace: picked.inPlace,
      });
    }
  }, [openCreate]);

  const createNew = useCallback(async () => {
    openCreate({
      parent: await desktop.workspace.defaultParent(),
      name: 'my-slides',
      inPlace: false,
    });
  }, [openCreate]);

  const quickStart = useCallback(async () => {
    setStarting(true);
    await settle(desktop.workspace.createDefault());
    setStarting(false);
  }, []);

  return { starting, choose, createNew, quickStart };
}
