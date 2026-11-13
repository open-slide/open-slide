import { describe, expect, it } from 'vitest';
import { serverInfoUrl } from './server-info-plugin.ts';

describe('serverInfoUrl', () => {
  it('maps wildcard binds to localhost', () => {
    expect(serverInfoUrl({ address: '::', family: 'IPv6', port: 5173 }, false, '/')).toBe(
      'http://localhost:5173/',
    );
    expect(serverInfoUrl({ address: '0.0.0.0', family: 'IPv4', port: 5174 }, false, '/')).toBe(
      'http://localhost:5174/',
    );
  });

  it('keeps explicit hosts and brackets IPv6 literals', () => {
    expect(serverInfoUrl({ address: '127.0.0.1', family: 'IPv4', port: 4000 }, false, '/')).toBe(
      'http://127.0.0.1:4000/',
    );
    expect(serverInfoUrl({ address: '::1', family: 'IPv6', port: 4000 }, false, '/')).toBe(
      'http://[::1]:4000/',
    );
  });

  it('honors https and the configured base', () => {
    expect(
      serverInfoUrl({ address: '127.0.0.1', family: 'IPv4', port: 443 }, true, '/decks/'),
    ).toBe('https://127.0.0.1:443/decks/');
  });

  it('ignores relative bases', () => {
    expect(serverInfoUrl({ address: '::', family: 'IPv6', port: 5173 }, false, './')).toBe(
      'http://localhost:5173/',
    );
  });
});
