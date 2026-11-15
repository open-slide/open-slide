type Options = {
  // Resolves false when the user chose to stay.
  confirm: () => Promise<boolean>;
  cleanup: () => Promise<unknown>;
  quit: () => void;
};

// Quitting is asynchronous here: unsaved work is settled first, then child
// processes and telemetry get to finish. Electron's before-quit is held back
// until both are done, and let through the second time around.
export class QuitGate {
  private state: 'idle' | 'asking' | 'cleaning' | 'done' = 'idle';

  constructor(private readonly opts: Options) {}

  // Once the user has agreed to quit, windows close without asking again.
  get leaving(): boolean {
    return this.state === 'cleaning' || this.state === 'done';
  }

  beforeQuit(event: { preventDefault(): void }) {
    if (this.state === 'done') return;
    event.preventDefault();
    if (this.state === 'idle') void this.run();
  }

  private async run() {
    this.state = 'asking';
    const confirmed = await this.opts.confirm().catch(() => false);
    if (!confirmed) {
      this.state = 'idle';
      return;
    }
    this.state = 'cleaning';
    await this.opts.cleanup().catch(() => {});
    this.state = 'done';
    this.opts.quit();
  }
}
