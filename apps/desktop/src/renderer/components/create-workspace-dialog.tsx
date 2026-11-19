import { FolderOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { cn } from '@/lib/utils';
import type { PackageManager } from '../../shared/types';
import { desktop, settle, useAppState, useLog } from '../lib/desktop';
import { joinPath, sanitizeName, tildify } from '../lib/paths';
import { LoadingLabel, LogView, Segmented } from './primitives';

// `fixed` scaffolds into `parent` itself instead of a new folder below it.
export type CreateTarget = { parent: string; name: string; fixed: boolean };

type Phase = { kind: 'form' } | { kind: 'running' } | { kind: 'failed'; error: string };

export function CreateWorkspaceDialog({
  target,
  onClose,
}: {
  target: CreateTarget | null;
  onClose: () => void;
}) {
  const state = useAppState();
  const platform = state?.platform ?? 'darwin';
  const [name, setName] = useState('my-slides');
  const [parent, setParent] = useState('');
  const [managers, setManagers] = useState<PackageManager[] | null>(null);
  const [manager, setManager] = useState<PackageManager>('npm');
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [log, setLog] = useLog('create');
  const [shown, setShown] = useState<CreateTarget | null>(null);
  const creating = useRef(false);

  useEffect(() => {
    // A menu request for another workspace mid-creation must not replace the running one.
    if (creating.current) return;
    setShown(target);
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
      () => setManagers([]),
    );
  }, [target, setLog]);

  const fixed = shown?.fixed ?? false;
  const folderName = sanitizeName(name);
  const destination = fixed || !parent ? parent : joinPath(parent, folderName, platform);
  const running = phase.kind === 'running';

  const create = async () => {
    creating.current = true;
    setPhase({ kind: 'running' });
    setLog('');
    const result = await settle(
      desktop.workspace.create({
        parent,
        name: fixed ? '.' : folderName,
        packageManager: manager,
      }),
    );
    creating.current = false;
    if (result.ok) onClose();
    else setPhase({ kind: 'failed', error: result.error });
  };

  return (
    <Dialog
      open={shown !== null}
      onOpenChange={(open) => {
        if (!open && !running) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          'top-12 translate-y-0 rounded-[12px] sm:max-w-[480px]',
          'transition-[translate,opacity] duration-200 ease-(--ease-swift)',
          'data-starting-style:scale-100 motion-safe:data-starting-style:-translate-y-3',
          'data-ending-style:scale-100 motion-safe:data-ending-style:-translate-y-3',
        )}
      >
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
              {managers === null ? (
                <LoadingLabel>Finding package managers</LoadingLabel>
              ) : managers.length > 0 ? (
                <Segmented
                  mono
                  value={manager}
                  options={managers}
                  onChange={(next) => next && setManager(next)}
                />
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
              <LoadingLabel>Creating workspace</LoadingLabel>
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
              <Button type="submit" form="create-workspace" disabled={!parent || !managers?.length}>
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
