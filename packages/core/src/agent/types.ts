export type AgentProviderId = 'claude' | 'codex';

export type AgentProviderStatus = {
  id: AgentProviderId;
  name: string;
  sdkPackage: string;
  sdkInstalled: boolean;
  sdkVersion: string | null;
  cliCommand: string;
  cliFound: boolean;
  cliVersion: string | null;
  ready: boolean;
};

export type AgentStatus = {
  enabled: boolean;
  packageManager: string;
  providers: AgentProviderStatus[];
};

export type AgentQuestionOption = { label: string; description?: string };

export type AgentQuestion = {
  header: string;
  question: string;
  options: AgentQuestionOption[];
  multiSelect: boolean;
};

export type AgentItem =
  | { kind: 'user'; id: string; ts: string; text: string }
  | { kind: 'assistant'; id: string; ts: string; text: string; streaming: boolean }
  | {
      kind: 'tool';
      id: string;
      ts: string;
      name: string;
      title: string;
      detail: string | null;
      status: 'running' | 'done' | 'error';
    }
  | {
      kind: 'question';
      id: string;
      ts: string;
      questions: AgentQuestion[];
      answers: Record<string, string> | null;
      status: 'pending' | 'answered' | 'cancelled';
    }
  | {
      kind: 'permission';
      id: string;
      ts: string;
      tool: string;
      title: string;
      detail: string | null;
      status: 'pending' | 'allowed' | 'denied';
    }
  | { kind: 'error'; id: string; ts: string; text: string }
  | {
      kind: 'result';
      id: string;
      ts: string;
      durationMs: number | null;
      costUsd: number | null;
      aborted: boolean;
    };

export type AgentSessionStatus = 'idle' | 'running';

export type AgentSessionSummary = {
  id: string;
  provider: AgentProviderId;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: AgentSessionStatus;
  slideId: string | null;
};

export type AgentSession = AgentSessionSummary & {
  providerSessionId: string | null;
  items: AgentItem[];
};

export type AgentTurnContext = {
  slideId?: string;
  slideTitle?: string;
  pageNumber?: number;
  totalPages?: number;
  pendingComments?: number;
  selection?: { line: number; column: number; tagName: string; text: string } | null;
  newDeck?: boolean;
};

export type AgentWsEvent =
  | { type: 'session'; session: AgentSessionSummary }
  | { type: 'session-removed'; sessionId: string }
  | { type: 'item'; sessionId: string; item: AgentItem }
  | { type: 'delta'; sessionId: string; itemId: string; text: string };

export const AGENT_WS_EVENT = 'open-slide:agent';

export function sessionSummary(session: AgentSession): AgentSessionSummary {
  const { providerSessionId: _p, items: _i, ...summary } = session;
  return summary;
}
