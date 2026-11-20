import { describe, expect, it, vi } from 'vitest';
import type { UpdateStatus } from '../shared/types';
import { type UpdateHandlers, Updater, updateDialog } from './updater';

function setup() {
  let handlers: UpdateHandlers | null = null;
  let finishCheck: (error?: Error) => void = () => {};
  const source = {
    check: vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          finishCheck = (error) => (error ? reject(error) : resolve());
        }),
    ),
    install: vi.fn(),
    subscribe: (next: UpdateHandlers) => {
      handlers = next;
    },
  };
  const notify = vi.fn<(status: UpdateStatus) => void>();
  const restart = vi.fn((install: () => void) => install());
  const updater = new Updater({ source, onChange: () => {}, restart, notify });
  const emit = () => {
    if (!handlers) throw new Error('not subscribed');
    return handlers;
  };
  return { updater, source, notify, restart, emit, finishCheck: (e?: Error) => finishCheck(e) };
}

describe('Updater', () => {
  it('reports updates as unsupported without a source', () => {
    const updater = new Updater({
      source: null,
      onChange: () => {},
      restart: () => {},
      notify: () => {},
    });
    updater.check(true);
    expect(updater.status).toEqual({ state: 'unsupported' });
  });

  it('follows a found update through download to ready', () => {
    const { updater, emit } = setup();
    updater.check();
    expect(updater.status).toEqual({ state: 'checking' });
    emit().available('0.0.2');
    emit().progress(41.7);
    expect(updater.status).toEqual({ state: 'downloading', version: '0.0.2', percent: 41 });
    emit().downloaded('0.0.2');
    expect(updater.status).toEqual({ state: 'ready', version: '0.0.2' });
  });

  it('tells only an interactive check how it went', () => {
    const { updater, emit, notify } = setup();
    updater.check();
    emit().none();
    expect(notify).not.toHaveBeenCalled();

    updater.check(true);
    emit().none();
    expect(notify).toHaveBeenCalledWith({ state: 'up-to-date' });
  });

  it('upgrades a running background check when the user asks too', () => {
    const { updater, source, emit, notify } = setup();
    updater.check();
    updater.check(true);
    expect(source.check).toHaveBeenCalledOnce();
    emit().available('0.0.2');
    expect(notify).toHaveBeenCalledWith({ state: 'downloading', version: '0.0.2', percent: 0 });
  });

  it('does not check again while an update is on its way', () => {
    const { updater, source, emit, notify } = setup();
    updater.check();
    emit().available('0.0.2');
    updater.check();
    updater.check(true);
    expect(source.check).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith(updater.status);
  });

  it('turns a rejected check into an error once', async () => {
    const { updater, emit, finishCheck, notify } = setup();
    updater.check(true);
    emit().error(new Error('Cannot find latest-mac.yml\n  at stack'));
    finishCheck(new Error('Cannot find latest-mac.yml'));
    await vi.waitFor(() => expect(notify).toHaveBeenCalledOnce());
    expect(updater.status).toEqual({ state: 'error', message: 'Cannot find latest-mac.yml' });
  });

  it('installs only a downloaded update, through the restart flow', () => {
    const { updater, source, restart, emit } = setup();
    updater.install();
    expect(restart).not.toHaveBeenCalled();
    updater.check();
    emit().downloaded('0.0.2');
    updater.install();
    expect(restart).toHaveBeenCalledOnce();
    expect(source.install).toHaveBeenCalledOnce();
  });
});

describe('updateDialog', () => {
  it('offers a restart once the update is ready', () => {
    const options = updateDialog({ state: 'ready', version: '0.0.2' }, '0.0.1');
    expect(options?.buttons?.[options.defaultId ?? -1]).toBe('Restart Now');
  });

  it('stays quiet for states the user did not ask about', () => {
    expect(updateDialog({ state: 'checking' }, '0.0.1')).toBeNull();
  });
});
