import { AgentPanel } from '@/components/agent/agent-panel';

export function AgentPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[860px] flex-1 flex-col md:py-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-sidebar md:rounded-[10px] md:border md:border-hairline">
          <AgentPanel />
        </div>
      </div>
    </div>
  );
}
