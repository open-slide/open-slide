import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getAppPath: () => '/tmp' },
}));

import {
  findNestedWorkspace,
  inspectWorkspace,
  suggestSubfolderName,
  workspaceDisplayName,
} from './workspace';

let tmp = '';

function makeProject(dir: string, name?: string) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      ...(name ? { name } : {}),
      dependencies: { '@open-slide/core': '^2.0.0' },
    }),
  );
  return dir;
}

beforeEach(() => {
  tmp = mkdtempSync(path.join(os.tmpdir(), 'open-slide-ws-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('workspaceDisplayName', () => {
  it('qualifies generic workspace names with their parent folder', () => {
    expect(workspaceDisplayName('/projects/guest-lecture/slides', 'slides')).toBe(
      'guest-lecture / slides',
    );
    expect(workspaceDisplayName('/projects/keynote/deck', 'deck')).toBe('keynote / deck');
  });

  it('keeps the default ~/.open-slide/slides name unqualified', () => {
    expect(workspaceDisplayName('/home/user/.open-slide/slides', 'slides')).toBe('slides');
  });

  it('leaves specific package names unchanged', () => {
    expect(workspaceDisplayName('/projects/guest-lecture/slides', 'guest-lecture-talk')).toBe(
      'guest-lecture-talk',
    );
  });
});

describe('findNestedWorkspace', () => {
  it('prefers a nested slides or deck folder', () => {
    const parent = path.join(tmp, 'paper');
    const nested = makeProject(path.join(parent, 'slides'), 'slides');
    makeProject(path.join(parent, 'other'), 'other');

    expect(findNestedWorkspace(parent)).toBe(nested);
    expect(inspectWorkspace(nested).name).toBe('paper / slides');
  });

  it('finds a single arbitrarily named nested workspace', () => {
    const parent = path.join(tmp, 'course');
    const nested = makeProject(path.join(parent, 'week-1'), 'week-1');

    expect(findNestedWorkspace(parent)).toBe(nested);
  });

  it('returns null when multiple non-preferred workspaces exist', () => {
    const parent = path.join(tmp, 'course');
    makeProject(path.join(parent, 'week-1'), 'week-1');
    makeProject(path.join(parent, 'week-2'), 'week-2');

    expect(findNestedWorkspace(parent)).toBe(null);
  });
});

describe('suggestSubfolderName', () => {
  it('picks slides by default and skips existing non-empty folders', () => {
    const parent = path.join(tmp, 'talk');
    mkdirSync(parent, { recursive: true });
    expect(suggestSubfolderName(parent)).toBe('slides');

    mkdirSync(path.join(parent, 'slides'));
    writeFileSync(path.join(parent, 'slides', 'notes.md'), 'hi');
    expect(suggestSubfolderName(parent)).toBe('deck');
  });
});
