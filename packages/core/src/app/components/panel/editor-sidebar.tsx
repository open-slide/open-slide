import { type ReactNode, useState } from 'react';
import { AGENT_DOCK_W } from '@/components/agent/agent-dock';
import { InspectorPanel } from '@/components/inspector/inspector-panel';
import { useInspector } from '@/components/inspector/inspector-provider';
import { useDesignPanelState } from '@/components/style-panel/design-provider';
import { DesignPanel } from '@/components/style-panel/style-panel';
import { PANEL_TRANSITION_MS, PANEL_W, usePanelMount } from './panel-shell';

type Mode = 'format' | 'design' | 'agent';

// The agent shares this container with Format and Design so switching between
// them only retargets one width transition instead of collapsing one column
// while another grows.
export function EditorSidebar({
  designOpen,
  onCloseDesign,
  agentOpen = false,
  agent,
}: {
  designOpen: boolean;
  onCloseDesign: () => void;
  agentOpen?: boolean;
  agent?: ReactNode;
}) {
  const { active, panelOpen } = useInspector();
  const { loaded, draft } = useDesignPanelState();
  const [preferredTab, setPreferredTab] = useState<'format' | 'arrange'>('format');
  const mode: Mode | null =
    agentOpen && agent
      ? 'agent'
      : designOpen
        ? loaded && draft
          ? 'design'
          : null
        : active && panelOpen
          ? 'format'
          : null;
  const [lastMode, setLastMode] = useState<Mode>('format');
  if (mode && mode !== lastMode) setLastMode(mode);
  const shown = mode ?? lastMode;
  const [lastEditor, setLastEditor] = useState<'format' | 'design'>('format');
  if (shown !== 'agent' && shown !== lastEditor) setLastEditor(shown);
  const [agentMounted, setAgentMounted] = useState(false);
  if (shown === 'agent' && !agentMounted) setAgentMounted(true);
  const open = mode !== null;
  const { mounted, animVisible } = usePanelMount(open);

  if (!mounted) return null;

  const width = shown === 'agent' ? AGENT_DOCK_W : PANEL_W;

  return (
    <div
      data-editor-sidebar
      data-agent-dock={shown === 'agent' ? '' : undefined}
      inert={!open}
      aria-hidden={!open}
      className="flex h-full max-h-1/2 shrink-0 justify-end overflow-hidden bg-sidebar transition-[width] ease-swift motion-reduce:transition-none md:max-h-none"
      style={{
        width: animVisible ? width : 0,
        transitionDuration: `${PANEL_TRANSITION_MS}ms`,
      }}
    >
      {agentMounted && (
        <div
          className="sidebar-swap h-full shrink-0 border-l border-hairline"
          style={{ width: AGENT_DOCK_W }}
          hidden={shown !== 'agent'}
        >
          {agent}
        </div>
      )}
      {shown !== 'agent' && (
        <div className="sidebar-swap flex h-full">
          {lastEditor === 'design' ? (
            <DesignPanel onClose={onCloseDesign} />
          ) : (
            <InspectorPanel preferredTab={preferredTab} onTabChange={setPreferredTab} />
          )}
        </div>
      )}
    </div>
  );
}
