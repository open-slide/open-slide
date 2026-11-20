import { describe, expect, it, vi } from 'vitest';
import { QuitGate } from './quit';

function setup(confirmed: boolean) {
  const order: string[] = [];
  let finishCleanup: () => void = () => {};
  const gate = new QuitGate({
    confirm: async () => {
      order.push('confirm');
      return confirmed;
    },
    cleanup: () =>
      new Promise<void>((resolve) => {
        order.push('cleanup');
        finishCleanup = resolve;
      }),
    quit: () => order.push('quit'),
  });
  const event = () => ({ preventDefault: vi.fn() });
  return { gate, order, event, finishCleanup: () => finishCleanup() };
}

describe('QuitGate', () => {
  it('keeps the app open if checking unsaved work fails', async () => {
    const confirm = vi
      .fn()
      .mockRejectedValueOnce(new Error('Page unavailable'))
      .mockResolvedValue(false);
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const quit = vi.fn();
    const gate = new QuitGate({ confirm, cleanup, quit });

    gate.beforeQuit({ preventDefault: vi.fn() });
    await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    await Promise.resolve();
    expect(gate.leaving).toBe(false);
    expect(cleanup).not.toHaveBeenCalled();
    expect(quit).not.toHaveBeenCalled();

    gate.beforeQuit({ preventDefault: vi.fn() });
    await vi.waitFor(() => expect(confirm).toHaveBeenCalledTimes(2));
  });

  it('holds the quit until unsaved work is settled and cleanup is done', async () => {
    const { gate, order, event, finishCleanup } = setup(true);
    const first = event();
    gate.beforeQuit(first);
    expect(first.preventDefault).toHaveBeenCalled();
    expect(gate.leaving).toBe(false);

    await vi.waitFor(() => expect(order).toEqual(['confirm', 'cleanup']));
    expect(gate.leaving).toBe(true);

    const again = event();
    gate.beforeQuit(again);
    expect(again.preventDefault).toHaveBeenCalled();

    finishCleanup();
    await vi.waitFor(() => expect(order).toEqual(['confirm', 'cleanup', 'quit']));

    const last = event();
    gate.beforeQuit(last);
    expect(last.preventDefault).not.toHaveBeenCalled();
  });

  it('stays open when the user cancels, and asks again next time', async () => {
    const { gate, order, event } = setup(false);
    gate.beforeQuit(event());
    await vi.waitFor(() => expect(order).toEqual(['confirm']));
    await Promise.resolve();
    expect(gate.leaving).toBe(false);

    gate.beforeQuit(event());
    await vi.waitFor(() => expect(order).toEqual(['confirm', 'confirm']));
    expect(order).not.toContain('cleanup');
    expect(order).not.toContain('quit');
  });

  it('ends a requested quit with its own finish step instead of quitting', async () => {
    const { gate, order, finishCleanup } = setup(true);
    gate.request(() => order.push('install'));
    await vi.waitFor(() => expect(order).toEqual(['confirm', 'cleanup']));
    finishCleanup();
    await vi.waitFor(() => expect(order).toEqual(['confirm', 'cleanup', 'install']));
  });
});
