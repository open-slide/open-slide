import type { MessageBoxOptions } from 'electron';
import type { UpdateStatus } from '../shared/types';

const FIRST_CHECK_DELAY_MS = 10_000;
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

export type UpdateHandlers = {
  available: (version: string) => void;
  progress: (percent: number) => void;
  none: () => void;
  downloaded: (version: string) => void;
  error: (error: unknown) => void;
};

export type UpdateSource = {
  check: () => Promise<unknown>;
  install: () => void;
  subscribe: (handlers: UpdateHandlers) => void;
};

type Options = {
  source: UpdateSource | null;
  onChange: () => void;
  // Restarting has to go through the quit flow, which may ask about unsaved work.
  restart: (install: () => void) => void;
  notify: (status: UpdateStatus) => void;
};

const MAX_MESSAGE_LENGTH = 240;

function messageOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const line = text.trim().split('\n')[0] ?? '';
  return line.length > MAX_MESSAGE_LENGTH ? `${line.slice(0, MAX_MESSAGE_LENGTH - 1)}…` : line;
}

export const RESTART_NOW = 0;

export function updateDialog(status: UpdateStatus, appVersion: string): MessageBoxOptions | null {
  switch (status.state) {
    case 'up-to-date':
      return {
        type: 'info',
        message: 'You’re up to date',
        detail: `open-slide ${appVersion} is the newest version.`,
      };
    case 'downloading':
      return {
        type: 'info',
        message: `Downloading open-slide ${status.version}`,
        detail: 'You can keep working. Restart once the download finishes to update.',
      };
    case 'ready':
      return {
        type: 'info',
        message: `open-slide ${status.version} is ready`,
        detail: 'Restart to finish updating.',
        buttons: ['Restart Now', 'Later'],
        defaultId: RESTART_NOW,
        cancelId: 1,
      };
    case 'error':
      return { type: 'warning', message: 'Couldn’t check for updates', detail: status.message };
    default:
      return null;
  }
}

export class Updater {
  private current: UpdateStatus;
  private interactive = false;
  private timers: NodeJS.Timeout[] = [];

  constructor(private readonly opts: Options) {
    this.current = opts.source ? { state: 'idle' } : { state: 'unsupported' };
    opts.source?.subscribe({
      available: (version) => this.settle({ state: 'downloading', version, percent: 0 }),
      progress: (percent) => {
        const rounded = Math.floor(percent);
        if (this.current.state === 'downloading' && this.current.percent !== rounded) {
          this.set({ ...this.current, percent: rounded });
        }
      },
      none: () => this.settle({ state: 'up-to-date' }),
      downloaded: (version) => this.set({ state: 'ready', version }),
      error: (error) => this.settle({ state: 'error', message: messageOf(error) }),
    });
  }

  get status(): UpdateStatus {
    return this.current;
  }

  start() {
    if (!this.opts.source) return;
    this.timers.push(
      setTimeout(() => this.check(), FIRST_CHECK_DELAY_MS),
      setInterval(() => this.check(), CHECK_INTERVAL_MS),
    );
    for (const timer of this.timers) timer.unref?.();
  }

  stop() {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }

  check(interactive = false) {
    const { source } = this.opts;
    if (!source) return;
    const { state } = this.current;
    if (state === 'checking') {
      this.interactive ||= interactive;
      return;
    }
    if (state === 'downloading' || state === 'ready') {
      if (interactive) this.opts.notify(this.current);
      return;
    }
    this.interactive = interactive;
    this.set({ state: 'checking' });
    source.check().catch((error: unknown) => {
      if (this.current.state === 'checking') {
        this.settle({ state: 'error', message: messageOf(error) });
      }
    });
  }

  install() {
    const { source } = this.opts;
    if (source && this.current.state === 'ready') this.opts.restart(() => source.install());
  }

  private settle(next: UpdateStatus) {
    this.set(next);
    if (!this.interactive) return;
    this.interactive = false;
    this.opts.notify(next);
  }

  private set(next: UpdateStatus) {
    this.current = next;
    this.opts.onChange();
  }
}
