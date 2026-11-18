import { BrowserWindow, type WebContents } from 'electron';

const COVER_WIDTH = 640;
const COVER_HEIGHT = 360;
const SETTLE_TIMEOUT_MS = 12_000;
const POLL_MS = 100;
const IDLE_CLOSE_MS = 15_000;
const READ_STATE = `document.querySelector('[data-osd-preview]')?.getAttribute('data-osd-preview') ?? null`;

type DeckCoversOptions = {
  // Captures wait while this is false, so they never slow a load the user is watching.
  idle: () => boolean;
  onChange: () => void;
};

export class DeckCovers {
  private baseUrl: string | null = null;
  private readonly covers = new Map<string, string>();
  private readonly queue = new Set<string>();
  private readonly failed = new Set<string>();
  private current: { slideId: string; dropped: boolean } | null = null;
  private window: BrowserWindow | null = null;
  private closeTimer: NodeJS.Timeout | null = null;

  constructor(private readonly opts: DeckCoversOptions) {}

  get(slideId: string): string | null {
    return this.covers.get(slideId) ?? null;
  }

  setBaseUrl(url: string | null) {
    this.baseUrl = url;
    this.failed.clear();
    this.pump();
  }

  // Queues the decks that have no cover yet and forgets the ones no longer open.
  sync(slideIds: string[]) {
    const open = new Set(slideIds);
    if (this.current && !open.has(this.current.slideId)) this.current.dropped = true;
    for (const known of [this.covers, this.queue, this.failed]) {
      for (const id of [...known.keys()]) {
        if (!open.has(id)) known.delete(id);
      }
    }
    for (const id of open) {
      if (!this.covers.has(id) && !this.failed.has(id) && !this.capturing(id)) this.queue.add(id);
    }
    this.pump();
  }

  refresh(slideId: string) {
    this.failed.delete(slideId);
    if (!this.capturing(slideId)) this.queue.add(slideId);
    this.pump();
  }

  clear() {
    if (this.current) this.current.dropped = true;
    this.covers.clear();
    this.queue.clear();
    this.failed.clear();
    this.closeWindow();
  }

  private pump() {
    if (this.current !== null || !this.baseUrl || !this.opts.idle()) return;
    const [slideId] = this.queue;
    if (slideId === undefined) {
      this.closeTimer ??= setTimeout(() => this.closeWindow(), IDLE_CLOSE_MS);
      return;
    }
    this.queue.delete(slideId);
    const capture = { slideId, dropped: false };
    this.current = capture;
    void this.capture(slideId)
      .catch(() => null)
      .then((cover) => {
        this.current = null;
        if (!capture.dropped) {
          if (cover) {
            this.covers.set(slideId, cover);
            this.opts.onChange();
          } else {
            this.failed.add(slideId);
          }
        }
        this.pump();
      });
  }

  private capturing(slideId: string): boolean {
    return this.current?.slideId === slideId && !this.current.dropped;
  }

  private async capture(slideId: string): Promise<string | null> {
    const contents = this.contents();
    await contents.loadURL(`${this.baseUrl}/s/${encodeURIComponent(slideId)}/preview`);
    const deadline = Date.now() + SETTLE_TIMEOUT_MS;
    for (;;) {
      const state: unknown = await contents.executeJavaScript(READ_STATE);
      if (state === 'ready') break;
      if (state === 'error' || Date.now() > deadline) return null;
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
    const image = await contents.capturePage();
    if (image.isEmpty()) return null;
    const jpeg = image.resize({ width: COVER_WIDTH, quality: 'best' }).toJPEG(82);
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  }

  private contents(): WebContents {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
    if (!this.window || this.window.isDestroyed()) {
      // Offscreen, so the page keeps painting and settling without ever being shown.
      this.window = new BrowserWindow({
        show: false,
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        useContentSize: true,
        webPreferences: { offscreen: true, sandbox: true, contextIsolation: true },
      });
      this.window.webContents.setAudioMuted(true);
    }
    return this.window.webContents;
  }

  private closeWindow() {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
    if (this.window && !this.window.isDestroyed()) this.window.destroy();
    this.window = null;
  }
}
