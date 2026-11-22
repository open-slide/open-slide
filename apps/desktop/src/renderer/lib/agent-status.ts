import type { AgentInfo } from '../../shared/types';

export type AgentStatus = 'unavailable' | 'not-installed' | 'signed-in' | 'signed-out' | 'unknown';

export function agentStatus(
  agent: Pick<AgentInfo, 'cliPath' | 'cliInstallable' | 'signedIn'>,
): AgentStatus {
  if (agent.cliPath === null) return agent.cliInstallable ? 'not-installed' : 'unavailable';
  if (agent.signedIn === null) return 'unknown';
  return agent.signedIn ? 'signed-in' : 'signed-out';
}

export function agentStatusTone(status: AgentStatus): 'ok' | 'warn' | 'off' {
  if (status === 'signed-in') return 'ok';
  if (status === 'unavailable') return 'warn';
  return 'off';
}
