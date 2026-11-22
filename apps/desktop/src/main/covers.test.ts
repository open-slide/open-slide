import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  loads: [] as string[],
  windows: 0,
  states: {} as Record<string, string>,
  hold: null as Promise<void> | null,
}));

vi.mock('electron', () => ({
  BrowserWindow: class {
    private url = '';
    private destroyed = false;
    webContents = {
      setAudioMuted: () => {},
      loadURL: async (url: string) => {
        this.url = url;
        fixture.loads.push(new URL(url).pathname);
        await fixture.hold;
      },
      executeJavaScript: async () => {
        const deck = this.url.split('/').at(-2) ?? '';
        return fixture.states[deck] ?? 'ready';
      },
      capturePage: async () => ({
        isEmpty: () => false,
        resize: () => ({ toJPEG: () => Buffer.from(this.url) }),
      }),
    };
    constructor() {
      fixture.windows++;
    }
    isDestroyed() {
      return this.destroyed;
    }
    destroy() {
      this.destroyed = true;
    }
  },
}));

const { DeckCovers } = await import('./covers');

const BASE = 'http://localhost:5173';

function setup() {
  const state = { idle: true, changes: 0 };
  const covers = new DeckCovers({ idle: () => state.idle, onChange: () => state.changes++ });
  covers.setBaseUrl(BASE);
  const pictured = (slideId: string) => {
    const cover = covers.get(slideId);
    return cover ? Buffer.from(cover.split(',')[1], 'base64').toString() : null;
  };
  return { covers, state, pictured };
}

describe('DeckCovers', () => {
  beforeEach(() => {
    fixture.loads = [];
    fixture.windows = 0;
    fixture.states = {};
    fixture.hold = null;
  });

  it('pictures the first page of each open deck, one at a time in one window', async () => {
    const { covers, state, pictured } = setup();

    covers.sync(['roadmap', 'q3 review']);
    covers.sync(['roadmap', 'q3 review']);
    await vi.waitFor(() => expect(state.changes).toBe(2));

    expect(fixture.loads).toEqual(['/s/roadmap/preview', '/s/q3%20review/preview']);
    expect(fixture.windows).toBe(1);
    expect(pictured('roadmap')).toBe(`${BASE}/s/roadmap/preview`);
    expect(covers.get('q3 review')).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('waits until the tabs have settled', async () => {
    const { covers, state } = setup();
    state.idle = false;

    covers.sync(['roadmap']);
    await new Promise((resolve) => setImmediate(resolve));
    expect(fixture.loads).toEqual([]);

    state.idle = true;
    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(covers.get('roadmap')).not.toBeNull());
  });

  it('leaves a deck that fails to render alone until it is refreshed', async () => {
    const { covers } = setup();
    fixture.states.broken = 'error';

    covers.sync(['broken']);
    await vi.waitFor(() => expect(fixture.loads).toHaveLength(1));
    await new Promise((resolve) => setImmediate(resolve));
    covers.sync(['broken']);
    await new Promise((resolve) => setImmediate(resolve));
    expect(fixture.loads).toHaveLength(1);
    expect(covers.get('broken')).toBeNull();

    fixture.states.broken = 'ready';
    covers.refresh('broken');
    await vi.waitFor(() => expect(covers.get('broken')).not.toBeNull());
  });

  it('pictures a deck again when asked, keeping the old cover meanwhile', async () => {
    const { covers, state } = setup();
    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(state.changes).toBe(1));

    covers.refresh('roadmap');
    expect(covers.get('roadmap')).not.toBeNull();
    await vi.waitFor(() => expect(state.changes).toBe(2));
    expect(fixture.loads).toHaveLength(2);
  });

  it('forgets decks that are no longer open', async () => {
    const { covers } = setup();
    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(covers.get('roadmap')).not.toBeNull());

    covers.sync([]);

    expect(covers.get('roadmap')).toBeNull();
  });

  it('drops a capture that was under way when the workspace changed', async () => {
    const { covers, state } = setup();
    let release = () => {};
    fixture.hold = new Promise((resolve) => {
      release = resolve;
    });

    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(fixture.loads).toHaveLength(1));
    covers.clear();
    release();
    await new Promise((resolve) => setImmediate(resolve));

    expect(covers.get('roadmap')).toBeNull();
    expect(state.changes).toBe(0);
  });

  it('drops a capture that was under way when its deck was closed', async () => {
    const { covers, state } = setup();
    fixture.states.roadmap = 'error';
    let release = () => {};
    fixture.hold = new Promise((resolve) => {
      release = resolve;
    });

    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(fixture.loads).toHaveLength(1));
    covers.sync([]);
    release();
    await new Promise((resolve) => setImmediate(resolve));

    fixture.states.roadmap = 'ready';
    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(covers.get('roadmap')).not.toBeNull());
    expect(fixture.loads).toHaveLength(2);
    expect(state.changes).toBe(1);
  });

  it('pictures a deck again when it was closed and reopened mid-capture', async () => {
    const { covers, state } = setup();
    let release = () => {};
    fixture.hold = new Promise((resolve) => {
      release = resolve;
    });

    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(fixture.loads).toHaveLength(1));
    covers.sync([]);
    covers.sync(['roadmap']);
    release();

    await vi.waitFor(() => expect(fixture.loads).toHaveLength(2));
    await vi.waitFor(() => expect(state.changes).toBe(1));
    expect(covers.get('roadmap')).not.toBeNull();
  });

  it('pictures a deck again when the workspace changed mid-capture and it is still open', async () => {
    const { covers, state } = setup();
    let release = () => {};
    fixture.hold = new Promise((resolve) => {
      release = resolve;
    });

    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(fixture.loads).toHaveLength(1));
    covers.clear();
    covers.sync(['roadmap']);
    release();

    await vi.waitFor(() => expect(state.changes).toBe(1));
    expect(fixture.loads).toHaveLength(2);
  });
  it('pictures open decks again when the server moves to another address', async () => {
    const { covers, state, pictured } = setup();
    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(state.changes).toBe(1));

    covers.setBaseUrl('http://localhost:5174');

    expect(covers.get('roadmap')).toBeNull();
    await vi.waitFor(() =>
      expect(pictured('roadmap')).toBe('http://localhost:5174/s/roadmap/preview'),
    );
  });

  it('drops a capture from the old address when the server moved mid-capture', async () => {
    const { covers, pictured } = setup();
    let release = () => {};
    fixture.hold = new Promise((resolve) => {
      release = resolve;
    });

    covers.sync(['roadmap']);
    await vi.waitFor(() => expect(fixture.loads).toHaveLength(1));
    covers.setBaseUrl('http://localhost:5174');
    release();

    await vi.waitFor(() => expect(fixture.loads).toHaveLength(2));
    await vi.waitFor(() =>
      expect(pictured('roadmap')).toBe('http://localhost:5174/s/roadmap/preview'),
    );
  });

  it('throws away a window whose capture hangs and moves on to the next deck', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const { covers } = setup();
      fixture.hold = new Promise(() => {});

      covers.sync(['stuck', 'roadmap']);
      await vi.waitFor(() => expect(fixture.loads).toHaveLength(1));
      fixture.hold = null;
      await vi.advanceTimersByTimeAsync(20_000);

      await vi.waitFor(() => expect(covers.get('roadmap')).not.toBeNull());
      expect(covers.get('stuck')).toBeNull();
      expect(fixture.windows).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
