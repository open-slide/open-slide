import { FolderOpen, Package, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AppState } from '../../shared/types';
import { desktop, useLog } from '../lib/desktop';
import { LineLoader, LogView } from './primitives';

export function ServerScreen({
  state,
  onChooseWorkspace,
}: {
  state: AppState;
  onChooseWorkspace: () => void;
}) {
  const { server, workspace } = state;
  const [installLog] = useLog('install');
  const [serverLog, setServerLog] = useLog('server');
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    if (server.state === 'error') void desktop.server.log().then(setServerLog);
  }, [server.state, setServerLog]);

  if (server.state === 'not-installed') {
    return (
      <Centered>
        <Package className="size-5 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 font-heading text-[17px] font-semibold tracking-tight">
          Install this workspace
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{workspace?.name}</span> hasn’t installed
          the packages its slides depend on yet. open-slide will run{' '}
          <code className="font-mono text-[12px]">{server.packageManager} install</code> in the
          workspace.
        </p>
        {installError && <p className="mt-3 text-[12.5px] text-destructive">{installError}</p>}
        <div className="mt-5 flex gap-2">
          <Button
            onClick={async () => {
              setInstallError(null);
              const result = await desktop.workspace.install();
              if (!result.ok) setInstallError(result.error);
            }}
          >
            Install dependencies
          </Button>
          <Button variant="outline" onClick={onChooseWorkspace}>
            <FolderOpen aria-hidden />
            Open another…
          </Button>
        </div>
        {installLog && <LogView text={installLog} className="mt-5 w-full" />}
      </Centered>
    );
  }

  if (server.state === 'error') {
    return (
      <Centered>
        <span className="eyebrow text-destructive">Dev server stopped</span>
        <h2 className="mt-2 font-heading text-[17px] font-semibold tracking-tight">
          {workspace?.name} couldn’t start
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{server.message}</p>
        <div className="mt-5 flex gap-2">
          <Button onClick={() => desktop.server.restart()}>
            <RotateCw aria-hidden />
            Try again
          </Button>
          <Button variant="outline" onClick={onChooseWorkspace}>
            <FolderOpen aria-hidden />
            Open another…
          </Button>
        </div>
        <LogView text={serverLog} className="mt-5 w-full" />
      </Centered>
    );
  }

  const installing = server.state === 'installing';
  return (
    <Centered>
      <div className="flex flex-col items-center gap-4 self-center">
        <LineLoader />
        <span className="eyebrow text-[11.5px]">
          {installing ? 'Installing dependencies' : 'Starting dev server'}
        </span>
      </div>
      {installing && <LogView text={installLog} className="mt-6 w-full" />}
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-6 pb-10">
      <div className="rise-in flex w-full max-w-[520px] flex-col items-start">{children}</div>
    </div>
  );
}
