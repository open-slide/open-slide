// Hand-written slices of the two agent SDKs' public types. The packages are
// resolved from the user's workspace at runtime and never installed here, so
// these cover only the fields the adapters read.

import type { AgentEffort } from '../types.ts';

type ClaudePermissionResult =
  | { behavior: 'allow'; updatedInput?: Record<string, unknown> }
  | { behavior: 'deny'; message: string; interrupt?: boolean };

export type ClaudeCanUseTool = (
  toolName: string,
  input: Record<string, unknown>,
  options: { signal: AbortSignal; toolUseID: string },
) => Promise<ClaudePermissionResult>;

type ClaudeQueryOptions = {
  cwd?: string;
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'dontAsk' | 'auto';
  settingSources?: ('user' | 'project' | 'local')[];
  systemPrompt?: { type: 'preset'; preset: 'claude_code'; append?: string };
  resume?: string;
  resumeSessionAt?: string;
  model?: string;
  effort?: Exclude<AgentEffort, 'minimal'>;
  includePartialMessages?: boolean;
  pathToClaudeCodeExecutable?: string;
  abortController?: AbortController;
  canUseTool?: ClaudeCanUseTool;
  stderr?: (data: string) => void;
};

export type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; is_error?: boolean; content?: unknown };

type ClaudeStreamEvent =
  | { type: 'content_block_start'; index: number; content_block: ClaudeContentBlock }
  | { type: 'content_block_delta'; index: number; delta: { type: string; text?: string } }
  | { type: 'content_block_stop'; index: number };

export type ClaudeSdkMessage =
  | { type: 'system'; subtype: 'init'; session_id: string; model?: string }
  | { type: 'system'; subtype: string; session_id?: string }
  | {
      type: 'assistant';
      uuid?: string;
      session_id: string;
      message: { content: ClaudeContentBlock[] };
      parent_tool_use_id: string | null;
    }
  | {
      type: 'user';
      uuid?: string;
      session_id?: string;
      message: { content: string | ClaudeContentBlock[] };
      parent_tool_use_id: string | null;
    }
  | {
      type: 'stream_event';
      session_id: string;
      event: ClaudeStreamEvent;
      parent_tool_use_id: string | null;
    }
  | {
      type: 'result';
      subtype: 'success' | string;
      session_id: string;
      duration_ms?: number;
      total_cost_usd?: number;
      is_error?: boolean;
      result?: string;
      errors?: string[];
    };

export type ClaudeSdkModule = {
  query: (args: {
    prompt: string;
    options?: ClaudeQueryOptions;
  }) => AsyncIterable<ClaudeSdkMessage>;
};

type CodexOptions = { codexPathOverride?: string };

type CodexThreadOptions = {
  workingDirectory?: string;
  skipGitRepoCheck?: boolean;
  sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access';
  approvalPolicy?: 'never' | 'on-request' | 'on-failure' | 'untrusted';
  model?: string;
  modelReasoningEffort?: AgentEffort;
};

export type CodexItem =
  | { type: 'agent_message'; id: string; text: string }
  | { type: 'reasoning'; id: string; text: string }
  | {
      type: 'command_execution';
      id: string;
      command: string;
      aggregated_output?: string;
      exit_code?: number;
      status: 'in_progress' | 'completed' | 'failed';
    }
  | {
      type: 'file_change';
      id: string;
      changes: { path: string; kind: 'add' | 'delete' | 'update' }[];
      status: 'completed' | 'failed';
    }
  | {
      type: 'mcp_tool_call';
      id: string;
      server: string;
      tool: string;
      status: 'in_progress' | 'completed' | 'failed';
    }
  | { type: 'web_search'; id: string; query: string }
  | { type: 'todo_list'; id: string; items: { text: string; completed: boolean }[] }
  | { type: 'error'; id: string; message: string };

export type CodexThreadEvent =
  | { type: 'thread.started'; thread_id: string }
  | { type: 'turn.started' }
  | { type: 'turn.completed'; usage: unknown }
  | { type: 'turn.failed'; error: { message: string } }
  | { type: 'item.started'; item: CodexItem }
  | { type: 'item.updated'; item: CodexItem }
  | { type: 'item.completed'; item: CodexItem }
  | { type: 'error'; message: string };

type CodexThread = {
  id: string | null;
  runStreamed: (
    input: string,
    turnOptions?: { signal?: AbortSignal },
  ) => Promise<{ events: AsyncIterable<CodexThreadEvent> }>;
};

export type CodexSdkModule = {
  Codex: new (
    options?: CodexOptions,
  ) => {
    startThread: (options?: CodexThreadOptions) => CodexThread;
    resumeThread: (id: string, options?: CodexThreadOptions) => CodexThread;
  };
};
