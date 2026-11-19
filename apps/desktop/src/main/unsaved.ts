import type { MessageBoxOptions, WebContents } from 'electron';
import type { UnsavedAction, UnsavedOutcome, UnsavedStatus } from '../shared/types';

const QUERY_TIMEOUT_MS = 3000;
const SETTLE_TIMEOUT_MS = 20_000;
const ERROR_LIMIT = 400;

export type LeaveIntent = 'close' | 'reload' | 'switch' | 'restart' | 'quit';

const INTENTS: Record<LeaveIntent, { doing: string; anyway: string }> = {
  close: { doing: 'closing', anyway: 'Close Anyway' },
  reload: { doing: 'reloading', anyway: 'Reload Anyway' },
  switch: { doing: 'switching workspaces', anyway: 'Switch Anyway' },
  restart: { doing: 'restarting the server', anyway: 'Restart Anyway' },
  quit: { doing: 'quitting', anyway: 'Quit Anyway' },
};

export type UnsavedPage = {
  title: string;
  status: () => Promise<UnsavedStatus | null>;
  settle: (action: UnsavedAction) => Promise<UnsavedOutcome>;
  reveal: () => void;
};

export type Prompt = (options: MessageBoxOptions) => Promise<number>;

function parseStatus(payload: unknown): UnsavedStatus | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const { drafts, pending } = payload as Record<string, unknown>;
  if (typeof drafts !== 'boolean' || typeof pending !== 'boolean') return null;
  return { drafts, pending };
}

function parseOutcome(payload: unknown): UnsavedOutcome {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, error: 'The page did not respond.' };
  }
  const { ok, error } = payload as Record<string, unknown>;
  if (ok === true) return { ok: true };
  const message = typeof error === 'string' && error ? error : 'The changes could not be saved.';
  return { ok: false, error: message.slice(0, ERROR_LIMIT) };
}

export class UnsavedChannel {
  private readonly waiting = new Map<
    number,
    { contents: WebContents; finish: (payload: unknown) => void }
  >();
  private sequence = 0;

  page(contents: WebContents, title: string, reveal: () => void): UnsavedPage {
    return {
      title,
      reveal,
      status: async () => parseStatus(await this.ask(contents, 'query', QUERY_TIMEOUT_MS)),
      settle: async (action) => parseOutcome(await this.ask(contents, action, SETTLE_TIMEOUT_MS)),
    };
  }

  answer(contents: WebContents, request: unknown, payload: unknown) {
    const entry = typeof request === 'number' ? this.waiting.get(request) : undefined;
    if (entry?.contents === contents) entry.finish(payload);
  }

  private ask(
    contents: WebContents,
    action: 'query' | UnsavedAction,
    timeoutMs: number,
  ): Promise<unknown> {
    return new Promise((resolve) => {
      const request = ++this.sequence;
      const gone = () => finish(null);
      const timer = setTimeout(gone, timeoutMs);
      const finish = (payload: unknown) => {
        if (!this.waiting.delete(request)) return;
        clearTimeout(timer);
        contents.off('destroyed', gone);
        contents.off('render-process-gone', gone);
        resolve(payload);
      };
      this.waiting.set(request, { contents, finish });
      contents.once('destroyed', gone);
      contents.once('render-process-gone', gone);
      try {
        contents.send('host:unsaved', request, action);
      } catch {
        finish(null);
      }
    });
  }
}

function quoted(pages: UnsavedPage[]): string {
  return pages.length === 1 ? `“${pages[0].title}”` : `${pages.length} tabs`;
}

function titles(pages: UnsavedPage[]): string {
  return pages.length === 1 ? '' : `${pages.map((page) => page.title).join('\n')}\n\n`;
}

type FailedSave = { page: UnsavedPage; error: string };

async function settleAll(
  settling: { page: UnsavedPage; action: UnsavedAction }[],
): Promise<FailedSave[]> {
  const outcomes = await Promise.all(settling.map(({ page, action }) => page.settle(action)));
  return settling.flatMap(({ page }, i) => {
    const outcome = outcomes[i];
    return outcome.ok ? [] : [{ page, error: outcome.error }];
  });
}

export class UnsavedGuard {
  private busy = false;

  constructor(private readonly prompt: Prompt) {}

  async confirm(pages: UnsavedPage[], intent: LeaveIntent): Promise<boolean> {
    if (pages.length === 0) return true;
    if (this.busy) return false;
    this.busy = true;
    try {
      return await this.decide(pages, intent);
    } finally {
      this.busy = false;
    }
  }

  private async decide(pages: UnsavedPage[], intent: LeaveIntent): Promise<boolean> {
    const { doing, anyway } = INTENTS[intent];
    // A clean page can pick up work while another is settled, so all are asked again.
    let asking = pages;
    for (;;) {
      const statuses = await Promise.all(asking.map((page) => page.status()));
      const silent = asking.filter((_page, i) => statuses[i] === null);
      const drafted = asking.filter((_page, i) => statuses[i]?.drafts);
      const landing = asking.filter((_page, i) => statuses[i]?.pending && !statuses[i]?.drafts);
      if (silent.length + drafted.length + landing.length === 0) return true;

      if (silent.length > 0) {
        if (!(await this.confirmLosing(silent, anyway))) return false;
        asking = asking.filter((page) => !silent.includes(page));
      }
      const drafts = drafted.length > 0 ? await this.askAboutDrafts(drafted, doing) : 'save';
      if (drafts === 'cancel') return false;

      const failed = await settleAll([
        ...drafted.map((page) => ({ page, action: drafts })),
        ...landing.map((page) => ({ page, action: 'save' as const })),
      ]);
      if (failed.length === 0) continue;
      if (!(await this.confirmDiscarding(failed))) return false;
      await Promise.all(failed.map(({ page }) => page.settle('abandon')));
    }
  }

  private async confirmLosing(silent: UnsavedPage[], anyway: string): Promise<boolean> {
    silent[0].reveal();
    const choice = await this.prompt({
      type: 'warning',
      message: `${quoted(silent)} ${silent.length === 1 ? 'isn’t' : 'aren’t'} responding`,
      detail: `${titles(silent)}Any changes that haven’t been saved there will be lost.`,
      buttons: [anyway, 'Cancel'],
      defaultId: 1,
      cancelId: 1,
    });
    return choice === 0;
  }

  private async askAboutDrafts(
    drafted: UnsavedPage[],
    doing: string,
  ): Promise<'save' | 'discard' | 'cancel'> {
    drafted[0].reveal();
    const choice = await this.prompt({
      type: 'question',
      message: `Save changes to ${quoted(drafted)} before ${doing}?`,
      detail: `${titles(drafted)}Changes that aren’t saved will be lost.`,
      buttons: ['Save', 'Don’t Save', 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    });
    if (choice === 2) return 'cancel';
    return choice === 0 ? 'save' : 'discard';
  }

  private async confirmDiscarding(failed: FailedSave[]): Promise<boolean> {
    failed[0].page.reveal();
    const reasons = failed
      .map(({ page, error }) => (failed.length === 1 ? error : `${page.title}: ${error}`))
      .join('\n');
    const choice = await this.prompt({
      type: 'error',
      message: `Couldn’t save changes to ${quoted(failed.map(({ page }) => page))}`,
      detail: `${reasons}\n\nGo back to try again, or discard the changes.`,
      buttons: ['Go Back', 'Discard Changes'],
      defaultId: 0,
      cancelId: 0,
    });
    return choice === 1;
  }
}
