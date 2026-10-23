import path from 'node:path';
import type { AgentEffort, AgentModelOption, AgentProviderId, AgentQuestion } from './types.ts';

export type ProviderEvent =
  | { type: 'session-id'; id: string }
  // A point in the provider's own history that a later edit can rewind to.
  | { type: 'checkpoint'; id: string }
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; text: string }
  | { type: 'text-end'; id: string; text: string | null }
  | { type: 'tool-start'; id: string; name: string; title: string; detail: string | null }
  | { type: 'tool-end'; id: string; ok: boolean }
  | { type: 'error'; text: string }
  | { type: 'result'; durationMs: number | null; costUsd: number | null }
  // Questions the agent wrote into its reply instead of asking through a
  // tool: the turn ends, and the answers arrive as the next prompt.
  | { type: 'questions'; questions: AgentQuestion[] };

export type PermissionRequest = { tool: string; title: string; detail: string | null };

export type ProviderRunOptions = {
  cwd: string;
  // Directories the agent may write to without asking: the deck and asset
  // folders. Edits anywhere else (configs, package.json) need approval.
  writableRoots: string[];
  prompt: string;
  systemPromptAppend: string;
  resume: string | null;
  resumeAt: string | null;
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
  askInstruction: string;
  canRewind: boolean;
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

export function isInsideRoots(cwd: string, file: unknown, roots: string[]): boolean {
  if (typeof file !== 'string' || !file) return false;
  const resolved = path.resolve(cwd, file);
  return roots.some((root) => {
    const rel = path.relative(root, resolved);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  });
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

export function parseQuestions(input: Record<string, unknown>): AgentQuestion[] {
  const raw = Array.isArray(input.questions) ? input.questions : [];
  const questions: AgentQuestion[] = [];
  for (const q of raw) {
    if (!q || typeof q !== 'object') continue;
    const r = q as Record<string, unknown>;
    const options = Array.isArray(r.options)
      ? r.options
          .map((o) => {
            if (!o || typeof o !== 'object') return null;
            const opt = o as Record<string, unknown>;
            if (typeof opt.label !== 'string') return null;
            return {
              label: opt.label,
              description: typeof opt.description === 'string' ? opt.description : undefined,
            };
          })
          .filter((o): o is { label: string; description: string | undefined } => o !== null)
      : [];
    if (typeof r.question !== 'string') continue;
    questions.push({
      header: typeof r.header === 'string' ? r.header : '',
      question: r.question,
      options,
      multiSelect: r.multiSelect === true,
    });
  }
  return questions;
}
