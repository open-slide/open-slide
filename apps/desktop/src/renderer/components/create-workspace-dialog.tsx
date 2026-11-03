import { FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PackageManager } from '../../shared/types';
import { desktop, useAppState, useLog } from '../lib/desktop';
import { joinPath, sanitizeName, tildify } from '../lib/paths';
import { LineLoader, LogView } from './primitives';

// `fixed` initializes the folder the user picked instead of a new one below it.
export type CreateTarget = { parent: string; name: string; fixed: boolean };

type Phase = { kind: 'form' } | { kind: 'running' } | { kind: 'failed'; error: string };

export function CreateWorkspaceDialog({
  target,
  onClose,
  onCreated,
}: {
  target: CreateTarget | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const state = useAppState();
  const platform = state?.platform ?? 'darwin';
  const [name, setName] = useState('my-slides');
  const [parent, setParent] = useState('');
  const [managers, setManagers] = useState<PackageManager[]>([]);
  const [manager, setManager] = useState<PackageManager>('npm');
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [log, setLog] = useLog('create');

  useEffect(() => {
    if (!target) return;
    setPhase({ kind: 'form' });
    setLog('');
    setName(target.name);
    setParent(target.parent);
    void Promise.all([desktop.workspace.packageManagers(), desktop.settings.get()]).then(
      ([available, settings]) => {
        setManagers(available);
        const preferred = settings.packageManager;
        setManager(
          preferred && available.includes(preferred) ? preferred : (available[0] ?? 'npm'),
        );
      },
    );
  }, [target, setLog]);

  const fixed = target?.fixed ?? false;
  const folderName = fixed ? name : sanitizeName(name);
  const destination = parent ? joinPath(parent, folderName, platform) : '';
  const running = phase.kind === 'running';

  const create = async () => {
    setPhase({ kind: 'running' });
    setLog('');
    // A picked folder is set up in place, so its name never needs to be shell-safe.
    const request = fixed
      ? { parent: destination, name: '.', packageManager: manager }
      : { parent, name: folderName, packageManager: manager };
    const result = await desktop.workspace.create(request);
    if (result.ok) onCreated();
    else setPhase({ kind: 'failed', error: result.error });
  };

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open && !running) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]" showCloseButton={!running}>
        <DialogHeader>
          <DialogTitle>{fixed ? 'Set up this folder' : 'Create workspace'}</DialogTitle>
          <DialogDescription>
            Scaffolds an open-slide workspace with the authoring skills for Claude Code and Codex,
            then installs its dependencies.
          </DialogDescription>
        </DialogHeader>

        {phase.kind === 'form' ? (
          <form
            id="create-workspace"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            {!fixed && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workspace-name">Name</Label>
                <Input
                  id="workspace-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <div className="flex items-center gap-2">
                <p
                  className="selectable min-w-0 flex-1 truncate rounded-[5px] border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-[11.5px] text-muted-foreground"
                  title={destination}
                >
                  {tildify(destination) || '—'}
                </p>
                {!fixed && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const picked = await desktop.workspace.chooseParent();
                      if (picked) setParent(picked);
                    }}
                  >
                    <FolderOpen aria-hidden />
                    Choose…
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Package manager</Label>
              {managers.length > 0 ? (
                <ToggleGroup
                  variant="outline"
                  size="sm"
                  value={[manager]}
                  onValueChange={(value: string[]) => {
                    if (value[0]) setManager(value[0] as PackageManager);
                  }}
                >
                  {managers.map((pm) => (
                    <ToggleGroupItem key={pm} value={pm} className="font-mono">
                      {pm}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : (
                <p className="text-[12px] text-amber-600 dark:text-amber-400">
                  No package manager found on your PATH. Install Node.js, then try again.
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {running ? (
              <div className="flex items-center gap-3">
                <LineLoader className="w-24" />
                <span className="eyebrow">Creating workspace</span>
              </div>
            ) : (
              <p className="text-[12.5px] text-destructive">
                {phase.kind === 'failed' ? phase.error : null}
              </p>
            )}
            <LogView text={log} />
          </div>
        )}

        <DialogFooter>
          {phase.kind === 'form' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-workspace"
                disabled={!parent || managers.length === 0}
              >
                Create
              </Button>
            </>
          )}
          {phase.kind === 'failed' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setPhase({ kind: 'form' })}>Back</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
