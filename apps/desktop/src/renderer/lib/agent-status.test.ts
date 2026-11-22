import { describe, expect, it } from 'vitest';
import { agentStatus, agentStatusTone } from './agent-status';

const installed = { cliPath: '/usr/local/bin/claude', cliInstallable: true };

describe('agentStatus', () => {
  it('tells an agent this platform cannot run from one that downloads on sign-in', () => {
    expect(agentStatus({ cliPath: null, cliInstallable: false, signedIn: null })).toBe(
      'unavailable',
    );
    expect(agentStatus({ cliPath: null, cliInstallable: true, signedIn: false })).toBe(
      'not-installed',
    );
  });

  it('reports the sign-in state of an installed agent, unknown when it could not be read', () => {
    expect(agentStatus({ ...installed, signedIn: true })).toBe('signed-in');
    expect(agentStatus({ ...installed, signedIn: false })).toBe('signed-out');
    expect(agentStatus({ ...installed, signedIn: null })).toBe('unknown');
  });

  it('only marks a signed-in agent as ok', () => {
    expect(agentStatusTone('signed-in')).toBe('ok');
    expect(agentStatusTone('unavailable')).toBe('warn');
    expect(agentStatusTone('unknown')).toBe('off');
    expect(agentStatusTone('signed-out')).toBe('off');
    expect(agentStatusTone('not-installed')).toBe('off');
  });
});
