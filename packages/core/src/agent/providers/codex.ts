import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { findOnPath, importWorkspacePackage } from '../detect.ts';
import {
  type AgentProvider,
  clipDetail,
  type ProviderEvent,
  type ProviderRunOptions,
  ProviderUnavailableError,
} from '../provider.ts';
import { AGENT_EFFORTS, type AgentEffort, type AgentModelOption } from '../types.ts';
import type { CodexItem, CodexSdkModule, CodexThreadEvent } from './sdk-types.ts';

export const CODEX_SDK_PACKAGE = '@openai/codex-sdk';

const CODEX_DEFAULT_MODEL: AgentModelOption = {
  id: '',
  label: 'Default',
  efforts: ['low', 'medium', 'high'],
};

function isEffort(value: unknown): value is AgentEffort {
  return typeof value === 'string' && (AGENT_EFFORTS as readonly string[]).includes(value);
}

// The Codex CLI caches the model list it shows in its own /model picker.
// Reading that keeps the panel in step with whatever the user's account can
// use, without a network call of our own.
export function parseCodexModelsCache(raw: unknown): AgentModelOption[] {
  const list = (raw as { models?: unknown } | null)?.models;
  if (!Array.isArray(list)) return [];
  const models: { option: AgentModelOption; priority: number }[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const m = entry as Record<string, unknown>;
    if (typeof m.slug !== 'string' || !m.slug) continue;
    if (m.visibility !== undefined && m.visibility !== 'list') continue;
    const levels = Array.isArray(m.supported_reasoning_levels) ? m.supported_reasoning_levels : [];
    const efforts = levels
      .map((l) => (l && typeof l === 'object' ? (l as { effort?: unknown }).effort : l))
      .filter(isEffort);
    models.push({
      option: {
        id: m.slug,
        label: typeof m.display_name === 'string' && m.display_name ? m.display_name : m.slug,
        efforts,
      },
      priority: typeof m.priority === 'number' ? m.priority : Number.MAX_SAFE_INTEGER,
    });
  }
  return models.sort((a, b) => a.priority - b.priority).map((m) => m.option);
}

async function readCodexModels(): Promise<AgentModelOption[]> {
  const home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  try {
    const raw = JSON.parse(await fs.readFile(path.join(home, 'models_cache.json'), 'utf8'));
    const models = parseCodexModelsCache(raw);
    return models.length > 0 ? models : [CODEX_DEFAULT_MODEL];
  } catch {
    return [CODEX_DEFAULT_MODEL];
  }
}

// The Codex SDK only reports completed items (no token deltas), so each
// agent message lands as one finished block.
export function createCodexMapper(emit: (event: ProviderEvent) => void) {
  const started = new Set<string>();
  let resultSeen = false;

  const startTool = (item: CodexItem, name: string, title: string, detail: string | null) => {
    if (started.has(item.id)) return;
    started.add(item.id);
    emit({ type: 'tool-start', id: item.id, name, title, detail });
  };

  const describe = (item: CodexItem): { name: string; title: string; detail: string | null } => {
    switch (item.type) {
      case 'command_execution':
        return { name: 'command', title: 'Run command', detail: clipDetail(item.command) };
      case 'file_change':
        return {
          name: 'file_change',
          title: 'Edit',
          detail: clipDetail(item.changes.map((c) => c.path).join(', ')),
        };
      case 'mcp_tool_call':
        return { name: 'mcp', title: `${item.server}: ${item.tool}`, detail: null };
      case 'web_search':
        return { name: 'web_search', title: 'Web search', detail: clipDetail(item.query) };
      default:
        return { name: item.type, title: item.type, detail: null };
    }
  };

  const handleItem = (phase: 'started' | 'updated' | 'completed', item: CodexItem) => {
    switch (item.type) {
      case 'agent_message': {
        if (phase !== 'completed' || !item.text.trim()) return;
        emit({ type: 'text-start', id: item.id });
        emit({ type: 'text-end', id: item.id, text: item.text });
        return;
      }
      case 'error':
        if (phase === 'completed') emit({ type: 'error', text: item.message });
        return;
      case 'reasoning':
      case 'todo_list':
        return;
      case 'command_execution':
      case 'file_change':
      case 'mcp_tool_call':
      case 'web_search': {
        const { name, title, detail } = describe(item);
        startTool(item, name, title, detail);
        if (phase === 'completed') {
          const status = 'status' in item ? item.status : 'completed';
          emit({ type: 'tool-end', id: item.id, ok: status !== 'failed' });
        }
        return;
      }
      default:
        return;
    }
  };

  return {
    get resultSeen() {
      return resultSeen;
    },
    handle(event: CodexThreadEvent): void {
      if (!event || typeof event !== 'object') return;
      switch (event.type) {
        case 'thread.started':
          emit({ type: 'session-id', id: (event as { thread_id: string }).thread_id });
          return;
        case 'item.started':
          handleItem('started', (event as { item: CodexItem }).item);
          return;
        case 'item.updated':
          handleItem('updated', (event as { item: CodexItem }).item);
          return;
        case 'item.completed':
          handleItem('completed', (event as { item: CodexItem }).item);
          return;
        case 'turn.failed':
          resultSeen = true;
          emit({ type: 'error', text: (event as { error: { message: string } }).error.message });
          emit({ type: 'result', durationMs: null, costUsd: null });
          return;
        case 'error':
          emit({ type: 'error', text: (event as { message: string }).message });
          return;
        case 'turn.completed':
          resultSeen = true;
          emit({ type: 'result', durationMs: null, costUsd: null });
          return;
        default:
          return;
      }
    },
  };
}

export function createCodexProvider(): AgentProvider {
  return {
    id: 'codex',
    name: 'Codex',
    sdkPackage: CODEX_SDK_PACKAGE,
    cliCommand: 'codex',
    models: readCodexModels,
    async run(opts: ProviderRunOptions): Promise<void> {
      const sdk = await importWorkspacePackage<CodexSdkModule>(opts.cwd, CODEX_SDK_PACKAGE);
      if (!sdk || typeof sdk.Codex !== 'function') throw new ProviderUnavailableError(this);

      const localCli = findOnPath('codex');
      const codex = new sdk.Codex(localCli ? { codexPathOverride: localCli } : {});
      const threadOptions = {
        workingDirectory: opts.cwd,
        skipGitRepoCheck: true,
        sandboxMode: 'workspace-write' as const,
        approvalPolicy: 'never' as const,
        ...(opts.model ? { model: opts.model } : {}),
        ...(opts.effort ? { modelReasoningEffort: opts.effort } : {}),
      };
      const thread = opts.resume
        ? codex.resumeThread(opts.resume, threadOptions)
        : codex.startThread(threadOptions);

      // Codex has no system-prompt hook, so the panel preamble rides on the
      // first turn of a thread only.
      const input = opts.resume ? opts.prompt : `${opts.systemPromptAppend}\n\n${opts.prompt}`;
      const mapper = createCodexMapper(opts.emit);
      const { events } = await thread.runStreamed(input, { signal: opts.signal });
      try {
        for await (const event of events) mapper.handle(event);
      } catch (err) {
        if (opts.signal.aborted || mapper.resultSeen) return;
        throw err;
      }
      if (thread.id) opts.emit({ type: 'session-id', id: thread.id });
    },
  };
}
