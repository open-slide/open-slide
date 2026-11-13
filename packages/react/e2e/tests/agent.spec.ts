import { expect, type Page, test } from '@playwright/test';
import { openSlide } from './helpers.ts';

type ProviderStatus = {
  id: string;
  name: string;
  sdkPackage: string;
  sdkVersion?: string | null;
  cliCommand: string;
  cliFound: boolean;
  ready: boolean;
};

type Session = {
  id: string;
  provider: string;
  status: string;
  items: { id: string; kind: string; text?: string; aborted?: boolean }[];
};

async function mockStatus(
  page: Page,
  patch: (provider: ProviderStatus) => Partial<ProviderStatus>,
): Promise<void> {
  await page.route('**/__agent/status', async (route) => {
    const res = await route.fetch();
    const body = (await res.json()) as { providers: ProviderStatus[] };
    await route.fulfill({
      json: { ...body, providers: body.providers.map((p) => ({ ...p, ...patch(p) })) },
    });
  });
}

test.describe('agent panel', () => {
  test('status lists both providers and whether they are connected', async ({ request }) => {
    const res = await request.get('/__agent/status');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { enabled: boolean; providers: ProviderStatus[] };
    expect(body.enabled).toBe(true);
    expect(body.providers.map((p) => p.id)).toEqual(['claude', 'codex']);
    const claude = body.providers[0];
    expect(claude.sdkPackage).toBe('@anthropic-ai/claude-agent-sdk');
    expect(claude.cliCommand).toBe('claude');
    expect(typeof claude.ready).toBe('boolean');
  });

  test('sessions can be created, listed, read and deleted', async ({ request }) => {
    const created = await request.post('/__agent/sessions', {
      data: { provider: 'codex', slideId: 'alpha' },
    });
    expect(created.status()).toBe(200);
    const session = (await created.json()) as Session & { slideId: string | null };
    expect(session.provider).toBe('codex');
    expect(session.slideId).toBe('alpha');
    expect(session.items).toEqual([]);

    const list = (await (await request.get('/__agent/sessions')).json()) as {
      sessions: { id: string }[];
    };
    expect(list.sessions.some((s) => s.id === session.id)).toBe(true);

    const read = await request.get(`/__agent/sessions/${session.id}`);
    expect(read.status()).toBe(200);

    const removed = await request.delete(`/__agent/sessions/${session.id}`);
    expect(removed.status()).toBe(200);
    expect((await request.get(`/__agent/sessions/${session.id}`)).status()).toBe(404);
  });

  test('a turn against an unconnected provider records the error in the transcript', async ({
    request,
  }) => {
    const status = (await (await request.get('/__agent/status')).json()) as {
      providers: ProviderStatus[];
    };
    const missing = status.providers.find((p) => !p.ready);
    test.skip(!missing, 'every provider SDK is installed in this environment');
    if (!missing) return;

    const session = (await (
      await request.post('/__agent/sessions', { data: { provider: missing.id } })
    ).json()) as Session;

    const sent = await request.post(`/__agent/sessions/${session.id}/messages`, {
      data: { text: 'hello', context: { slideId: 'alpha', pageNumber: 1, totalPages: 1 } },
    });
    expect(sent.status()).toBe(202);

    await expect
      .poll(async () => {
        const body = (await (
          await request.get(`/__agent/sessions/${session.id}`)
        ).json()) as Session;
        return body.status === 'idle' ? body.items.map((i) => i.kind) : null;
      })
      .toEqual(['user', 'error', 'result']);

    const final = (await (await request.get(`/__agent/sessions/${session.id}`)).json()) as Session;
    expect(final.items[1].text).toContain(missing.sdkPackage);

    const again = await request.post(`/__agent/sessions/${session.id}/respond`, {
      data: { itemId: final.items[1].id, allow: true },
    });
    expect(again.status()).toBe(409);

    await request.delete(`/__agent/sessions/${session.id}`);
  });

  test('rejects malformed requests', async ({ request }) => {
    expect((await request.post('/__agent/sessions', { data: { provider: 'nope' } })).status()).toBe(
      400,
    );
    expect((await request.get('/__agent/sessions/s-missing')).status()).toBe(404);
    expect((await request.post('/__agent/install', { data: { provider: 'nope' } })).status()).toBe(
      400,
    );
  });

  test('home no longer has an agent view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Themes', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agent', exact: true })).toHaveCount(0);
  });

  test('the panel asks for a CLI when neither agent is installed', async ({ page }) => {
    await mockStatus(page, () => ({ cliFound: false, ready: false }));
    let installs = 0;
    await page.route('**/__agent/install', (route) => {
      installs += 1;
      return route.fulfill({ json: { ok: true } });
    });
    await openSlide(page, 'alpha');
    const dock = page.locator('[data-agent-dock]');
    await expect(dock).toHaveCount(0);

    await page.keyboard.press('a');
    await expect(dock).toBeVisible();
    await expect(
      dock.getByRole('heading', { name: 'Install Claude Code or Codex first' }),
    ).toBeVisible();
    await expect(dock.getByText('npm install -g @anthropic-ai/claude-code')).toBeVisible();
    await expect(dock.getByText('npm install -g @openai/codex')).toBeVisible();
    expect(installs).toBe(0);

    await page.getByRole('button', { name: 'Close agent panel' }).click();
    await expect(dock).toHaveCount(0);

    await page.getByRole('button', { name: 'Open the agent panel' }).click();
    await expect(dock).toBeVisible();
  });

  test('the panel connects an installed CLI on first use', async ({ page }) => {
    let installed = false;
    const requested: string[] = [];
    await mockStatus(page, (p) =>
      p.id === 'claude'
        ? { cliFound: true, ready: installed, sdkVersion: '0.0.0' }
        : { cliFound: false, ready: false },
    );
    await page.route('**/__agent/install', async (route) => {
      requested.push(route.request().postDataJSON().provider);
      installed = true;
      await route.fulfill({ json: { ok: true } });
    });
    await openSlide(page, 'alpha');
    await page.keyboard.press('a');
    const dock = page.locator('[data-agent-dock]');
    await expect(dock.getByPlaceholder(/Ask Claude Code/)).toBeVisible();
    expect(requested).toEqual(['claude']);
  });

  test('transcript messages can be copied, and sent ones edited', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockStatus(page, (p) =>
      p.id === 'claude'
        ? { cliFound: true, ready: true, sdkVersion: '0.0.0' }
        : { cliFound: false, ready: false },
    );
    const ts = new Date().toISOString();
    const session = {
      id: 's-edit',
      provider: 'claude',
      title: 'Make the cover bolder',
      createdAt: ts,
      updatedAt: ts,
      status: 'idle',
      slideId: 'alpha',
      providerSessionId: null,
      items: [
        { kind: 'user', id: 'u-1', ts, text: 'Make the cover bolder' },
        { kind: 'assistant', id: 'a-0', ts, text: 'Reading the cover first.', streaming: false },
        {
          kind: 'tool',
          id: 't-1',
          ts,
          name: 'Read',
          title: 'Read',
          detail: 'slides/alpha/index.tsx',
          status: 'done',
        },
        { kind: 'assistant', id: 'a-1', ts, text: 'Bolded the **cover** title.', streaming: false },
        { kind: 'result', id: 'r-1', ts, durationMs: 1000, costUsd: null, aborted: false },
      ],
    };
    const { items: _items, providerSessionId: _p, ...summary } = session;
    await page.route('**/__agent/sessions', (route) =>
      route.fulfill({ json: { sessions: [summary] } }),
    );
    await page.route('**/__agent/sessions/s-edit', (route) => route.fulfill({ json: session }));
    const sent: Record<string, unknown>[] = [];
    await page.route('**/__agent/sessions/s-edit/messages', (route) => {
      sent.push(route.request().postDataJSON());
      return route.fulfill({ status: 202, json: { ok: true } });
    });
    await page.addInitScript(() => localStorage.setItem('open-slide:agent-session', 's-edit'));

    await openSlide(page, 'alpha');
    await page.keyboard.press('a');
    const dock = page.locator('[data-agent-dock]');
    const reply = dock.getByText('Bolded the');
    await reply.hover();
    const replyCopy = dock
      .getByRole('listitem')
      .filter({ hasText: 'Bolded the' })
      .getByRole('button', {
        name: 'Copy',
      });
    await expect(
      dock.getByRole('listitem').filter({ hasText: 'Reading the cover' }).getByRole('button'),
    ).toHaveCount(0);
    await replyCopy.click();
    await expect(dock.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'Reading the cover first.\n\nBolded the **cover** title.',
    );

    await dock.getByText('Make the cover bolder').hover();
    await dock.getByRole('button', { name: 'Edit', exact: true }).click();
    const editor = dock.getByRole('textbox', { name: 'Edit', exact: true });
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Make the cover bolder');
    await page.keyboard.press('Escape');
    await expect(editor).toHaveCount(0);
    await expect(dock).toBeVisible();

    await dock.getByText('Make the cover bolder').hover();
    await dock.getByRole('button', { name: 'Edit', exact: true }).click();
    await editor.fill('Make the cover title red');
    await editor.press('Enter');
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0]).toMatchObject({ text: 'Make the cover title red', edit: 'u-1' });
  });

  test('opening the panel on another deck starts a new conversation', async ({ page }) => {
    await mockStatus(page, (p) =>
      p.id === 'claude'
        ? { cliFound: true, ready: true, sdkVersion: '0.0.0' }
        : { cliFound: false, ready: false },
    );
    const ts = new Date().toISOString();
    const session = {
      id: 's-alpha',
      provider: 'claude',
      title: 'Tighten the alpha cover',
      createdAt: ts,
      updatedAt: ts,
      status: 'idle',
      slideId: 'alpha',
      providerSessionId: null,
      items: [{ kind: 'user', id: 'u-1', ts, text: 'Tighten the alpha cover' }],
    };
    const { items: _items, providerSessionId: _p, ...summary } = session;
    await page.route('**/__agent/sessions', (route) =>
      route.fulfill({ json: { sessions: [summary] } }),
    );
    await page.route('**/__agent/sessions/s-alpha', (route) => route.fulfill({ json: session }));
    await page.addInitScript(() => {
      localStorage.setItem('open-slide:agent-session', 's-alpha');
      localStorage.setItem('open-slide:agent-dock', '1');
    });

    await openSlide(page, 'alpha');
    const dock = page.locator('[data-agent-dock]');
    await expect(dock.getByText('Tighten the alpha cover')).toBeVisible();

    await openSlide(page, 'steps');
    await expect(dock.getByPlaceholder(/Ask Claude Code/)).toBeVisible();
    await expect(dock.getByText('Tighten the alpha cover')).toHaveCount(0);

    await dock.getByRole('button', { name: 'History', exact: true }).click();
    await dock.getByRole('button', { name: /Tighten the alpha cover/ }).click();
    await expect(page).toHaveURL(/\/s\/alpha$/);
    await expect(dock.getByText('Tighten the alpha cover')).toBeVisible();
  });

  test('New deck opens a blank deck with the agent dock asking for a brief', async ({
    page,
    request,
  }) => {
    const status = (await (await request.get('/__agent/status')).json()) as {
      enabled: boolean;
      packageManager: string;
      providers: ProviderStatus[];
    };
    await page.route('**/__agent/status', (route) =>
      route.fulfill({
        json: {
          ...status,
          providers: status.providers.map((p) =>
            p.id === 'claude' ? { ...p, ready: true } : { ...p, cliFound: false },
          ),
        },
      }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'New deck' }).click();
    await expect(page).toHaveURL(/\/s\/untitled[^/]*$/);
    const slideId = new URL(page.url()).pathname.split('/').pop() ?? '';

    const dock = page.locator('[data-agent-dock]');
    await expect(dock.getByRole('heading', { name: "What's this deck about?" })).toBeVisible();
    await expect(dock.getByPlaceholder('A 10-minute talk on…')).toBeFocused();

    await dock.getByRole('button', { name: /^Opus/ }).click();
    const menu = page.locator('[data-agent-model-menu]');
    await expect(menu.getByRole('tab', { name: 'Claude Code' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await menu.getByRole('button', { name: 'Sonnet', exact: true }).click();
    await menu.getByRole('button', { name: 'High', exact: true }).click();
    await expect(menu.getByRole('button', { name: 'High', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await menu.getByRole('tab', { name: 'Codex' }).click();
    await expect(menu.getByRole('button', { name: 'Connect' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dock.getByRole('button', { name: 'Sonnet High' })).toBeVisible();

    expect((await request.delete(`/__slides/${slideId}`)).status()).toBe(200);
  });
});
