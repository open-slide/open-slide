import { statSync } from 'node:fs';
import path from 'node:path';
import type { PackageManager } from './package-manager.ts';

export type AgentId = 'claude' | 'codex';

export interface AgentInfo {
  id: AgentId;
  name: string;
  sdkPackage: string;
  cliCommand: string;
  cliInstall: string;
}

export const AGENTS: Record<AgentId, AgentInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    sdkPackage: '@anthropic-ai/claude-agent-sdk',
    cliCommand: 'claude',
    cliInstall: 'npm install -g @anthropic-ai/claude-code',
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    sdkPackage: '@openai/codex-sdk',
    cliCommand: 'codex',
    cliInstall: 'npm install -g @openai/codex',
  },
};

export const AGENT_IDS = Object.keys(AGENTS) as AgentId[];

export function parseAgentFlag(value: string | boolean | undefined): AgentId[] | undefined {
  if (value === undefined || value === true) return undefined;
  if (value === false) return [];
  const names = value
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  if (names.length === 1 && names[0] === 'none') return [];
  const picked: AgentId[] = [];
  for (const name of names) {
    if (name === 'all') {
      for (const id of AGENT_IDS) if (!picked.includes(id)) picked.push(id);
      continue;
    }
    if (!AGENT_IDS.includes(name as AgentId)) {
      throw new Error(
        `Unknown agent "${name}" for --agent. Use ${AGENT_IDS.join(', ')}, all, or none.`,
      );
    }
    if (!picked.includes(name as AgentId)) picked.push(name as AgentId);
  }
  return picked;
}

export function findOnPath(command: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const isWindows = process.platform === 'win32';
  const dirs = (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean);
  const exts = isWindows ? (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.join(dir, command + ext.toLowerCase());
      try {
        if (statSync(candidate, { throwIfNoEntry: false })?.isFile()) return candidate;
      } catch {}
    }
  }
  return null;
}

export function addDevDependencyArgs(pm: PackageManager, packages: string[]): string[] {
  switch (pm) {
    case 'npm':
      return ['install', '-D', ...packages];
    case 'bun':
      return ['add', '-d', ...packages];
    case 'pnpm':
    case 'yarn':
      return ['add', '-D', ...packages];
  }
}
