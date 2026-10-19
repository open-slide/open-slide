import { buildTurnPrompt, SYSTEM_PROMPT_APPEND } from './prompt.ts';
import type { AgentProvider, PermissionRequest, ProviderEvent } from './provider.ts';
import { newId, type SessionStore, titleFromPrompt } from './store.ts';
import type { AgentEffort, AgentProviderId, AgentQuestion, AgentTurnContext } from './types.ts';

export type SendOptions = {
  text: string;
  context?: AgentTurnContext;
  autoApprove?: boolean;
  model?: string | null;
  effort?: AgentEffort | null;
};

export type TurnEnd = { sessionId: string; userItemId: string };

export type RespondPayload =
  | { answers: Record<string, string> }
  | { allow: boolean }
  | { cancel: true };

type PendingPrompt =
  | { kind: 'question'; resolve: (answers: Record<string, string> | null) => void }
  | { kind: 'permission'; resolve: (allow: boolean) => void };

export type AgentRunner = ReturnType<typeof createAgentRunner>;

export function createAgentRunner(opts: {
  userCwd: string;
  store: SessionStore;
  providers: Record<AgentProviderId, AgentProvider>;
  onTurnEnd?: (turn: TurnEnd) => void | Promise<void>;
}) {
  const { userCwd, store, providers, onTurnEnd } = opts;
  const running = new Map<string, AbortController>();
  const pending = new Map<string, PendingPrompt>();

  const now = () => new Date().toISOString();

  function isRunning(sessionId: string): boolean {
    return running.has(sessionId);
  }

  async function send(sessionId: string, options: SendOptions): Promise<void> {
    const session = store.get(sessionId);
    if (!session) throw new Error(`unknown agent session: ${sessionId}`);
    if (running.has(sessionId)) throw new Error('session is already running');
    const text = options.text.trim();
    if (!text) throw new Error('empty prompt');

    const provider = providers[session.provider];
    const controller = new AbortController();
    running.set(sessionId, controller);

    if (session.items.length === 0) store.patch(sessionId, { title: titleFromPrompt(text) });
    if (options.context?.slideId && !session.slideId) {
      store.patch(sessionId, { slideId: options.context.slideId });
    }
    const userItemId = newId('u');
    store.appendItem(sessionId, { kind: 'user', id: userItemId, ts: now(), text });
    store.patch(sessionId, { status: 'running' });

    const openText = new Set<string>();
    const openTools = new Set<string>();
    const startedAt = Date.now();
    let resultSeen = false;

    const emit = (event: ProviderEvent) => {
      if (!store.get(sessionId)) return;
      switch (event.type) {
        case 'session-id':
          store.patch(sessionId, { providerSessionId: event.id });
          return;
        case 'text-start':
          openText.add(event.id);
          store.appendItem(sessionId, {
            kind: 'assistant',
            id: event.id,
            ts: now(),
            text: '',
            streaming: true,
          });
          return;
        case 'text-delta':
          if (!openText.has(event.id)) emit({ type: 'text-start', id: event.id });
          store.appendDelta(sessionId, event.id, event.text);
          return;
        case 'text-end': {
          if (!openText.has(event.id)) {
            if (!event.text) return;
            emit({ type: 'text-start', id: event.id });
          }
          openText.delete(event.id);
          const changes =
            event.text !== null ? { streaming: false, text: event.text } : { streaming: false };
          store.updateItem(sessionId, event.id, 'assistant', changes);
          return;
        }
        case 'tool-start':
          openTools.add(event.id);
          store.appendItem(sessionId, {
            kind: 'tool',
            id: event.id,
            ts: now(),
            name: event.name,
            title: event.title,
            detail: event.detail,
            status: 'running',
          });
          return;
        case 'tool-end':
          openTools.delete(event.id);
          store.updateItem(sessionId, event.id, 'tool', { status: event.ok ? 'done' : 'error' });
          return;
        case 'error':
          store.appendItem(sessionId, {
            kind: 'error',
            id: newId('e'),
            ts: now(),
            text: event.text,
          });
          return;
        case 'result':
          resultSeen = true;
          store.appendItem(sessionId, {
            kind: 'result',
            id: newId('r'),
            ts: now(),
            durationMs: event.durationMs ?? Date.now() - startedAt,
            costUsd: event.costUsd,
            aborted: false,
          });
          return;
      }
    };

    const askUser = (questions: AgentQuestion[]) =>
      new Promise<Record<string, string> | null>((resolve) => {
        if (controller.signal.aborted) return resolve(null);
        const item = store.appendItem(sessionId, {
          kind: 'question',
          id: newId('q'),
          ts: now(),
          questions,
          answers: null,
          status: 'pending',
        });
        pending.set(item.id, {
          kind: 'question',
          resolve: (answers) => {
            pending.delete(item.id);
            store.updateItem(sessionId, item.id, 'question', {
              answers,
              status: answers ? 'answered' : 'cancelled',
            });
            resolve(answers);
          },
        });
      });

    const requestPermission = (request: PermissionRequest) =>
      new Promise<boolean>((resolve) => {
        if (controller.signal.aborted) return resolve(false);
        const item = store.appendItem(sessionId, {
          kind: 'permission',
          id: newId('p'),
          ts: now(),
          tool: request.tool,
          title: request.title,
          detail: request.detail,
          status: options.autoApprove ? 'allowed' : 'pending',
        });
        if (options.autoApprove) return resolve(true);
        pending.set(item.id, {
          kind: 'permission',
          resolve: (allow) => {
            pending.delete(item.id);
            store.updateItem(sessionId, item.id, 'permission', {
              status: allow ? 'allowed' : 'denied',
            });
            resolve(allow);
          },
        });
      });

    const finish = () => {
      running.delete(sessionId);
      if (!store.get(sessionId)) return;
      for (const id of openText) {
        store.updateItem(sessionId, id, 'assistant', { streaming: false });
      }
      for (const id of openTools) {
        store.updateItem(sessionId, id, 'tool', { status: 'error' });
      }
      if (!resultSeen) {
        store.appendItem(sessionId, {
          kind: 'result',
          id: newId('r'),
          ts: now(),
          durationMs: Date.now() - startedAt,
          costUsd: null,
          aborted: controller.signal.aborted,
        });
      }
      store.patch(sessionId, { status: 'idle' });
      if (onTurnEnd) {
        void Promise.resolve()
          .then(() => onTurnEnd({ sessionId, userItemId }))
          .catch(() => {});
      }
    };

    const prompt = buildTurnPrompt(text, options.context);
    void provider
      .run({
        cwd: userCwd,
        prompt,
        systemPromptAppend: SYSTEM_PROMPT_APPEND,
        resume: session.providerSessionId,
        model: options.model ?? null,
        effort: options.effort ?? null,
        signal: controller.signal,
        emit,
        askUser,
        requestPermission,
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        emit({ type: 'error', text: err instanceof Error ? err.message : String(err) });
      })
      .finally(finish);
  }

  function stop(sessionId: string): boolean {
    const controller = running.get(sessionId);
    if (!controller) return false;
    const session = store.get(sessionId);
    if (session) {
      for (const item of session.items) {
        const prompt = pending.get(item.id);
        if (!prompt) continue;
        if (prompt.kind === 'question') prompt.resolve(null);
        else prompt.resolve(false);
      }
    }
    controller.abort();
    return true;
  }

  function respond(sessionId: string, itemId: string, payload: RespondPayload): boolean {
    const session = store.get(sessionId);
    if (!session?.items.some((i) => i.id === itemId)) return false;
    const prompt = pending.get(itemId);
    if (!prompt) return false;
    if ('cancel' in payload) {
      if (prompt.kind === 'question') prompt.resolve(null);
      else prompt.resolve(false);
      return true;
    }
    if (prompt.kind === 'question' && 'answers' in payload) {
      prompt.resolve(payload.answers);
      return true;
    }
    if (prompt.kind === 'permission' && 'allow' in payload) {
      prompt.resolve(payload.allow);
      return true;
    }
    return false;
  }

  function stopAll(): void {
    for (const id of Array.from(running.keys())) stop(id);
  }

  return { send, stop, respond, isRunning, stopAll };
}
