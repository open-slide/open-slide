import { describe, expect, it } from 'vitest';
import { deckUrl, embedCode, embedUrl } from './share-links';

describe('embedUrl', () => {
  it('points at the embed route under the base path', () => {
    expect(embedUrl('https://decks.example.com', '/', 'q3-review')).toBe(
      'https://decks.example.com/s/q3-review/embed',
    );
    expect(embedUrl('https://example.com', '/talks/', 'intro')).toBe(
      'https://example.com/talks/s/intro/embed',
    );
    expect(embedUrl('https://example.com', '/talks', 'intro')).toBe(
      'https://example.com/talks/s/intro/embed',
    );
  });

  it('encodes the slide id', () => {
    expect(embedUrl('https://example.com', '/', 'a b/c')).toBe(
      'https://example.com/s/a%20b%2Fc/embed',
    );
  });
});

describe('deckUrl', () => {
  it('links to the deck at a page', () => {
    expect(deckUrl('/', 'intro', 3)).toBe('/s/intro?p=3');
  });
});

describe('embedCode', () => {
  it('builds a responsive 16:9 iframe that allows fullscreen', () => {
    expect(embedCode('https://example.com/s/intro/embed', 'Intro')).toBe(
      '<iframe src="https://example.com/s/intro/embed" title="Intro" style="width:100%;aspect-ratio:1920/1080;border:0" allow="fullscreen" allowfullscreen></iframe>',
    );
  });

  it('escapes attribute values', () => {
    expect(embedCode('https://example.com/?a=1&b=2', 'Q&A "live" <draft>')).toContain(
      'src="https://example.com/?a=1&amp;b=2" title="Q&amp;A &quot;live&quot; &lt;draft&gt;"',
    );
  });
});
