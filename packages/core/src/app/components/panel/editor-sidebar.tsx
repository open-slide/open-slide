import { type ReactNode, useState } from 'react';
import { AGENT_DOCK_W } from '@/components/agent/agent-dock';
import { InspectorPanel } from '@/components/inspector/inspector-panel';
import { useInspector } from '@/components/inspector/inspector-provider';
import { useDesignPanelState } from '@/components/style-panel/design-provider';
import { DesignPanel } from '@/components/style-panel/style-panel';
import { useLocale } from '@/lib/use-locale';
import { PANEL_TRANSITION_MS, PANEL_W, usePanelMount } from './panel-shell';
import { ResizeHandle, useStoredWidth } from './resize-handle';

type Mode = 'format' | 'design' | 'agent';

const AGENT_MIN_W = 300;
const EDITOR_MAX_W = 480;
const AGENT_MAX_W = 720;

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
  const t = useLocale();
  const { active, panelOpen } = useInspector();
  const [editorWidth, setEditorWidth] = useStoredWidth(
    'open-slide:editor-panel-width',
    PANEL_W,
    PANEL_W,
    EDITOR_MAX_W,
  );
  const [agentWidth, setAgentWidth] = useStoredWidth(
    'open-slide:agent-panel-width',
    AGENT_DOCK_W,
    AGENT_MIN_W,
    AGENT_MAX_W,
  );
  const [resizing, setResizing] = useState(false);
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
  const isAgent = shown === 'agent';
  const [lastEditor, setLastEditor] = useState<'format' | 'design'>('format');
  if (!isAgent && shown !== lastEditor) setLastEditor(shown);
  const [agentMounted, setAgentMounted] = useState(false);
  if (isAgent && !agentMounted) setAgentMounted(true);
  const open = mode !== null;
  const { mounted, animVisible } = usePanelMount(open);

  if (!mounted) return null;

  const width = isAgent ? agentWidth : editorWidth;

  return (
    <div
      data-editor-sidebar
      data-agent-dock={isAgent ? '' : undefined}
      inert={!open}
      aria-hidden={!open}
      className="relative flex h-full max-h-1/2 shrink-0 justify-end overflow-hidden bg-sidebar transition-[width] ease-swift motion-reduce:transition-none md:max-h-none"
      style={{
        width: animVisible ? width : 0,
        transitionDuration: resizing ? '0ms' : `${PANEL_TRANSITION_MS}ms`,
      }}
    >
      {open && (
        <ResizeHandle
          key={isAgent ? 'agent' : 'editor'}
          width={width}
          min={isAgent ? AGENT_MIN_W : PANEL_W}
          max={isAgent ? AGENT_MAX_W : EDITOR_MAX_W}
          defaultWidth={isAgent ? AGENT_DOCK_W : PANEL_W}
          edge="left"
          label={t.slide.resizeSidePanel}
          onResize={isAgent ? setAgentWidth : setEditorWidth}
          onResizingChange={setResizing}
          className="left-0 hidden md:block"
        />
      )}
      {agentMounted && (
        <div
          className="sidebar-swap h-full shrink-0"
          style={{ width: agentWidth }}
          hidden={!isAgent}
        >
          {agent}
        </div>
      )}
      {!isAgent && (
        <div className="sidebar-swap flex h-full shrink-0" style={{ width: editorWidth }}>
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
