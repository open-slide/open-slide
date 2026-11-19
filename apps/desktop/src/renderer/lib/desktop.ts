import { useEffect, useState, useSyncExternalStore } from 'react';
import type {
  AgentId,
  AppState,
  LoginState,
  LogTask,
  ShellApi,
  SwitcherState,
  TaskResult,
} from '../../shared/types';

declare global {
  interface Window {
    desktop: ShellApi;
  }
}

export const desktop = window.desktop;

export const TELEMETRY_DOCS_URL = 'https://open-slide.dev/docs/reference/desktop-telemetry';

export async function settle(task: Promise<TaskResult>): Promise<TaskResult> {
  try {
    return await task;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const appState = createStore<AppState | null>(null);
void desktop.getState().then(appState.set);
desktop.onState(appState.set);

export function useAppState(): AppState | null {
  return useSyncExternalStore(appState.subscribe, appState.get);
}

const switcher = createStore<SwitcherState | null>(null);
desktop.switcher.onState(switcher.set);

export function useSwitcher(): SwitcherState | null {
  return useSyncExternalStore(switcher.subscribe, switcher.get);
}

const logins = createStore<Partial<Record<AgentId, LoginState>>>({});
const publishLogin = (next: LoginState) => logins.set({ ...logins.get(), [next.id]: next });

// Subscribed before the snapshot is requested: IPC is ordered, so it never clobbers newer state.
desktop.agents.onLoginState(publishLogin);
void desktop.agents
  .logins()
  .then((all) => {
    for (const login of all) publishLogin(login);
  })
  .catch(() => {});

export function useLogins(): Partial<Record<AgentId, LoginState>> {
  return useSyncExternalStore(logins.subscribe, logins.get);
}

const LOG_LIMIT = 40_000;

export function useLog(task: LogTask): [string, (text: string) => void] {
  const [text, setText] = useState('');
  useEffect(
    () =>
      desktop.onLog((event) => {
        if (event.task === task) setText((prev) => (prev + event.chunk).slice(-LOG_LIMIT));
      }),
    [task],
  );
  return [text, setText];
}

const root = document.documentElement;
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function useWindowAppearance() {
  const state = useAppState();
  const translucent = state?.translucent ?? false;
  const accent = state?.accent ?? null;

  useEffect(() => {
    const apply = () => {
      root.classList.toggle('dark', darkQuery.matches);
      root.style.colorScheme = darkQuery.matches ? 'dark' : 'light';
    };
    apply();
    darkQuery.addEventListener('change', apply);
    return () => darkQuery.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    root.toggleAttribute('data-translucent', translucent);
  }, [translucent]);

  useEffect(() => {
    if (accent) root.style.setProperty('--ring', accent);
    else root.style.removeProperty('--ring');
  }, [accent]);

  useEffect(() => {
    const apply = (focused: boolean) => root.toggleAttribute('data-inactive', !focused);
    void desktop.window.isFocused().then(apply);
    return desktop.window.onFocus(apply);
  }, []);
}
