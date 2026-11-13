import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentDock, useAgentStatus } from '@/lib/agent/use-agent';
import { useLocale } from '@/lib/use-locale';
import { ProviderLogo } from './provider-logo';

export const AGENT_DOCK_W = 380;

export function AgentToggleButton() {
  const t = useLocale();
  const { open, toggle } = useAgentDock();
  const { provider } = useAgentStatus();
  if (import.meta.env.PROD) return null;
  return (
    <Button
      size="sm"
      variant={open ? 'default' : 'ghost'}
      onClick={toggle}
      aria-pressed={open}
      aria-label={t.agent.openTitle}
      title={t.agent.openTitle}
      data-agent-ui
    >
      {provider ? (
        <ProviderLogo provider={provider.id} className="size-3.5" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
      <span className="hidden lg:inline">{t.agent.open}</span>
      <kbd className="ml-1 hidden rounded-[3px] bg-foreground/10 px-1 font-mono text-[9.5px] tracking-[0.04em] lg:inline">
        A
      </kbd>
    </Button>
  );
}
