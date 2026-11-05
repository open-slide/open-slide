import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDevDependencyArgs, findOnPath, parseAgentFlag } from './agents.ts';

describe('parseAgentFlag', () => {
  it('leaves the choice open when the flag is absent', () => {
    expect(parseAgentFlag(undefined)).toBeUndefined();
  });

  it('skips agents for --no-agent and --agent none', () => {
    expect(parseAgentFlag(false)).toEqual([]);
    expect(parseAgentFlag('none')).toEqual([]);
  });

  it('parses a comma-separated list', () => {
    expect(parseAgentFlag('claude')).toEqual(['claude']);
    expect(parseAgentFlag(' Codex , claude ')).toEqual(['codex', 'claude']);
    expect(parseAgentFlag('claude,claude')).toEqual(['claude']);
    expect(parseAgentFlag('all')).toEqual(['claude', 'codex']);
  });

  it('rejects unknown agents', () => {
    expect(() => parseAgentFlag('gemini')).toThrow(/Unknown agent "gemini"/);
  });
});

describe('findOnPath', () => {
  it('finds an executable in PATH directories', () => {
    const bin = path.join(mkdtempSync(path.join(tmpdir(), 'open-slide-cli-')), 'bin');
    mkdirSync(bin);
    const file = path.join(bin, process.platform === 'win32' ? 'fake-agent.exe' : 'fake-agent');
    writeFileSync(file, '');
    chmodSync(file, 0o755);
    expect(findOnPath('fake-agent', { PATH: bin, PATHEXT: '.EXE' })).toBe(file);
    expect(findOnPath('other-agent', { PATH: bin })).toBeNull();
  });

  it.skipIf(process.platform === 'win32')('ignores files without execute permission', () => {
    const bin = mkdtempSync(path.join(tmpdir(), 'open-slide-cli-'));
    writeFileSync(path.join(bin, 'plain-agent'), '');
    chmodSync(path.join(bin, 'plain-agent'), 0o644);
    expect(findOnPath('plain-agent', { PATH: bin })).toBeNull();
  });
});

describe('addDevDependencyArgs', () => {
  it('uses each package manager’s add command', () => {
    expect(addDevDependencyArgs('npm', ['a', 'b'])).toEqual(['install', '-D', 'a', 'b']);
    expect(addDevDependencyArgs('pnpm', ['a'])).toEqual(['add', '-D', 'a']);
    expect(addDevDependencyArgs('yarn', ['a'])).toEqual(['add', '-D', 'a']);
    expect(addDevDependencyArgs('bun', ['a'])).toEqual(['add', '-d', 'a']);
  });
});
