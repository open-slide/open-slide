type Options = {
  confirm: () => Promise<boolean>;
  cleanup: () => Promise<unknown>;
  quit: () => void;
};

export class QuitGate {
  private state: 'idle' | 'asking' | 'cleaning' | 'done' = 'idle';

  constructor(private readonly opts: Options) {}

  get leaving(): boolean {
    return this.state === 'cleaning' || this.state === 'done';
  }

  beforeQuit(event: { preventDefault(): void }) {
    if (this.state === 'done') return;
    event.preventDefault();
    this.request();
  }

  request(finish: () => void = this.opts.quit) {
    if (this.state === 'idle') void this.run(finish);
  }

  private async run(finish: () => void) {
    this.state = 'asking';
    const confirmed = await this.opts.confirm().catch(() => false);
    if (!confirmed) {
      this.state = 'idle';
      return;
    }
    this.state = 'cleaning';
    await this.opts.cleanup().catch(() => {});
    this.state = 'done';
    finish();
  }
}
