import { AGENT_IDS, type AgentId, type LoginState, type TaskResult } from '../shared/types';
import type { LoginHooks, LoginSession } from './agents';

const OUTPUT_LIMIT = 16 * 1024;

export type LoginReport =
  | { type: 'started'; id: AgentId }
  | { type: 'installed'; id: AgentId; durationMs: number }
  | { type: 'finished'; id: AgentId; ok: boolean; downloaded: boolean; durationMs: number };

type Options = {
  start: (id: AgentId, hooks: LoginHooks) => LoginSession;
  openUrl: (url: string) => void;
  onChange: (state: LoginState) => void;
  onReport?: (report: LoginReport) => void;
};

type Running = { operation: number; session: LoginSession | null; result: Promise<TaskResult> };

function idle(id: AgentId, operation: number): LoginState {
  return { id, operation, phase: 'idle', output: '', url: null, download: null, error: null };
}

// Sign-ins outlive the window that started them, so their state lives here and
// every surface renders the same snapshot. Each attempt carries an operation
// number: whatever a cancelled or replaced attempt still reports is ignored.
export class AgentLogins {
  private readonly states = new Map<AgentId, LoginState>(AGENT_IDS.map((id) => [id, idle(id, 0)]));
  private readonly running = new Map<AgentId, Running>();
  // A cancelled CLI may still hold its callback port while it exits, so the
  // next attempt waits for it.
  private readonly ending = new Map<AgentId, Promise<unknown>>();

  constructor(private readonly opts: Options) {}

  snapshot(): LoginState[] {
    return [...this.states.values()];
  }

  login(id: AgentId): Promise<TaskResult> {
    const current = this.running.get(id);
    if (current) return current.result;
    const operation = this.state(id).operation + 1;
    this.set({ ...idle(id, operation), phase: 'signing-in' });
    const started = Date.now();
    let downloaded = false;
    this.opts.onReport?.({ type: 'started', id });

    const live = () => this.running.get(id)?.operation === operation;
    const patch = (next: Partial<LoginState>) => {
      if (live()) this.set({ ...this.state(id), ...next });
    };
    const hooks: LoginHooks = {
      download: (download) => patch({ phase: 'downloading', download }),
      installed: () => {
        if (!live()) return;
        downloaded = true;
        patch({ phase: 'signing-in', download: null });
        this.opts.onReport?.({ type: 'installed', id, durationMs: Date.now() - started });
      },
      output: (chunk) => patch({ output: (this.state(id).output + chunk).slice(-OUTPUT_LIMIT) }),
      url: (url) => {
        if (!live()) return;
        patch({ url });
        this.opts.openUrl(url);
      },
    };

    const attempt = async (): Promise<TaskResult> => {
      await this.ending.get(id);
      if (!live()) return { ok: false, error: 'Sign-in cancelled.' };
      const session = this.opts.start(id, hooks);
      entry.session = session;
      const result = await session.done.catch(
        (err: unknown): TaskResult => ({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      if (!live()) return result;
      this.running.delete(id);
      this.set({
        ...this.state(id),
        phase: result.ok ? 'succeeded' : 'failed',
        download: null,
        url: null,
        error: result.ok ? null : result.error,
      });
      this.opts.onReport?.({
        type: 'finished',
        id,
        ok: result.ok,
        downloaded,
        durationMs: Date.now() - started,
      });
      return result;
    };
    const entry: Running = { operation, session: null, result: Promise.resolve({ ok: true }) };
    this.running.set(id, entry);
    entry.result = attempt();
    return entry.result;
  }

  input(id: AgentId, text: string) {
    this.running.get(id)?.session?.write(text);
  }

  cancel(id: AgentId) {
    const current = this.running.get(id);
    if (!current) return;
    this.running.delete(id);
    current.session?.cancel();
    const ended = current.result.catch(() => {});
    this.ending.set(id, ended);
    void ended.then(() => {
      if (this.ending.get(id) === ended) this.ending.delete(id);
    });
    this.set(idle(id, current.operation));
  }

  // Clears what a finished attempt left on screen.
  dismiss(id: AgentId) {
    if (this.running.has(id)) return;
    const state = this.state(id);
    if (state.phase !== 'idle') this.set(idle(id, state.operation));
  }

  cancelAll() {
    for (const id of [...this.running.keys()]) this.cancel(id);
  }

  private state(id: AgentId): LoginState {
    return this.states.get(id) ?? idle(id, 0);
  }

  private set(state: LoginState) {
    this.states.set(state.id, state);
    this.opts.onChange(state);
  }
}
