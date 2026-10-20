import { findOnPath, importWorkspacePackage } from '../detect.ts';
import {
  type AgentProvider,
  clipDetail,
  type ProviderEvent,
  type ProviderRunOptions,
  ProviderUnavailableError,
  parseQuestions,
  relativeToCwd,
} from '../provider.ts';
import type { AgentEffort, AgentModelOption } from '../types.ts';
import type {
  ClaudeCanUseTool,
  ClaudeContentBlock,
  ClaudeSdkMessage,
  ClaudeSdkModule,
} from './sdk-types.ts';

export const CLAUDE_SDK_PACKAGE = '@anthropic-ai/claude-agent-sdk';

const CLAUDE_EFFORTS: AgentEffort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

// Aliases rather than dated ids: Claude Code resolves each to the newest
// model of that family, so the list never goes stale.
export const CLAUDE_MODELS: AgentModelOption[] = [
  { id: 'opus', label: 'Opus', efforts: CLAUDE_EFFORTS },
  { id: 'sonnet', label: 'Sonnet', efforts: CLAUDE_EFFORTS },
  { id: 'haiku', label: 'Haiku', efforts: [] },
];

export function claudeEffort(effort: AgentEffort | null) {
  return effort && effort !== 'minimal' ? effort : undefined;
}

export function describeClaudeTool(
  name: string,
  input: Record<string, unknown>,
  cwd: string,
): { title: string; detail: string | null } {
  const file = relativeToCwd(cwd, input.file_path ?? input.path ?? input.notebook_path);
  switch (name) {
    case 'Read':
      return { title: 'Read', detail: file };
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
    case 'NotebookEdit':
      return { title: name === 'Write' ? 'Write' : 'Edit', detail: file };
    case 'Bash':
      return { title: 'Run command', detail: clipDetail(input.command) };
    case 'Glob':
    case 'Grep':
      return { title: 'Search', detail: clipDetail(input.pattern) };
    case 'WebFetch':
      return { title: 'Fetch', detail: clipDetail(input.url) };
    case 'WebSearch':
      return { title: 'Web search', detail: clipDetail(input.query) };
    case 'Skill':
      return { title: 'Skill', detail: clipDetail(input.skill ?? input.name) };
    case 'Task':
      return { title: 'Subagent', detail: clipDetail(input.description) };
    case 'AskUserQuestion':
      return { title: 'Question', detail: null };
    case 'TodoWrite':
      return { title: 'Plan', detail: null };
    default:
      return { title: name, detail: clipDetail(input) };
  }
}

// Folds the SDK's message stream into provider events. Partial messages
// stream text as it is generated; the full assistant message that follows
// reconciles the final text and announces tool calls.
export function createClaudeMapper(emit: (event: ProviderEvent) => void, cwd: string) {
  let counter = 0;
  const nextId = () => `t-${Date.now().toString(36)}-${(counter++).toString(36)}`;
  const textByIndex = new Map<number, string>();
  const openTextIds: string[] = [];
  let resultSeen = false;

  const handleBlocks = (blocks: ClaudeContentBlock[]) => {
    for (const block of blocks) {
      if (block.type === 'text') {
        const text = (block as { text: string }).text;
        const id = openTextIds.shift();
        if (id) {
          emit({ type: 'text-end', id, text });
        } else if (text.trim()) {
          const fresh = nextId();
          emit({ type: 'text-start', id: fresh });
          emit({ type: 'text-end', id: fresh, text });
        }
      } else if (block.type === 'tool_use') {
        const tool = block as { id: string; name: string; input: Record<string, unknown> };
        const { title, detail } = describeClaudeTool(tool.name, tool.input ?? {}, cwd);
        emit({ type: 'tool-start', id: tool.id, name: tool.name, title, detail });
      }
    }
    textByIndex.clear();
    openTextIds.length = 0;
  };

  return {
    get resultSeen() {
      return resultSeen;
    },
    handle(msg: ClaudeSdkMessage): void {
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'system' && 'subtype' in msg && msg.subtype === 'init') {
        const init = msg as { session_id: string };
        emit({ type: 'session-id', id: init.session_id });
        return;
      }
      if (msg.type === 'stream_event') {
        const m = msg as Extract<ClaudeSdkMessage, { type: 'stream_event' }>;
        if (m.parent_tool_use_id) return;
        const ev = m.event;
        if (ev.type === 'content_block_start') {
          const start = ev as { index: number; content_block: ClaudeContentBlock };
          if (start.content_block.type === 'text') {
            const id = nextId();
            textByIndex.set(start.index, id);
            openTextIds.push(id);
            emit({ type: 'text-start', id });
          }
        } else if (ev.type === 'content_block_delta') {
          const delta = ev as { index: number; delta: { type: string; text?: string } };
          const id = textByIndex.get(delta.index);
          if (id && delta.delta.type === 'text_delta' && delta.delta.text) {
            emit({ type: 'text-delta', id, text: delta.delta.text });
          }
        }
        return;
      }
      if (msg.type === 'assistant') {
        const m = msg as Extract<ClaudeSdkMessage, { type: 'assistant' }>;
        if (m.parent_tool_use_id) return;
        handleBlocks(m.message?.content ?? []);
        return;
      }
      if (msg.type === 'user') {
        const m = msg as Extract<ClaudeSdkMessage, { type: 'user' }>;
        if (m.parent_tool_use_id) return;
        const content = m.message?.content;
        if (!Array.isArray(content)) return;
        for (const block of content) {
          if (block.type === 'tool_result') {
            const r = block as { tool_use_id: string; is_error?: boolean };
            emit({ type: 'tool-end', id: r.tool_use_id, ok: !r.is_error });
          }
        }
        return;
      }
      if (msg.type === 'result') {
        const m = msg as Extract<ClaudeSdkMessage, { type: 'result' }>;
        resultSeen = true;
        if (m.session_id) emit({ type: 'session-id', id: m.session_id });
        if (m.is_error || (m.subtype && m.subtype !== 'success')) {
          const text =
            (Array.isArray(m.errors) && m.errors.length ? m.errors.join('\n') : null) ??
            (typeof m.result === 'string' && m.result ? m.result : null) ??
            `Claude Code stopped: ${m.subtype ?? 'error'}`;
          emit({ type: 'error', text });
        }
        emit({
          type: 'result',
          durationMs: typeof m.duration_ms === 'number' ? m.duration_ms : null,
          costUsd: typeof m.total_cost_usd === 'number' ? m.total_cost_usd : null,
        });
      }
    },
  };
}

export function createClaudeProvider(): AgentProvider {
  return {
    id: 'claude',
    name: 'Claude Code',
    sdkPackage: CLAUDE_SDK_PACKAGE,
    cliCommand: 'claude',
    askInstruction: 'Ask the user questions with the AskUserQuestion tool, never as plain text.',
    async models() {
      return CLAUDE_MODELS;
    },
    async run(opts: ProviderRunOptions): Promise<void> {
      const sdk = await importWorkspacePackage<ClaudeSdkModule>(opts.cwd, CLAUDE_SDK_PACKAGE);
      if (!sdk || typeof sdk.query !== 'function') throw new ProviderUnavailableError(this);

      const mapper = createClaudeMapper(opts.emit, opts.cwd);
      const abortController = new AbortController();
      opts.signal.addEventListener('abort', () => abortController.abort(), { once: true });

      const canUseTool: ClaudeCanUseTool = async (toolName, input) => {
        if (toolName === 'AskUserQuestion') {
          const questions = parseQuestions(input);
          const answers = await opts.askUser(questions);
          if (!answers) {
            return { behavior: 'deny', message: 'The user dismissed the question.' };
          }
          return { behavior: 'allow', updatedInput: { ...input, answers } };
        }
        const { title, detail } = describeClaudeTool(toolName, input, opts.cwd);
        const allowed = await opts.requestPermission({ tool: toolName, title, detail });
        return allowed
          ? { behavior: 'allow', updatedInput: input }
          : {
              behavior: 'deny',
              message: 'The user declined this action in the open-slide agent panel.',
            };
      };

      const localCli = findOnPath('claude');
      const effort = claudeEffort(opts.effort);
      let stderr = '';
      const stream = sdk.query({
        prompt: opts.prompt,
        options: {
          cwd: opts.cwd,
          permissionMode: 'acceptEdits',
          settingSources: ['user', 'project', 'local'],
          systemPrompt: { type: 'preset', preset: 'claude_code', append: opts.systemPromptAppend },
          includePartialMessages: true,
          abortController,
          canUseTool,
          ...(opts.resume ? { resume: opts.resume } : {}),
          ...(opts.model ? { model: opts.model } : {}),
          ...(effort ? { effort } : {}),
          ...(localCli ? { pathToClaudeCodeExecutable: localCli } : {}),
          stderr: (data: string) => {
            stderr = (stderr + data).slice(-2000);
          },
        },
      });

      try {
        for await (const message of stream) mapper.handle(message);
      } catch (err) {
        if (opts.signal.aborted || mapper.resultSeen) return;
        const base = err instanceof Error ? err.message : String(err);
        const tail = stderr.trim();
        throw new Error(tail && !base.includes(tail) ? `${base}\n${tail}` : base);
      }
    },
  };
}
