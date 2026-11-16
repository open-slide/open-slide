type Options = {
  confirm: () => Promise<boolean>;
  cleanup: () => Promise<unknown>;
  quit: () => void;
};

// Holds Electron's before-quit until unsaved work is settled and cleanup has
// finished, then lets the second one through.
export class QuitGate {
  private state: 'idle' | 'asking' | 'cleaning' | 'done' = 'idle';

  constructor(private readonly opts: Options) {}

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
