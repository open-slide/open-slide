import type { AgentEffort, AgentModelOption, AgentProviderId, AgentQuestion } from './types.ts';

export type ProviderEvent =
  | { type: 'session-id'; id: string }
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; text: string }
  | { type: 'text-end'; id: string; text: string | null }
  | { type: 'tool-start'; id: string; name: string; title: string; detail: string | null }
  | { type: 'tool-end'; id: string; ok: boolean }
  | { type: 'error'; text: string }
  | { type: 'result'; durationMs: number | null; costUsd: number | null };

export type PermissionRequest = { tool: string; title: string; detail: string | null };

export type ProviderRunOptions = {
  cwd: string;
  prompt: string;
  systemPromptAppend: string;
  resume: string | null;
  model: string | null;
  effort: AgentEffort | null;
  signal: AbortSignal;
  emit: (event: ProviderEvent) => void;
  askUser: (questions: AgentQuestion[]) => Promise<Record<string, string> | null>;
  requestPermission: (request: PermissionRequest) => Promise<boolean>;
};

export interface AgentProvider {
  id: AgentProviderId;
  name: string;
  sdkPackage: string;
  cliCommand: string;
  models(): Promise<AgentModelOption[]>;
  run(opts: ProviderRunOptions): Promise<void>;
}

export class ProviderUnavailableError extends Error {
  constructor(provider: AgentProvider) {
    super(
      `${provider.name} is not connected: install ${provider.sdkPackage} in this workspace to use it from the agent panel.`,
    );
    this.name = 'ProviderUnavailableError';
  }
}

const DETAIL_MAX = 400;

export function clipDetail(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = typeof value === 'string' ? value : safeJson(value);
  if (!text) return null;
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > DETAIL_MAX ? `${oneLine.slice(0, DETAIL_MAX - 1)}…` : oneLine;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function relativeToCwd(cwd: string, file: unknown): string | null {
  if (typeof file !== 'string' || !file) return null;
  const normalizedCwd = cwd.replace(/[\\/]+$/, '');
  if (file.startsWith(normalizedCwd)) {
    const rest = file.slice(normalizedCwd.length).replace(/^[\\/]+/, '');
    return rest || '.';
  }
  return file;
}
