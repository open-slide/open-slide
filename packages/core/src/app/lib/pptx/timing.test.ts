import { describe, expect, it } from 'vitest';
import { transitionXml } from './timing';

describe('transitionXml', () => {
  it('returns an empty string for no transition', () => {
    expect(transitionXml(null)).toBe('');
  });

  it('emits fade with p14 duration and a plain fallback', () => {
    const xml = transitionXml({ effect: 'fade', durationMs: 320, direction: null });
    expect(xml).toContain('<mc:AlternateContent');
    expect(xml).toContain('Requires="p14"');
    expect(xml).toContain('<p:transition');
    expect(xml).toContain('p14:dur="320"');
    expect(xml).toContain('<p:fade/>');
    expect(xml).toContain(
      '<mc:Fallback><p:transition spd="fast"><p:fade/></p:transition></mc:Fallback>',
    );
  });

  it('maps push directions to p:push dir', () => {
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'up' })).toContain(
      '<p:push dir="u"/>',
    );
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'down' })).toContain(
      '<p:push dir="d"/>',
    );
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'left' })).toContain(
      '<p:push dir="l"/>',
    );
    expect(transitionXml({ effect: 'push', durationMs: 500, direction: 'right' })).toContain(
      '<p:push dir="r"/>',
    );
  });

  it('emits wipe with the side direction', () => {
    expect(transitionXml({ effect: 'wipe', durationMs: 500, direction: 'left' })).toContain(
      '<p:wipe dir="l"/>',
    );
  });

  it('emits morph with a p159 choice and fade fallback', () => {
    const xml = transitionXml({ effect: 'morph', durationMs: 900, direction: null });
    expect(xml).toContain('Requires="p159"');
    expect(xml).toContain('<p159:morph option="byObject"/>');
    expect(xml).toContain(
      '<mc:Fallback><p:transition spd="med"><p:fade/></p:transition></mc:Fallback>',
    );
  });
});
