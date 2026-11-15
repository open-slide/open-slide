import { useEffect, useState, useSyncExternalStore } from 'react';
import type {
  AgentId,
  AppState,
  LoginState,
  LogTask,
  ShellApi,
  TaskResult,
} from '../../shared/types';

declare global {
  interface Window {
    desktop: ShellApi;
  }
}

export const desktop = window.desktop;

export const TELEMETRY_DOCS_URL = 'https://open-slide.dev/docs/reference/desktop-telemetry';

// A handler that throws in the main process rejects the call instead of
// answering with a failed result.
export async function settle(task: Promise<TaskResult>): Promise<TaskResult> {
  try {
    return await task;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

let current: AppState | null = null;
const listeners = new Set<() => void>();

function publish(next: AppState) {
  current = next;
  for (const listener of listeners) listener();
}

void desktop.getState().then(publish);
desktop.onState(publish);

export function useAppState(): AppState | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

// Sign-ins run in the main process and outlive whatever started them, so a
// surface that mounts mid-way reads the same state as one that watched it all.
let logins: Partial<Record<AgentId, LoginState>> = {};
const loginListeners = new Set<() => void>();

function publishLogin(next: LoginState) {
  logins = { ...logins, [next.id]: next };
  for (const listener of loginListeners) listener();
}

// Subscribed before the snapshot is asked for, and both arrive in order, so
// the snapshot can only ever be overwritten by something newer.
desktop.agents.onLoginState(publishLogin);
void desktop.agents
  .logins()
  .then((all) => {
    for (const login of all) publishLogin(login);
  })
  .catch(() => {});

export function useLogins(): Partial<Record<AgentId, LoginState>> {
  return useSyncExternalStore(
    (listener) => {
      loginListeners.add(listener);
      return () => loginListeners.delete(listener);
    },
    () => logins,
  );
}

const LOG_LIMIT = 40_000;

export function useLog(task: LogTask, initial = ''): [string, (text: string) => void] {
  const [text, setText] = useState(initial);
  useEffect(
    () =>
      desktop.onLog((event) => {
        if (event.task === task) setText((prev) => (prev + event.chunk).slice(-LOG_LIMIT));
      }),
    [task],
  );
  return [text, setText];
}

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function useWindowAppearance() {
  const state = useAppState();
  const translucent = state?.translucent ?? false;
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      root.classList.toggle('dark', darkQuery.matches);
      root.style.colorScheme = darkQuery.matches ? 'dark' : 'light';
    };
    apply();
    darkQuery.addEventListener('change', apply);
    return () => darkQuery.removeEventListener('change', apply);
  }, []);
  useEffect(() => {
    document.documentElement.toggleAttribute('data-translucent', translucent);
  }, [translucent]);

  const accent = state?.accent ?? null;
  useEffect(() => {
    const style = document.documentElement.style;
    if (accent) style.setProperty('--ring', accent);
    else style.removeProperty('--ring');
  }, [accent]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (focused: boolean) => root.toggleAttribute('data-inactive', !focused);
    void desktop.window.isFocused().then(apply);
    return desktop.window.onFocus(apply);
  }, []);
}
