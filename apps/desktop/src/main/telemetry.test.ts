import { gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  telemetry: true,
  onboarded: true,
  requests: [] as string[],
}));

vi.mock('electron', () => ({
  app: { isPackaged: true, getLocale: () => 'en-US', getPath: () => '/nowhere', on: () => {} },
  crashReporter: { start: () => {} },
}));
vi.mock('./settings', () => ({
  settings: {
    get: () => ({ telemetry: fixture.telemetry }),
    onboarded: () => fixture.onboarded,
    installId: () => 'test-install',
    lastVersion: () => 'test',
    crashCheckedAt: () => 0,
    setCrashCheckedAt: () => {},
    setLastVersion: () => {},
  },
}));
vi.mock('./workspace', () => ({ bundledCore: () => ({ version: 'test' }) }));
// The real SDK, with its transport replaced: nothing here reaches the network.
vi.mock('posthog-node', async (importOriginal) => {
  const { PostHog } = await importOriginal<typeof import('posthog-node')>();
  return {
    PostHog: class extends PostHog {
      constructor(token: string, options: ConstructorParameters<typeof PostHog>[1]) {
        super(token, {
          ...options,
          fetch: async (_url, init) => {
            const body = init.body;
            fixture.requests.push(
              typeof body === 'string' ? body : gunzipSync(body as Uint8Array).toString(),
            );
            return new Response('{"status":"Ok"}', { status: 200 });
          },
        });
      }
    },
  };
});

const BATCH_INTERVAL_MS = 30_000;

async function load() {
  vi.resetModules();
  const telemetry = await import('./telemetry');
  telemetry.initTelemetry();
  return telemetry;
}

async function sent(event: string): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    if (fixture.requests.join('\n').includes(event)) return true;
    await new Promise((resolve) => setImmediate(resolve));
  }
  return false;
}

describe('telemetry opt-out', () => {
  beforeEach(() => {
    fixture.telemetry = true;
    fixture.onboarded = true;
    fixture.requests = [];
    vi.stubEnv('MAIN_VITE_POSTHOG_TOKEN', 'test-token');
    vi.stubEnv('OPEN_SLIDE_TELEMETRY', '1');
    vi.stubEnv('DO_NOT_TRACK', '0');
    Object.defineProperty(process, 'getSystemVersion', { configurable: true, value: () => 'test' });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    delete (process as { getSystemVersion?: unknown }).getSystemVersion;
  });

  it('sends a waiting event when its batch is due', async () => {
    const telemetry = await load();
    telemetry.track('control_event');
    expect(fixture.requests).toHaveLength(0);

    vi.advanceTimersByTime(BATCH_INTERVAL_MS);
    vi.useRealTimers();

    expect(await sent('control_event')).toBe(true);
    await telemetry.shutdownTelemetry();
  });

  it('sends waiting events on shutdown while telemetry is on', async () => {
    const telemetry = await load();
    telemetry.track('shutdown_event');
    vi.useRealTimers();

    await telemetry.shutdownTelemetry();

    expect(fixture.requests.join('\n')).toContain('shutdown_event');
  });

  it('drops everything not yet sent when telemetry is turned off', async () => {
    const telemetry = await load();
    telemetry.track('before_opt_out');
    telemetry.captureError(new Error('before opt out'));

    fixture.telemetry = false;
    telemetry.setTelemetryEnabled(false);
    telemetry.track('after_opt_out');

    vi.advanceTimersByTime(BATCH_INTERVAL_MS * 4);
    vi.useRealTimers();
    await telemetry.shutdownTelemetry();

    expect(await sent('opt_out')).toBe(false);
    expect(fixture.requests).toHaveLength(0);
  });

  it('never sends an event the SDK was still preparing when telemetry was turned off', async () => {
    const telemetry = await load();
    telemetry.track('handed_to_sdk');
    // The batch hands the event to the SDK, which prepares it asynchronously.
    vi.advanceTimersByTime(BATCH_INTERVAL_MS);

    fixture.telemetry = false;
    telemetry.setTelemetryEnabled(false);
    vi.useRealTimers();
    await telemetry.shutdownTelemetry();

    expect(fixture.requests).toHaveLength(0);
  });

  it('sends only what was tracked after telemetry is turned back on', async () => {
    const telemetry = await load();
    telemetry.track('while_on');
    fixture.telemetry = false;
    telemetry.setTelemetryEnabled(false);
    telemetry.track('while_off');
    fixture.telemetry = true;
    telemetry.setTelemetryEnabled(true);
    telemetry.track('back_on');
    vi.useRealTimers();

    await telemetry.shutdownTelemetry();

    const all = fixture.requests.join('\n');
    expect(all).toContain('back_on');
    expect(all).not.toContain('while_on');
    expect(all).not.toContain('while_off');
  });

  it('holds events until the tour ends, and drops them on quit before that', async () => {
    fixture.onboarded = false;
    const telemetry = await load();
    telemetry.track('during_tour');
    vi.advanceTimersByTime(BATCH_INTERVAL_MS * 2);
    vi.useRealTimers();

    await telemetry.shutdownTelemetry();

    expect(fixture.requests).toHaveLength(0);
  });
});

describe('error scrubbing', () => {
  async function scrub(message: string) {
    const { scrubError } = await import('./telemetry');
    return scrubError(new Error(message));
  }

  it('removes a whole unquoted path even when its folders have spaces', async () => {
    const { message } = await scrub('Cannot load /Volumes/Client Alpha/Board Review.pdf');
    expect(message).toBe('Cannot load <path>');
  });

  it('removes Windows drive and network share paths', async () => {
    expect((await scrub('Cannot open C:\\Users\\Ann Lee\\Board Deck\\index.tsx')).message).toBe(
      'Cannot open <path>',
    );
    expect((await scrub('Cannot open \\\\fileserver\\team\\ConfidentialDeck')).message).toBe(
      'Cannot open <path>',
    );
    expect((await scrub('ENOENT: open "\\\\fileserver\\team\\Deck"')).message).toBe(
      'ENOENT: open "<path>"',
    );
  });

  it('keeps what follows a path on its line, and text that only looks like one', async () => {
    expect((await scrub("ENOENT: no such file, open '/Users/ann/My Deck/a.tsx'")).message).toBe(
      "ENOENT: no such file, open '<path>'",
    );
    expect((await scrub('/srv/decks/a.tsx: Unexpected token')).message).toBe(
      '<path>: Unexpected token',
    );
    expect((await scrub('Expected application/json and/or text')).message).toBe(
      'Expected application/json and/or text',
    );
  });

  it('does not expand replacement patterns from the message into the stack', async () => {
    const { stack } = await scrub("Cannot open /Volumes/Client/Deck $& $'");
    expect(stack).toContain('Cannot open <path>');
    expect(stack).not.toContain('/Volumes/Client');
  });
});
