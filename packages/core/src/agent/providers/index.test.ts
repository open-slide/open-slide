import { describe, expect, it } from 'vitest';
import { createProviders } from './index.ts';

const custom = { id: 'my-agent', name: 'My Agent', type: 'acp' as const, command: 'my-agent' };

describe('createProviders', () => {
  it('offers the built-in providers next to configured ACP agents', () => {
    expect(Object.keys(createProviders([custom]))).toEqual(['claude', 'codex', 'my-agent']);
  });

  it('offers only configured ACP agents when built-ins are off', () => {
    expect(Object.keys(createProviders([custom], '1.0.0', false))).toEqual(['my-agent']);
  });
});
