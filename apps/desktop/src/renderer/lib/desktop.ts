import { useEffect, useState, useSyncExternalStore } from 'react';
import type { AppState, LogTask, ShellApi } from '../../shared/types';

declare global {
  interface Window {
    desktop: ShellApi;
  }
}

export const desktop = window.desktop;

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

export function useColorScheme() {
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
}
