import { describe, expect, it } from 'vitest';
import { listeningMessage, listeningPort } from './supervision.ts';

describe('listeningPort', () => {
  it('reads the port a listening message reports', () => {
    expect(listeningPort(listeningMessage(5173))).toBe(5173);
  });

  it('ignores anything else', () => {
    expect(listeningPort(null)).toBeNull();
    expect(listeningPort('open-slide:listening')).toBeNull();
    expect(listeningPort({ type: 'other', port: 5173 })).toBeNull();
    expect(listeningPort({ type: 'open-slide:listening', port: '5173' })).toBeNull();
  });
});
