import { describe, expect, it } from 'vitest';
import type { AgentProvider, ProviderRunOptions } from './provider.ts';
import { createAgentRunner, type TurnEnd } from './runner.ts';
import { createSessionStore } from './store.ts';

function fakeProvider(run: AgentProvider['run'], canRewind = true): AgentProvider {
  return {
    id: 'claude',
    name: 'Fake',
    sdkPackage: 'fake',
    cliCommand: 'fake',
    askInstruction: 'Ask with the fake tool.',
    canRewind,
    models: async () => [],
    run,
  };
}

async function settle() {
  await new Promise((r) => setTimeout(r, 0));
}

function sessionOf(store: ReturnType<typeof createSessionStore>, id: string) {
  const session = store.get(id);
  if (!session) throw new Error(`missing session ${id}`);
  return session;
}

function itemOf(store: ReturnType<typeof createSessionStore>, id: string, kind: string) {
  const item = sessionOf(store, id).items.find((i) => i.kind === kind);
  if (!item) throw new Error(`missing ${kind} item`);
  return item;
}

function setup(run: AgentProvider['run'], onTurnEnd?: (turn: TurnEnd) => void, canRewind = true) {
  const store = createSessionStore({ file: null });
  const provider = fakeProvider(run, canRewind);
  const runner = createAgentRunner({
    userCwd: '/ws',
    writableRoots: ['/ws/slides'],
    store,
    providers: { claude: provider, codex: provider },
    onTurnEnd,
  });
  return { store, runner };
}

describe('createAgentRunner', () => {
  it('records a full turn: user, streamed assistant text, tools and result', async () => {
    const captured: ProviderRunOptions[] = [];
    const { store, runner } = setup(async (opts) => {
      captured.push(opts);
      opts.emit({ type: 'session-id', id: 'native-1' });
      opts.emit({ type: 'text-start', id: 't1' });
      opts.emit({ type: 'text-delta', id: 't1', text: 'Hel' });
      opts.emit({ type: 'text-delta', id: 't1', text: 'lo' });
      opts.emit({ type: 'tool-start', id: 'tool1', name: 'Edit', title: 'Edit', detail: 'a.tsx' });
      opts.emit({ type: 'tool-end', id: 'tool1', ok: true });
      opts.emit({ type: 'text-end', id: 't1', text: 'Hello!' });
      opts.emit({ type: 'result', durationMs: 5, costUsd: 0.01 });
    });
    const session = store.create('claude', null);
    await runner.send(session.id, {
      text: 'make a deck',
      context: { slideId: 'deck', pageNumber: 2, totalPages: 4 },
    });
    expect(runner.isRunning(session.id)).toBe(true);
    await settle();

    const after = sessionOf(store, session.id);
    expect(after.status).toBe('idle');
    expect(after.title).toBe('make a deck');
    expect(after.slideId).toBe('deck');
    expect(after.providerSessionId).toBe('native-1');
    expect(after.items.map((i) => i.kind)).toEqual(['user', 'assistant', 'tool', 'result']);
    expect(after.items[1]).toMatchObject({ text: 'Hello!', streaming: false });
    expect(after.items[2]).toMatchObject({ status: 'done' });
    expect(after.items[3]).toMatchObject({ durationMs: 5, costUsd: 0.01, aborted: false });
    expect(captured[0]?.prompt).toContain('<open-slide-context>');
    expect(captured[0]?.resume).toBeNull();
    expect(runner.isRunning(session.id)).toBe(false);
  });

  it('passes the chosen model and effort, then reports the turn end', async () => {
    const seen: [string | null, string | null][] = [];
    const ended: TurnEnd[] = [];
    const { store, runner } = setup(
      async (opts) => {
        seen.push([opts.model, opts.effort]);
      },
      (turn) => {
        ended.push(turn);
      },
    );
    const session = store.create('claude', null);
    await runner.send(session.id, { text: 'go', model: 'sonnet', effort: 'high' });
    await settle();
    await settle();
    expect(seen).toEqual([['sonnet', 'high']]);
    expect(ended).toEqual([
      { sessionId: session.id, userItemId: sessionOf(store, session.id).items[0].id },
    ]);
  });

  it('passes the provider session id back as resume on the next turn', async () => {
    const resumes: (string | null)[] = [];
    const { store, runner } = setup(async (opts) => {
      resumes.push(opts.resume);
      opts.emit({ type: 'session-id', id: 'native-9' });
    });
    const session = store.create('codex', null);
    await runner.send(session.id, { text: 'one' });
    await settle();
    await runner.send(session.id, { text: 'two' });
    await settle();
    expect(resumes).toEqual([null, 'native-9']);
    expect(store.get(session.id)?.title).toBe('one');
  });

  it('rejects concurrent sends and empty prompts', async () => {
    let release: () => void = () => {};
    const { store, runner } = setup(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const session = store.create('claude', null);
    await runner.send(session.id, { text: 'go' });
    await expect(runner.send(session.id, { text: 'again' })).rejects.toThrow('already running');
    await expect(runner.send(session.id, { text: '  ' })).rejects.toThrow();
    release();
    await settle();
    expect(store.get(session.id)?.status).toBe('idle');
  });

  it('routes questions and permissions through pending prompts', async () => {
    const seen: unknown[] = [];
    const { store, runner } = setup(async (opts) => {
      const answers = await opts.askUser([
        { header: 'Look', question: 'Which?', options: [{ label: 'A' }], multiSelect: false },
      ]);
      seen.push(answers);
      const allowed = await opts.requestPermission({ tool: 'Bash', title: 'Run', detail: 'ls' });
      seen.push(allowed);
    });
    const session = store.create('claude', null);
    await runner.send(session.id, { text: 'ask me' });
    await settle();

    const question = itemOf(store, session.id, 'question');
    expect(question).toMatchObject({ status: 'pending' });
    expect(runner.respond(session.id, question.id, { allow: true })).toBe(false);
    expect(runner.respond(session.id, question.id, { answers: { 'Which?': 'A' } })).toBe(true);
    await settle();

    const permission = itemOf(store, session.id, 'permission');
    expect(permission).toMatchObject({ status: 'pending', tool: 'Bash' });
    expect(runner.respond(session.id, permission.id, { allow: false })).toBe(true);
    await settle();

    expect(seen).toEqual([{ 'Which?': 'A' }, false]);
    expect(sessionOf(store, session.id).items.find((i) => i.id === question.id)).toMatchObject({
      status: 'answered',
      answers: { 'Which?': 'A' },
    });
    expect(sessionOf(store, session.id).items.find((i) => i.id === permission.id)).toMatchObject({
      status: 'denied',
    });
    expect(runner.respond(session.id, permission.id, { allow: true })).toBe(false);
  });

  it('answers questions written into a reply with a follow-up turn', async () => {
    const captured: ProviderRunOptions[] = [];
    const { store, runner } = setup(async (opts) => {
      captured.push(opts);
      if (captured.length === 1) {
        opts.emit({
          type: 'questions',
          questions: [{ header: 'Pages', question: 'How many?', options: [], multiSelect: false }],
        });
      }
      opts.emit({ type: 'result', durationMs: 1, costUsd: null });
    });
    const session = store.create('codex', null);
    await runner.send(session.id, {
      text: 'new deck',
      context: { slideId: 'untitled', newDeck: true },
      model: 'gpt-x',
    });
    await settle();
    expect(captured[0].systemPromptAppend).toContain('Ask with the fake tool.');
    const question = itemOf(store, session.id, 'question');
    expect(question).toMatchObject({ status: 'pending' });
    expect(sessionOf(store, session.id).status).toBe('idle');

    expect(runner.respond(session.id, question.id, { answers: { 'How many?': '6' } })).toBe(true);
    await settle();
    expect(captured).toHaveLength(2);
    expect(captured[1].prompt).toContain('- How many? 6');
    expect(captured[1].prompt).not.toContain('blank deck');
    expect(captured[1].model).toBe('gpt-x');
    expect(itemOf(store, session.id, 'question')).toMatchObject({ status: 'answered' });
    expect(sessionOf(store, session.id).items.filter((i) => i.kind === 'user')).toHaveLength(1);
    expect(runner.respond(session.id, question.id, { cancel: true })).toBe(false);
  });

  it('runs the answer turn with the settings the panel sends along', async () => {
    const captured: ProviderRunOptions[] = [];
    const { store, runner } = setup(async (opts) => {
      captured.push(opts);
      if (captured.length === 1) {
        opts.emit({
          type: 'questions',
          questions: [{ header: 'Pages', question: 'How many?', options: [], multiSelect: false }],
        });
      }
    });
    const session = store.create('codex', null);
    await runner.send(session.id, { text: 'new deck', model: 'gpt-x', effort: 'low' });
    await settle();
    const question = itemOf(store, session.id, 'question');
    runner.respond(
      session.id,
      question.id,
      { answers: { 'How many?': '6' } },
      { model: 'gpt-y', context: { slideId: 'deck' } },
    );
    await settle();
    expect(captured[1]).toMatchObject({ model: 'gpt-y', effort: 'low' });
    expect(captured[1].prompt).toContain('slides/deck/index.tsx');
  });

  it('drops an unanswered question when the user sends a new message', async () => {
    const { store, runner } = setup(async (opts) => {
      opts.emit({
        type: 'questions',
        questions: [{ header: '', question: 'Theme?', options: [], multiSelect: false }],
      });
    });
    const session = store.create('codex', null);
    await runner.send(session.id, { text: 'go' });
    await settle();
    await runner.send(session.id, { text: 'never mind' });
    await settle();
    const questions = sessionOf(store, session.id).items.filter((i) => i.kind === 'question');
    expect(questions[0]).toMatchObject({ status: 'cancelled' });
  });

  it('auto-approves permissions when asked to', async () => {
    const { store, runner } = setup(async (opts) => {
      await opts.requestPermission({ tool: 'Bash', title: 'Run', detail: 'ls' });
    });
    const session = store.create('claude', null);
    await runner.send(session.id, { text: 'go', autoApprove: true });
    await settle();
    expect(sessionOf(store, session.id).items.find((i) => i.kind === 'permission')).toMatchObject({
      status: 'allowed',
    });
  });

  it('stop aborts the turn, cancels pending prompts and marks the result aborted', async () => {
    const { store, runner } = setup(async (opts) => {
      opts.emit({ type: 'text-start', id: 't1' });
      opts.emit({ type: 'tool-start', id: 'x', name: 'Bash', title: 'Run', detail: null });
      const answer = await opts.askUser([]);
      if (answer === null && !opts.signal.aborted) {
        await new Promise<void>((resolve) =>
          opts.signal.addEventListener('abort', () => resolve()),
        );
      }
      throw new Error('should be swallowed after abort');
    });
    const session = store.create('claude', null);
    await runner.send(session.id, { text: 'go' });
    await settle();
    expect(runner.stop(session.id)).toBe(true);
    await settle();
    await settle();

    const items = sessionOf(store, session.id).items;
    expect(items.find((i) => i.kind === 'assistant')).toMatchObject({ streaming: false });
    expect(items.find((i) => i.kind === 'tool')).toMatchObject({ status: 'error' });
    expect(items.find((i) => i.kind === 'question')).toMatchObject({ status: 'cancelled' });
    expect(items.find((i) => i.kind === 'error')).toBeUndefined();
    expect(items.at(-1)).toMatchObject({ kind: 'result', aborted: true });
    expect(runner.stop(session.id)).toBe(false);
  });

  it('surfaces provider failures as error items', async () => {
    const { store, runner } = setup(async () => {
      throw new Error('not connected');
    });
    const session = store.create('claude', null);
    await runner.send(session.id, { text: 'go' });
    await settle();
    const items = sessionOf(store, session.id).items;
    expect(items.map((i) => i.kind)).toEqual(['user', 'error', 'result']);
    expect(items[1]).toMatchObject({ text: 'not connected' });
  });

  it('survives the session being deleted mid-turn', async () => {
    const { store, runner } = setup(async (opts) => {
      opts.emit({ type: 'text-start', id: 't1' });
      await new Promise<void>((resolve) => opts.signal.addEventListener('abort', () => resolve()));
    });
    const session = store.create('claude', null);
    await runner.send(session.id, { text: 'go' });
    await settle();
    runner.stop(session.id);
    store.remove(session.id);
    await settle();
    await settle();
    expect(runner.isRunning(session.id)).toBe(false);
  });

  describe('editing a sent message', () => {
    function twoTurns(canRewind: boolean) {
      const runs: ProviderRunOptions[] = [];
      let turn = 0;
      const { store, runner } = setup(
        async (opts) => {
          runs.push(opts);
          turn++;
          opts.emit({ type: 'session-id', id: 'native-1' });
          opts.emit({ type: 'text-end', id: `t${turn}`, text: `reply ${turn}` });
          opts.emit({ type: 'checkpoint', id: `c${turn}` });
        },
        undefined,
        canRewind,
      );
      return { runs, store, runner };
    }

    async function prime(canRewind: boolean) {
      const ctx = twoTurns(canRewind);
      const session = ctx.store.create('claude', null);
      await ctx.runner.send(session.id, { text: 'one' });
      await settle();
      await ctx.runner.send(session.id, { text: 'two' });
      await settle();
      const users = sessionOf(ctx.store, session.id).items.filter((i) => i.kind === 'user');
      return { ...ctx, sessionId: session.id, users };
    }

    it('rewinds the provider history to just before the edited message', async () => {
      const { runs, store, runner, sessionId, users } = await prime(true);
      await runner.send(sessionId, { text: 'two, edited', edit: users[1].id });
      await settle();
      expect(runs[2]).toMatchObject({ resume: 'native-1', resumeAt: 'c1' });
      expect(runs[2]?.prompt.startsWith('two, edited')).toBe(true);
      expect(runs[2]?.prompt).toContain('read the current files');
      const items = sessionOf(store, sessionId).items;
      expect(items.filter((i) => i.kind === 'user').map((i) => i.text)).toEqual([
        'one',
        'two, edited',
      ]);
      expect(items.some((i) => i.id === users[1].id)).toBe(false);
      expect(items.filter((i) => i.kind === 'assistant').map((i) => i.text)).toEqual([
        'reply 1',
        'reply 3',
      ]);
    });

    it('starts the provider conversation over when the first message is edited', async () => {
      const { runs, store, runner, sessionId, users } = await prime(true);
      await runner.send(sessionId, { text: 'uno', edit: users[0].id });
      await settle();
      expect(runs[2]).toMatchObject({ resume: null, resumeAt: null, prompt: 'uno' });
      const after = sessionOf(store, sessionId);
      expect(after.title).toBe('uno');
      expect(after.items.map((i) => i.kind)).toEqual(['user', 'assistant', 'result']);
    });

    it('keeps the provider history when the oldest message left was trimmed', async () => {
      const { runs, store, runner, sessionId, users } = await prime(true);
      sessionOf(store, sessionId).trimmed = true;
      await runner.send(sessionId, { text: 'uno', edit: users[0].id });
      await settle();
      expect(runs[2]?.resume).toBe('native-1');
    });

    it('tells an agent that cannot rewind to set the old reply aside', async () => {
      const { runs, runner, sessionId, users } = await prime(false);
      await runner.send(sessionId, { text: 'two, edited', edit: users[1].id });
      await settle();
      expect(runs[2]?.resumeAt).toBeNull();
      expect(runs[2]?.resume).toBe('native-1');
      expect(runs[2]?.prompt).toContain('<original-message>\ntwo\n</original-message>');
      expect(runs[2]?.prompt.endsWith('two, edited')).toBe(true);
    });

    it('rejects edits of anything but a user message', async () => {
      const { runner, store, sessionId } = await prime(true);
      const reply = sessionOf(store, sessionId).items.find((i) => i.kind === 'assistant');
      await expect(runner.send(sessionId, { text: 'x', edit: reply?.id })).rejects.toThrow(
        'unknown message',
      );
      expect(runner.isRunning(sessionId)).toBe(false);
    });
  });

  it('announces sessions evicted by the idle cap', () => {
    const events: string[] = [];
    const store = createSessionStore({ file: null });
    store.subscribe((e) => events.push(e.type));
    const first = store.create('claude', null);
    for (let i = 0; i < 40; i++) store.create('claude', null);
    expect(store.get(first.id)).toBeNull();
    expect(events).toContain('session-removed');
  });
});
