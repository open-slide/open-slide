import { describe, expect, it, vi } from 'vitest';
import type { AgentId, LoginState, TaskResult } from '../shared/types';
import { AgentLogins, type LoginReport } from './agent-logins';
import type { LoginHooks } from './agents';

type FakeSession = {
  id: AgentId;
  hooks: LoginHooks;
  finish: (result: TaskResult) => void;
  written: string[];
  cancelled: boolean;
};

function setup() {
  const sessions: FakeSession[] = [];
  const changes: LoginState[] = [];
  const reports: LoginReport[] = [];
  const openUrl = vi.fn();
  const logins = new AgentLogins({
    start: (id, hooks) => {
      let finish: (result: TaskResult) => void = () => {};
      const done = new Promise<TaskResult>((resolve) => {
        finish = resolve;
      });
      const session: FakeSession = { id, hooks, finish, written: [], cancelled: false };
      sessions.push(session);
      return {
        done,
        write: (text) => session.written.push(text),
        cancel: () => {
          session.cancelled = true;
          finish({ ok: false, error: 'Sign-in exited with code null' });
        },
      };
    },
    openUrl,
    onChange: (state) => changes.push(state),
    onReport: (report) => reports.push(report),
  });
  const state = (id: AgentId) => logins.snapshot().find((s) => s.id === id) as LoginState;
  const started = async () => {
    await vi.waitFor(() => expect(sessions.length).toBeGreaterThan(0));
    return sessions[sessions.length - 1];
  };
  return { logins, sessions, changes, reports, openUrl, state, started };
}

describe('AgentLogins', () => {
  it('keeps a running sign-in in the snapshot, with its URL, for a surface that mounts late', async () => {
    const { logins, state, started, openUrl } = setup();
    void logins.login('claude');
    const session = await started();
    session.hooks.output('Open this page to sign in\n');
    session.hooks.url('https://example.com/authorize');

    expect(state('claude')).toMatchObject({
      operation: 1,
      phase: 'signing-in',
      output: 'Open this page to sign in\n',
      url: 'https://example.com/authorize',
    });
    expect(openUrl).toHaveBeenCalledExactlyOnceWith('https://example.com/authorize');
    expect(state('codex').phase).toBe('idle');
  });

  it('shares one attempt between surfaces that both ask to sign in', async () => {
    const { logins, sessions, started, reports } = setup();
    const first = logins.login('claude');
    const second = logins.login('claude');
    const session = await started();

    session.finish({ ok: true });

    expect(await first).toEqual({ ok: true });
    expect(await second).toEqual({ ok: true });
    expect(sessions).toHaveLength(1);
    expect(reports.filter((r) => r.type === 'started')).toHaveLength(1);
  });

  it('reports download progress, then the sign-in that follows', async () => {
    const { logins, state, started, reports } = setup();
    void logins.login('codex');
    const session = await started();

    session.hooks.download({ received: 10, total: 100 });
    expect(state('codex')).toMatchObject({
      phase: 'downloading',
      download: { received: 10, total: 100 },
    });
    session.hooks.installed();
    expect(state('codex')).toMatchObject({ phase: 'signing-in', download: null });
    expect(reports.map((r) => r.type)).toEqual(['started', 'installed']);
  });

  it('records a failure until it is dismissed', async () => {
    const { logins, state, started, reports } = setup();
    const result = logins.login('claude');
    (await started()).finish({ ok: false, error: 'Sign-in exited with code 1' });

    expect(await result).toEqual({ ok: false, error: 'Sign-in exited with code 1' });
    expect(state('claude')).toMatchObject({ phase: 'failed', error: 'Sign-in exited with code 1' });
    expect(reports.at(-1)).toMatchObject({ type: 'finished', ok: false });

    logins.dismiss('claude');
    expect(state('claude')).toMatchObject({ phase: 'idle', error: null, output: '' });
  });

  it('does not dismiss a sign-in that is still running', async () => {
    const { logins, state, started } = setup();
    void logins.login('claude');
    await started();

    logins.dismiss('claude');

    expect(state('claude').phase).toBe('signing-in');
  });

  it('cancels cleanly and ignores what the cancelled attempt still reports', async () => {
    const { logins, state, started, openUrl, reports } = setup();
    const result = logins.login('claude');
    const session = await started();

    logins.cancel('claude');
    expect(session.cancelled).toBe(true);
    expect(state('claude')).toMatchObject({ phase: 'idle', error: null });

    session.hooks.output('late output');
    session.hooks.url('https://example.com/late');
    await result;

    expect(state('claude')).toMatchObject({ phase: 'idle', output: '', url: null, error: null });
    expect(openUrl).not.toHaveBeenCalled();
    expect(reports.some((r) => r.type === 'finished')).toBe(false);
  });

  it('starts a retry as a new operation, after the cancelled one has ended', async () => {
    // A CLI that takes a moment to exit after it is cancelled.
    const pending: ((result: TaskResult) => void)[] = [];
    const start = vi.fn(() => ({
      done: new Promise<TaskResult>((resolve) => {
        pending.push(resolve);
      }),
      write: () => {},
      cancel: () => {},
    }));
    const logins = new AgentLogins({ start, openUrl: () => {}, onChange: () => {} });
    const state = () => logins.snapshot().find((s) => s.id === 'claude') as LoginState;

    const first = logins.login('claude');
    await vi.waitFor(() => expect(start).toHaveBeenCalledOnce());
    logins.cancel('claude');
    const retry = logins.login('claude');
    expect(state()).toMatchObject({ operation: 2, phase: 'signing-in' });
    await new Promise((resolve) => setImmediate(resolve));
    expect(start).toHaveBeenCalledOnce();

    // The stale completion of the first attempt must not end the retry.
    pending[0]({ ok: false, error: 'Sign-in exited with code null' });
    await first;
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2));
    expect(state()).toMatchObject({ operation: 2, phase: 'signing-in', error: null });

    pending[1]({ ok: true });
    expect(await retry).toEqual({ ok: true });
    expect(state().phase).toBe('succeeded');
  });

  it('passes typed input to the running sign-in only', async () => {
    const { logins, started } = setup();
    logins.input('claude', 'ignored');
    void logins.login('claude');
    const session = await started();

    logins.input('claude', 'ABCD-1234');

    expect(session.written).toEqual(['ABCD-1234']);
  });

  it('never puts typed input into the state other windows receive', async () => {
    const { logins, started, changes } = setup();
    void logins.login('claude');
    await started();

    logins.input('claude', 'secret-code');

    expect(JSON.stringify(changes)).not.toContain('secret-code');
    expect(JSON.stringify(logins.snapshot())).not.toContain('secret-code');
  });

  it('cancels every running sign-in on quit', async () => {
    const { logins, sessions } = setup();
    void logins.login('claude');
    void logins.login('codex');
    await vi.waitFor(() => expect(sessions).toHaveLength(2));

    logins.cancelAll();

    expect(sessions.every((s) => s.cancelled)).toBe(true);
    expect(logins.snapshot().every((s) => s.phase === 'idle')).toBe(true);
  });
});
