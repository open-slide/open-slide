import { Check, Loader2, RotateCw, Terminal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  installProvider,
  refreshStatus,
  useAgentState,
  useAgentStatus,
} from '@/lib/agent/use-agent';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { AgentProviderId, AgentProviderStatus } from '../../../agent/types';
import { ProviderLogo } from './provider-logo';

const CLI_INSTALL: Record<AgentProviderId, string> = {
  claude: 'npm install -g @anthropic-ai/claude-code',
  codex: 'npm install -g @openai/codex',
};

function needsCli(p: AgentProviderStatus): boolean {
  return !p.cliFound && !p.ready;
}

export function ConnectView() {
  const t = useLocale();
  const { status, loading, enabled } = useAgentStatus();
  const { installing, connectErrors } = useAgentState();
  const [checking, setChecking] = useState(false);
  const providers = status?.providers ?? [];
  const needCli = providers.length > 0 && providers.every(needsCli);
  const anyMissing = providers.some(needsCli);

  const checkAgain = async () => {
    setChecking(true);
    try {
      await refreshStatus();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div>
        <span className="eyebrow">{t.agent.title}</span>
        <h2 className="mt-1.5 font-heading text-[15px] font-semibold tracking-tight">
          {needCli ? t.agent.needCliTitle : t.agent.connectTitle}
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {needCli ? t.agent.needCliDescription : t.agent.connectDescription}
        </p>
      </div>

      {loading ? (
        <p className="text-[12px] text-muted-foreground">{t.agent.statusLoading}…</p>
      ) : !enabled ? (
        <p className="text-[12px] text-muted-foreground">{t.agent.disabled}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              packageManager={status?.packageManager ?? 'npm'}
              installing={installing === provider.id}
              busy={installing !== null}
              error={connectErrors[provider.id]}
              onConnect={async () => {
                try {
                  await installProvider(provider.id);
                  toast.success(format(t.agent.toastConnected, { name: provider.name }));
                } catch (err) {
                  toast.error(format(t.agent.toastConnectFailed, { pkg: provider.sdkPackage }), {
                    description: err instanceof Error ? err.message : undefined,
                  });
                }
              }}
            />
          ))}
          {anyMissing && (
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              disabled={checking}
              onClick={checkAgain}
            >
              <RotateCw
                className={cn('size-3.5', checking && 'animate-spin motion-reduce:animate-none')}
                aria-hidden
              />
              {t.agent.checkAgain}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  packageManager,
  installing,
  busy,
  error,
  onConnect,
}: {
  provider: AgentProviderStatus;
  packageManager: string;
  installing: boolean;
  busy: boolean;
  error: string | undefined;
  onConnect: () => void;
}) {
  const t = useLocale();
  const missing = needsCli(provider);
  const cliLabel = provider.cliFound
    ? provider.cliVersion
      ? format(t.agent.cliFound, { version: provider.cliVersion })
      : t.agent.cliFoundNoVersion
    : t.agent.cliMissing;

  return (
    <div className="rounded-[8px] border border-border bg-card p-3 shadow-edge">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-heading text-[13px] font-semibold tracking-tight">
            <ProviderLogo provider={provider.id} className="size-3.5 shrink-0" />
            {provider.name}
          </h3>
          <p
            className={cn(
              'mt-0.5 flex items-center gap-1 text-[11px]',
              provider.cliFound ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400',
            )}
          >
            <Terminal className="size-3" aria-hidden />
            {cliLabel}
          </p>
        </div>
        {provider.ready ? (
          <span className="inline-flex items-center gap-1 rounded-[5px] bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="size-3" aria-hidden />
            {t.agent.connected}
          </span>
        ) : installing ? (
          <span className="inline-flex items-center gap-1.5 px-1 text-[11.5px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden />
            {t.agent.connecting}
          </span>
        ) : missing ? null : (
          <Button
            size="sm"
            variant={error ? 'outline' : 'default'}
            disabled={busy}
            onClick={onConnect}
          >
            {error ? t.agent.retry : t.agent.connect}
          </Button>
        )}
      </div>
      {missing ? (
        <div className="mt-2.5 flex flex-col gap-1.5">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {format(t.agent.cliHint, { name: provider.name })}
          </p>
          <code className="block overflow-x-auto rounded-[5px] bg-muted px-2 py-1.5 font-mono text-[11px] whitespace-nowrap select-all">
            {CLI_INSTALL[provider.id]}
          </code>
        </div>
      ) : error && !installing ? (
        <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {provider.ready
            ? `${provider.sdkPackage} v${provider.sdkVersion}`
            : format(t.agent.connectInstallHint, { pkg: provider.sdkPackage, pm: packageManager })}
        </p>
      )}
    </div>
  );
}
