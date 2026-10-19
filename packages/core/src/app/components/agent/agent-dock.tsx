import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentDock, useAgentStatus } from '@/lib/agent/use-agent';
import { useLocale } from '@/lib/use-locale';
import type { AgentTurnContext } from '../../../agent/types';
import { PANEL_TRANSITION_MS, usePanelMount } from '../panel/panel-shell';
import { AgentPanel } from './agent-panel';
import { ProviderLogo } from './provider-logo';

export const AGENT_DOCK_W = 380;

export function AgentDock({ context }: { context?: AgentTurnContext }) {
  const { open, setOpen } = useAgentDock();
  const { mounted, animVisible } = usePanelMount(open);
  if (import.meta.env.PROD || !mounted) return null;
  return (
    <div
      data-agent-dock
      inert={!open}
      aria-hidden={!open}
      className="flex h-full max-h-1/2 shrink-0 justify-end overflow-hidden border-l border-hairline bg-sidebar transition-[width] ease-swift motion-reduce:transition-none md:max-h-none"
      style={{
        width: animVisible ? AGENT_DOCK_W : 0,
        transitionDuration: `${PANEL_TRANSITION_MS}ms`,
      }}
    >
      <div className="h-full shrink-0" style={{ width: AGENT_DOCK_W }}>
        <AgentPanel context={context} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}

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
