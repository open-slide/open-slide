import { useEffect, useRef, useState } from 'react';
import { type AgentActivity, setDockOpen, useAgentState } from '@/lib/agent/use-agent';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { ProviderLogo } from './provider-logo';

// `revision` changes whenever the deck module reloads, so each write the
// agent lands sweeps a band of light across the canvas.
export function AgentPresence({
  activity,
  revision,
}: {
  activity: AgentActivity;
  revision: unknown;
}) {
  const [sweep, setSweep] = useState(0);
  const first = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: revision is the trigger
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSweep((n) => n + 1);
  }, [revision]);

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]">
        <span className="agent-glow" />
        <span className="agent-ring" />
        {sweep > 0 && <span key={sweep} className="agent-sweep" />}
      </div>
      <AgentPresencePill activity={activity} />
    </>
  );
}

function AgentPresencePill({ activity }: { activity: AgentActivity }) {
  const t = useLocale();
  const { status } = useAgentState();
  const name = status?.providers.find((p) => p.id === activity.provider)?.name ?? '';
  const waiting = activity.phase === 'waiting';
  const step =
    activity.phase === 'tool'
      ? [activity.title, activity.detail?.split(/[\\/]/).pop()].filter(Boolean).join(' ')
      : waiting
        ? t.agent.presenceWaiting
        : t.agent.presenceThinking;

  return (
    <button
      type="button"
      onClick={() => setDockOpen(true)}
      className="island-enter absolute top-2 left-1/2 z-20 flex h-7 max-w-[min(420px,calc(100%-1rem))] -translate-x-1/2 items-center gap-2 rounded-full border border-hairline bg-popover/90 px-2.5 text-[11.5px] shadow-floating backdrop-blur-md md:top-3"
    >
      <ProviderLogo provider={activity.provider} className="size-3.5 shrink-0" />
      <span className="shrink-0 font-medium">
        {format(t.agent.presenceEditing, { provider: name })}
      </span>
      <span
        aria-hidden
        className={cn(
          'size-1 shrink-0 rounded-full',
          waiting ? 'bg-brand' : 'animate-pulse bg-foreground/50 motion-reduce:animate-none',
        )}
      />
      <span className={cn('min-w-0 truncate', waiting ? 'text-brand' : 'agent-shimmer')}>
        {step}
      </span>
    </button>
  );
}
