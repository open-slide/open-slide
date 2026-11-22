import { describe, expect, it } from 'vitest';
import { deckIdFromPath, isHomePath, stripBase } from './desktop-routes.ts';

describe('deckIdFromPath', () => {
  it('reads the deck id from a deck root', () => {
    expect(deckIdFromPath('/s/intro')).toBe('intro');
    expect(deckIdFromPath('/s/intro/')).toBe('intro');
    expect(deckIdFromPath('/s/my%20deck')).toBe('my deck');
  });

  it('ignores paths below or outside a deck root', () => {
    expect(deckIdFromPath('/s/intro/presenter')).toBeNull();
    expect(deckIdFromPath('/')).toBeNull();
    expect(deckIdFromPath('/s/')).toBeNull();
  });

  it('returns null for a malformed escape instead of throwing', () => {
    expect(deckIdFromPath('/s/%E0%A4%A')).toBeNull();
  });

  it('strips the base first', () => {
    expect(deckIdFromPath('/docs/s/intro', '/docs')).toBe('intro');
    expect(deckIdFromPath('/s/intro', '/docs')).toBe('intro');
  });
});

describe('isHomePath', () => {
  it('treats anything outside /s/ as home', () => {
    expect(isHomePath('/')).toBe(true);
    expect(isHomePath('/?folder=a')).toBe(true);
    expect(isHomePath('/s/intro')).toBe(false);
    expect(isHomePath('/s/intro/presenter')).toBe(false);
  });

  it('strips the base first', () => {
    expect(isHomePath('/docs', '/docs')).toBe(true);
    expect(isHomePath('/docs/s/intro', '/docs')).toBe(false);
  });
});

describe('stripBase', () => {
  it('leaves paths alone without a base', () => {
    expect(stripBase('/s/intro')).toBe('/s/intro');
  });

  it('maps the bare base to the root', () => {
    expect(stripBase('/docs', '/docs')).toBe('/');
  });

  it('only strips a whole path segment', () => {
    expect(stripBase('/docs/s/a', '/docs')).toBe('/s/a');
    expect(stripBase('/docsy/s/a', '/docs')).toBe('/docsy/s/a');
  });
});
