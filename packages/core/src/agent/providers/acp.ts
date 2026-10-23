import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { OpenSlideAcpProviderConfig } from '../../config.ts';
import { extractQuestionBlock, TEXT_QUESTIONS_INSTRUCTION } from '../prompt.ts';
import { type AgentProvider, clipDetail, type ProviderRunOptions } from '../provider.ts';
import { newId } from '../store.ts';

type RpcId = string | number;

type RpcMessage = {
  jsonrpc?: string;
  id?: RpcId;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
};

type PermissionOption = { optionId: string; kind: string };
type PendingRequest = {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
};

export function createAcpProvider(
  config: OpenSlideAcpProviderConfig,
  coreVersion: string,
): AgentProvider {
  return {
    id: config.id,
    type: 'acp',
    name: config.name,
    sdkPackage: '',
    cliCommand: config.command,
    askInstruction: TEXT_QUESTIONS_INSTRUCTION,
    canRewind: false,
    async models() {
      return [{ id: '', label: 'Default', efforts: [] }];
    },
    async run(opts: ProviderRunOptions): Promise<void> {
      if (opts.signal.aborted) return;
      const child = spawn(config.command, config.args ?? [], {
        cwd: opts.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
      const pending = new Map<number, PendingRequest>();
      const prefix = newId('acp');
      const textIds = new Map<string, string>();
      const textByKey = new Map<string, string>();
      const toolIds = new Map<string, string>();
      const endedTools = new Set<string>();
      let sequence = 0;
      let sessionId: string | null = null;
      let replaying = false;
      let planStarted = false;
      let planEnded = false;
      let stderr = '';

      const send = (message: RpcMessage) => {
        child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`);
      };
      const call = (
        method: string,
        params: Record<string, unknown>,
      ): Promise<Record<string, unknown>> =>
        new Promise((resolve, reject) => {
          const id = ++sequence;
          pending.set(id, { resolve, reject });
          send({ id, method, params });
        });
      const fail = (error: Error) => {
        for (const request of pending.values()) request.reject(error);
        pending.clear();
      };
      const onAbort = () => {
        if (sessionId) send({ method: 'session/cancel', params: { sessionId } });
        setTimeout(() => child.kill(), 1000).unref();
      };
      opts.signal.addEventListener('abort', onAbort, { once: true });
      child.on('error', fail);
      child.on('close', (code) => {
        const detail = stderr.trim();
        fail(new Error(`ACP agent exited (${code})${detail ? `: ${detail}` : ''}`));
      });
      child.stdin.on('error', fail);
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (data: string) => {
        stderr = (stderr + data).slice(-2000);
      });

      const handlePermission = (message: RpcMessage) => {
        const params = message.params ?? {};
        const options = Array.isArray(params.options) ? (params.options as PermissionOption[]) : [];
        const tool = (params.toolCall ?? {}) as Record<string, unknown>;
        const allowOption =
          options.find((option) => option.kind === 'allow_once') ??
          options.find((option) => option.kind === 'allow_always');
        const rejectOption =
          options.find((option) => option.kind === 'reject_once') ??
          options.find((option) => option.kind === 'reject_always');
        const requestId = message.id as RpcId;
        void opts
          .requestPermission({
            tool: typeof tool.name === 'string' ? tool.name : 'ACP',
            title: typeof tool.title === 'string' ? tool.title : 'Agent action',
            detail: clipDetail(tool.rawInput ?? tool.locations),
          })
          .then((approved) => {
            const selected = approved ? allowOption : rejectOption;
            const outcome =
              selected && !opts.signal.aborted
                ? { outcome: 'selected', optionId: selected.optionId }
                : { outcome: 'cancelled' };
            send({ id: requestId, result: { outcome } });
          })
          .catch(() => {
            send({ id: requestId, result: { outcome: { outcome: 'cancelled' } } });
          });
      };

      const handleUpdate = (params: Record<string, unknown>) => {
        if (replaying || params.sessionId !== sessionId) return;
        const update = (params.update ?? {}) as Record<string, unknown>;
        if (update.sessionUpdate === 'agent_message_chunk') {
          const content = update.content as { type?: string; text?: string } | undefined;
          if (content?.type !== 'text' || !content.text) return;
          const key = typeof update.messageId === 'string' ? update.messageId : 'message';
          let id = textIds.get(key);
          if (!id) {
            id = `${prefix}-text-${textIds.size}`;
            textIds.set(key, id);
            opts.emit({ type: 'text-start', id });
          }
          opts.emit({ type: 'text-delta', id, text: content.text });
          textByKey.set(key, (textByKey.get(key) ?? '') + content.text);
          return;
        }
        if (update.sessionUpdate === 'tool_call' || update.sessionUpdate === 'tool_call_update') {
          if (typeof update.toolCallId !== 'string') return;
          let id = toolIds.get(update.toolCallId);
          if (!id) {
            id = `${prefix}-tool-${toolIds.size}`;
            toolIds.set(update.toolCallId, id);
            opts.emit({
              type: 'tool-start',
              id,
              name: typeof update.name === 'string' ? update.name : 'ACP',
              title: typeof update.title === 'string' ? update.title : 'Agent action',
              detail: clipDetail(update.rawInput ?? update.locations),
            });
          }
          if (
            !endedTools.has(id) &&
            (update.status === 'completed' || update.status === 'failed')
          ) {
            endedTools.add(id);
            opts.emit({ type: 'tool-end', id, ok: update.status === 'completed' });
          }
          return;
        }
        if (update.sessionUpdate === 'plan' && Array.isArray(update.entries)) {
          const entries = update.entries as { content?: string; status?: string }[];
          if (!planStarted) {
            opts.emit({
              type: 'tool-start',
              id: `${prefix}-plan`,
              name: 'plan',
              title: 'Plan',
              detail: clipDetail(entries.map((entry) => entry.content).join('; ')),
            });
            planStarted = true;
          }
          if (!planEnded && entries.every((entry) => entry.status === 'completed')) {
            opts.emit({ type: 'tool-end', id: `${prefix}-plan`, ok: true });
            planEnded = true;
          }
        }
      };

      const lines = createInterface({ input: child.stdout });
      lines.on('line', (line) => {
        let message: RpcMessage;
        try {
          message = JSON.parse(line) as RpcMessage;
          if (message.jsonrpc !== '2.0') throw new Error('invalid JSON-RPC version');
        } catch {
          fail(new Error('ACP agent sent invalid JSON-RPC on stdout'));
          child.kill();
          return;
        }
        if (message.id !== undefined && !message.method) {
          const request = pending.get(Number(message.id));
          if (!request) return;
          pending.delete(Number(message.id));
          if (message.error) request.reject(new Error(message.error.message));
          else request.resolve(message.result ?? {});
          return;
        }
        if (message.method === 'session/request_permission' && message.id !== undefined) {
          handlePermission(message);
          return;
        }
        if (message.method && message.id !== undefined) {
          send({
            id: message.id,
            error: { code: -32601, message: `Unsupported ACP method: ${message.method}` },
          });
          return;
        }
        if (message.method === 'session/update') handleUpdate(message.params ?? {});
      });

      try {
        const init = await call('initialize', {
          protocolVersion: 1,
          clientCapabilities: {},
          clientInfo: { name: 'open-slide', title: 'Open Slide', version: coreVersion },
        });
        if (init.protocolVersion !== 1) {
          throw new Error(`Unsupported ACP protocol version: ${init.protocolVersion}`);
        }
        const capabilities = (init.agentCapabilities ?? {}) as { loadSession?: boolean };
        let loaded = false;
        if (opts.resume && capabilities.loadSession) {
          sessionId = opts.resume;
          replaying = true;
          try {
            await call('session/load', { sessionId, cwd: opts.cwd, mcpServers: [] });
          } finally {
            replaying = false;
          }
          loaded = true;
        } else {
          const session = await call('session/new', { cwd: opts.cwd, mcpServers: [] });
          if (typeof session.sessionId !== 'string') {
            throw new Error('ACP agent did not return a session ID');
          }
          sessionId = session.sessionId;
        }
        if (!sessionId) throw new Error('ACP session was not initialized');
        opts.emit({ type: 'session-id', id: sessionId });
        if (opts.signal.aborted) return;
        const prompt = loaded ? opts.prompt : `${opts.systemPromptAppend}\n\n${opts.prompt}`;
        await call('session/prompt', {
          sessionId,
          prompt: [{ type: 'text', text: prompt }],
        });
        if (opts.signal.aborted) return;
        for (const [key, id] of textIds) {
          const asked = extractQuestionBlock(textByKey.get(key) ?? '');
          opts.emit({ type: 'text-end', id, text: asked ? asked.text : null });
          if (asked) opts.emit({ type: 'questions', questions: asked.questions });
        }
        if (planStarted && !planEnded) {
          opts.emit({ type: 'tool-end', id: `${prefix}-plan`, ok: true });
        }
        opts.emit({ type: 'result', durationMs: null, costUsd: null });
      } finally {
        opts.signal.removeEventListener('abort', onAbort);
        lines.close();
        child.kill();
      }
    },
  };
}
