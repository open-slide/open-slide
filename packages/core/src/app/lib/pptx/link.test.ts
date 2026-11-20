import { describe, expect, it } from 'vitest';
import { exportableHref } from './measure';

describe('exportableHref', () => {
  const origin = 'http://localhost:5173';

  it('keeps external web and mail links', () => {
    expect(exportableHref('https://example.com/a?b=1', origin)).toBe('https://example.com/a?b=1');
    expect(exportableHref('mailto:hi@example.com', origin)).toBe('mailto:hi@example.com');
  });

  it('drops in-app routes, hash links and other schemes', () => {
    expect(exportableHref('http://localhost:5173/s/deck', origin)).toBeNull();
    expect(exportableHref('http://localhost:5173/s/deck#3', origin)).toBeNull();
    expect(exportableHref('javascript:alert(1)', origin)).toBeNull();
    expect(exportableHref('not a url', origin)).toBeNull();
  });
});
