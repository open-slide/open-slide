import { expect, type Page, test } from '@playwright/test';
import { openSlide } from './helpers.ts';

type ProviderStatus = {
  id: string;
  name: string;
  sdkPackage: string;
  sdkInstalled: boolean;
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
    expect(claude.ready).toBe(claude.sdkInstalled);
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
    await mockStatus(page, () => ({ cliFound: false, sdkInstalled: false }));
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
        ? { cliFound: true, sdkInstalled: installed, ready: installed, sdkVersion: '0.0.0' }
        : { cliFound: false, sdkInstalled: false },
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
            p.id === 'claude'
              ? { ...p, sdkInstalled: true, ready: true }
              : { ...p, cliFound: false },
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
