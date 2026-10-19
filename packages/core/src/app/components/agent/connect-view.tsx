import { Check, Loader2, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { installProvider, useAgentState, useAgentStatus } from '@/lib/agent/use-agent';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { AgentProviderStatus } from '../../../agent/types';
import { ProviderLogo } from './provider-logo';

export function ConnectView({ className }: { className?: string }) {
  const t = useLocale();
  const { status, loading, enabled } = useAgentStatus();
  const { installing } = useAgentState();

  return (
    <div className={cn('flex flex-col gap-4 px-4 py-5', className)}>
      <div>
        <span className="eyebrow">{t.agent.title}</span>
        <h2 className="mt-1.5 font-heading text-[15px] font-semibold tracking-tight">
          {t.agent.connectTitle}
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {t.agent.connectDescription}
        </p>
      </div>

      {loading ? (
        <p className="text-[12px] text-muted-foreground">{t.agent.statusLoading}…</p>
      ) : !enabled ? (
        <p className="text-[12px] text-muted-foreground">{t.agent.disabled}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {status?.providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              packageManager={status.packageManager}
              installing={installing === provider.id}
              busy={installing !== null}
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
  onConnect,
}: {
  provider: AgentProviderStatus;
  packageManager: string;
  installing: boolean;
  busy: boolean;
  onConnect: () => void;
}) {
  const t = useLocale();
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
        ) : (
          <Button size="sm" disabled={busy} onClick={onConnect}>
            {installing ? (
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
            ) : null}
            {installing ? t.agent.connecting : t.agent.connect}
          </Button>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {provider.ready
          ? `${provider.sdkPackage} v${provider.sdkVersion}`
          : format(t.agent.connectInstallHint, { pkg: provider.sdkPackage, pm: packageManager })}
        {!provider.cliFound && ` ${format(t.agent.cliHint, { name: provider.name })}`}
      </p>
    </div>
  );
}
