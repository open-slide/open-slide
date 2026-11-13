import { afterEach, describe, expect, it, vi } from 'vitest';
import { rememberPresenting, wasPresenting } from './presenting-session';

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}

describe('presenting session', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('remembers only the deck being presented', () => {
    vi.stubGlobal('sessionStorage', memoryStorage());
    rememberPresenting('alpha');
    expect(wasPresenting('alpha')).toBe(true);
    expect(wasPresenting('beta')).toBe(false);

    rememberPresenting(null);
    expect(wasPresenting('alpha')).toBe(false);
  });

  it('treats unavailable storage as not presenting', () => {
    vi.stubGlobal('sessionStorage', undefined);
    expect(() => rememberPresenting('alpha')).not.toThrow();
    expect(wasPresenting('alpha')).toBe(false);
  });
});
