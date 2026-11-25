import { Check, ChevronDown, Lock, LockOpen, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  resolveModelChoice,
  setAutoApprove,
  setModelChoice,
  type useAgentStatus,
} from '@/lib/agent/use-agent';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { AgentEffort, AgentModelOption, AgentProviderId } from '../../../agent/types';
import { ProviderLogo } from './provider-logo';

type AgentStatusState = ReturnType<typeof useAgentStatus>;

function modelLabel(model: AgentModelOption, t: ReturnType<typeof useLocale>): string {
  return model.id ? model.label : t.agent.modelDefault;
}

export function ModelMenu({
  status,
  providerId,
  model,
  effort,
  modelChoices,
  onManage,
}: {
  status: AgentStatusState['status'];
  providerId: AgentProviderId | null;
  model: AgentModelOption | null;
  effort: AgentEffort | null;
  modelChoices: AgentStatusState['modelChoices'];
  onManage: () => void;
}) {
  const t = useLocale();
  const [open, setOpen] = useState(false);
  const providers = status?.enabled ? status.providers : [];
  const [tab, setTab] = useState<AgentProviderId | null>(providerId);
  const shownId = tab ?? providerId ?? providers[0]?.id ?? null;
  const shown = providers.find((p) => p.id === shownId) ?? null;
  const choice = shown?.ready ? resolveModelChoice(shown.models, modelChoices[shown.id]) : null;
  const selectedModel = shown?.id === providerId ? (model ?? choice?.model) : choice?.model;
  const selectedEffort = shown?.id === providerId ? effort : (choice?.effort ?? null);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setTab(providerId);
      }}
    >
      <PopoverTrigger
        type="button"
        className="flex h-7 min-w-0 items-center gap-1.5 rounded-[6px] px-1.5 text-[12px] text-muted-foreground outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        {providerId && <ProviderLogo provider={providerId} className="size-3.5 shrink-0" />}
        <span className="truncate font-medium text-foreground">
          {model ? modelLabel(model, t) : t.agent.title}
        </span>
        {effort && <span className="shrink-0">{t.agent.efforts[effort]}</span>}
        <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[272px] p-1.5"
        data-agent-model-menu
      >
        {providers.length > 1 && (
          <div role="tablist" className="mb-1.5 flex gap-0.5 rounded-[6px] bg-muted p-0.5">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === shownId}
                onClick={() => setTab(p.id)}
                className={cn(
                  'flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[5px] text-[12px] font-medium text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
                  p.id === shownId && 'bg-background text-foreground shadow-edge',
                )}
              >
                <ProviderLogo provider={p.id} className="size-3.5 shrink-0" />
                {p.name}
              </button>
            ))}
          </div>
        )}

        {shown && !shown.ready ? (
          <div className="flex flex-col items-start gap-2 px-2 py-2.5">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {shown.cliFound
                ? format(t.agent.connectInstallHint, {
                    pkg: shown.sdkPackage,
                    pm: status?.packageManager ?? 'npm',
                  })
                : format(t.agent.cliHint, { name: shown.name })}
            </p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
            >
              {t.agent.connect}
            </Button>
          </div>
        ) : shown ? (
          <div className="flex flex-col gap-px">
            {shown.models.map((m) => {
              const checked = m.id === selectedModel?.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() =>
                    setModelChoice(shown.id, {
                      model: m.id,
                      effort: modelChoices[shown.id]?.effort ?? null,
                    })
                  }
                  className={cn(
                    'flex h-7 items-center justify-between gap-2 rounded-[5px] px-2 text-left text-[12.5px] outline-none transition-colors duration-100 hover:bg-muted focus-visible:bg-muted',
                    checked && 'font-medium',
                  )}
                >
                  <span className="truncate">{modelLabel(m, t)}</span>
                  {checked && <Check className="size-3.5 shrink-0" aria-hidden />}
                </button>
              );
            })}
          </div>
        ) : null}

        {shown?.ready && selectedModel && selectedModel.efforts.length > 0 && (
          <div className="mt-1.5 border-t border-hairline px-1 pt-2 pb-1">
            <div className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">
              {t.agent.reasoning}
            </div>
            <div className="flex gap-0.5 rounded-[6px] bg-muted p-0.5">
              {([null, ...selectedModel.efforts] as (AgentEffort | null)[]).map((e) => {
                const checked = e === selectedEffort;
                return (
                  <button
                    key={e ?? 'auto'}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => setModelChoice(shown.id, { model: selectedModel.id, effort: e })}
                    className={cn(
                      'h-6 min-w-0 flex-1 truncate rounded-[4px] px-1 text-[11.5px] text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
                      checked && 'bg-background font-medium text-foreground shadow-edge',
                    )}
                  >
                    {e ? t.agent.efforts[e] : t.agent.effortAuto}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-1.5 border-t border-hairline pt-1.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onManage();
            }}
            className="flex h-7 w-full items-center gap-2 rounded-[5px] px-2 text-[12.5px] text-muted-foreground outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:bg-muted"
          >
            <Settings2 className="size-3.5" />
            {t.agent.manageConnections}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AutoApproveToggle({ autoApprove }: { autoApprove: boolean }) {
  const t = useLocale();
  return (
    <button
      type="button"
      aria-pressed={autoApprove}
      aria-label={t.agent.autoApprove}
      title={t.agent.autoApproveHint}
      onClick={() => setAutoApprove(!autoApprove)}
      className={cn(
        'flex h-7 min-w-7 shrink-0 items-center justify-center gap-1 rounded-[6px] px-1.5 text-[12px] text-muted-foreground outline-none transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
        autoApprove && 'bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand',
      )}
    >
      {autoApprove ? (
        <>
          <LockOpen className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{t.agent.autoApprove}</span>
        </>
      ) : (
        <Lock className="size-3.5 shrink-0" aria-hidden />
      )}
    </button>
  );
}
