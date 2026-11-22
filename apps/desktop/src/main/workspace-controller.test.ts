import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  home: '',
  appPath: '',
  trusted: new Set<string>(),
  onboarded: false,
  events: [] as string[],
  tracked: [] as string[],
  trustAnswer: 0,
  picked: null as string | null,
  scaffolds: true,
}));

vi.mock('node:os', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:os')>()),
  homedir: () => fixture.home,
}));
vi.mock('electron', () => ({
  app: { getAppPath: () => fixture.appPath, getPath: () => fixture.home },
  dialog: {
    showMessageBox: vi.fn(async (...args: unknown[]) => {
      const options = args.at(-1) as { message: string };
      fixture.events.push(`prompt: ${options.message}`);
      return { response: fixture.trustAnswer };
    }),
    showOpenDialog: vi.fn(async () => ({
      canceled: fixture.picked === null,
      filePaths: fixture.picked === null ? [] : [fixture.picked],
    })),
  },
}));
vi.mock('./settings', () => ({
  settings: {
    trusted: (root: string) => fixture.trusted.has(root),
    trust: (root: string) => fixture.trusted.add(root),
    setWorkspace: () => [],
    setOnboarded: () => {
      fixture.onboarded = true;
    },
    session: () => ({ decks: [], active: null }),
    setSession: () => {},
    packageManager: () => null,
    update: () => {},
  },
}));
vi.mock('./telemetry', () => ({ track: (event: string) => fixture.tracked.push(event) }));
vi.mock('./shell-env', () => ({ findOnPath: () => null }));
vi.mock('./process', async () => {
  const fs = await import('node:fs');
  const nodePath = await import('node:path');
  return {
    run: () => ({ done: Promise.resolve({ code: 0, output: '', timedOut: false }) }),
    runNodeScript: (_script: string, args: string[], opts: { cwd: string }) => {
      fixture.events.push(`run: ${args.join(' ')}`);
      if (fixture.scaffolds && args[0] === 'init') {
        const target = nodePath.join(opts.cwd, args[1]);
        fs.mkdirSync(target, { recursive: true });
        fs.writeFileSync(
          nodePath.join(target, 'package.json'),
          JSON.stringify({ name: 'scaffolded', dependencies: { '@open-slide/core': '*' } }),
        );
      }
      return {
        done: Promise.resolve({ code: fixture.scaffolds ? 0 : 1, output: '', timedOut: false }),
      };
    },
  };
});

const { dialog } = await import('electron');
const { WorkspaceController } = await import('./workspace-controller');

function project(dir: string, name = 'existing-project') {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name, dependencies: { '@open-slide/core': '*' } }),
  );
  return dir;
}

function setup(opts: { leave?: boolean } = {}) {
  const resets: unknown[] = [];
  const tabs = {
    session: { decks: [], active: null },
    reset: (session: unknown) => {
      resets.push(session);
    },
    confirmLeave: vi.fn(async () => {
      fixture.events.push('confirm-leave');
      return opts.leave ?? true;
    }),
  };
  const onChange = vi.fn();
  const controller = new WorkspaceController({
    tabs: () => tabs,
    server: {
      start: async (root) => {
        fixture.events.push(`start: ${root}`);
      },
      markInstalling: () => {},
    },
    ensureWindow: async () => {
      fixture.events.push('ensure-window');
      return {} as never;
    },
    env: async () => ({}),
    log: () => {},
    prepare: async () => {},
    removeCache: () => {},
    onChange,
  });
  return { controller, tabs, resets, onChange };
}

const defaultRoot = () => path.join(fixture.home, '.open-slide', 'slides');
const started = () => fixture.events.filter((e) => e.startsWith('start: '));
const prompts = () => fixture.events.filter((e) => e.startsWith('prompt: '));

beforeEach(() => {
  const base = realpathSync(mkdtempSync(path.join(tmpdir(), 'open-slide-workspace-')));
  fixture.home = path.join(base, 'home');
  fixture.appPath = path.join(base, 'app');
  mkdirSync(fixture.home, { recursive: true });
  mkdirSync(path.join(fixture.appPath, 'node_modules', '@open-slide', 'cli'), { recursive: true });
  fixture.trusted = new Set();
  fixture.onboarded = false;
  fixture.events = [];
  fixture.tracked = [];
  fixture.trustAnswer = 0;
  fixture.picked = null;
  fixture.scaffolds = true;
  vi.mocked(dialog.showMessageBox).mockClear();
});

afterEach(() => {
  rmSync(path.dirname(fixture.home), { recursive: true, force: true });
});

describe('default workspace trust', () => {
  it('asks before opening a project that was already at the default location', async () => {
    const root = project(defaultRoot());
    fixture.trustAnswer = 1;
    const { controller } = setup();

    expect(await controller.createDefault()).toEqual({ ok: true });

    expect(prompts()).toEqual(['prompt: Do you trust the authors of “existing-project”?']);
    expect(fixture.trusted.has(root)).toBe(false);
    expect(started()).toEqual([]);
    expect(controller.current).toBe(null);
    expect(controller.error).toBe(null);
    expect(fixture.tracked).not.toContain('workspace_created');
  });

  it('opens that project once the user trusts it', async () => {
    const root = project(defaultRoot());
    const { controller } = setup();

    expect(await controller.createDefault()).toEqual({ ok: true });

    expect(prompts()).toHaveLength(1);
    expect(fixture.trusted.has(root)).toBe(true);
    expect(started()).toEqual([`start: ${root}`]);
    expect(controller.current).toEqual({ root, name: 'existing-project' });
  });

  it('opens an already trusted project without asking again', async () => {
    const root = project(defaultRoot());
    fixture.trusted.add(root);
    const { controller } = setup();

    expect(await controller.createDefault()).toEqual({ ok: true });

    expect(prompts()).toEqual([]);
    expect(started()).toEqual([`start: ${root}`]);
  });

  it('trusts a workspace it scaffolded itself without asking', async () => {
    const { controller } = setup();

    expect(await controller.createDefault()).toEqual({ ok: true });

    const root = defaultRoot();
    expect(fixture.events).toContain('run: init slides --no-install --no-git');
    expect(prompts()).toEqual([]);
    expect(fixture.trusted.has(root)).toBe(true);
    expect(started()).toEqual([`start: ${root}`]);
    expect(fixture.tracked).toContain('workspace_created');
  });

  it('reports a failed scaffold as an error', async () => {
    fixture.scaffolds = false;
    const { controller } = setup();

    const result = await controller.createDefault();

    expect(result.ok).toBe(false);
    expect(controller.error?.message).toBe('open-slide init exited with code 1');
    expect(started()).toEqual([]);
  });

  it('raises a scaffold that throws instead of failing silently', async () => {
    writeFileSync(path.join(fixture.home, '.open-slide'), '');
    const { controller } = setup();

    const result = await controller.createDefault();

    expect(result.ok).toBe(false);
    expect(controller.error?.message).toMatch(/EEXIST|ENOTDIR/);
    expect(started()).toEqual([]);
  });

  it('asks about a workspace created through the dialog only if it was not created', async () => {
    const { controller } = setup();
    const parent = path.join(fixture.home, 'Documents');
    mkdirSync(parent);

    const created = await controller.create({ parent, name: 'deck', packageManager: 'npm' });
    expect(created).toEqual({ ok: true });
    expect(prompts()).toEqual([]);

    const again = await controller.create({ parent, name: 'deck', packageManager: 'npm' });
    expect(again.ok).toBe(false);
  });
});

describe('opening a workspace', () => {
  it('brings up the main window before it asks or starts anything', async () => {
    const root = project(path.join(fixture.home, 'deck'));
    const { controller } = setup();

    await controller.open(root, 'menu');

    expect(fixture.events).toEqual([
      'ensure-window',
      'prompt: Do you trust the authors of “existing-project”?',
      'confirm-leave',
      `start: ${root}`,
    ]);
  });

  it('never opens an untrusted workspace on launch, and asks nothing', async () => {
    const root = project(path.join(fixture.home, 'deck'));
    const { controller } = setup();

    expect(await controller.open(root, 'restored')).toEqual({ ok: true });

    expect(fixture.events).toEqual([]);
    expect(controller.current).toBe(null);
  });

  it('keeps the current workspace when the user stays to finish unsaved work', async () => {
    const first = project(path.join(fixture.home, 'first'), 'first');
    const second = project(path.join(fixture.home, 'second'), 'second');
    fixture.trusted.add(first).add(second);
    const staying = setup({ leave: false });
    staying.controller.current = { root: first, name: 'first' };

    expect(await staying.controller.open(second, 'shell')).toEqual({ ok: true });

    expect(staying.controller.current).toEqual({ root: first, name: 'first' });
    expect(staying.resets).toEqual([]);
    expect(started()).toEqual([]);
    expect(staying.controller.error).toBe(null);
  });

  it('records a failure for the shell to show, whatever asked for it', async () => {
    const missing = path.join(fixture.home, 'gone');
    const { controller, onChange } = setup();

    const result = await controller.open(missing, 'menu');

    expect(result).toEqual({ ok: false, error: `${missing} is not an open-slide workspace.` });
    expect(controller.error).toMatchObject({ message: result.ok ? '' : result.error });
    expect(onChange).toHaveBeenCalled();

    controller.dismissError(controller.error?.id);
    expect(controller.error).toBe(null);
  });

  it('clears the last failure when the next attempt starts', async () => {
    const root = project(path.join(fixture.home, 'deck'));
    fixture.trusted.add(root);
    const { controller } = setup();
    await controller.open(path.join(fixture.home, 'gone'), 'shell');
    expect(controller.error).not.toBe(null);

    await controller.open(root, 'shell');

    expect(controller.error).toBe(null);
  });

  it('runs switches one at a time, in the order they were asked for', async () => {
    const first = project(path.join(fixture.home, 'first'), 'first');
    const second = project(path.join(fixture.home, 'second'), 'second');
    fixture.trusted.add(first).add(second);
    const { controller } = setup();

    await Promise.all([controller.open(first, 'shell'), controller.open(second, 'shell')]);

    expect(started()).toEqual([`start: ${first}`, `start: ${second}`]);
    expect(controller.current?.root).toBe(second);
  });
});

describe('choosing a folder', () => {
  it('treats a cancelled picker as nothing happening', async () => {
    const { controller } = setup();

    expect(await controller.choose()).toBe(null);
    expect(controller.error).toBe(null);
    expect(fixture.events).toEqual(['ensure-window']);
  });

  it('reports a folder that is not a workspace', async () => {
    fixture.picked = path.join(fixture.home, 'photos');
    mkdirSync(fixture.picked);
    writeFileSync(path.join(fixture.picked, 'cat.jpg'), '');
    const { controller } = setup();

    expect(await controller.choose()).toBe(null);
    expect(controller.error?.message).toContain('“photos” isn’t an open-slide workspace');
    expect(started()).toEqual([]);
  });

  it('hands an empty folder back to be set up', async () => {
    fixture.picked = path.join(fixture.home, 'empty');
    mkdirSync(fixture.picked);
    const { controller } = setup();

    expect(await controller.choose()).toEqual({ create: fixture.picked });
    expect(controller.error).toBe(null);
  });

  it('opens a picked workspace', async () => {
    fixture.picked = project(path.join(fixture.home, 'deck'));
    const { controller } = setup();

    expect(await controller.choose()).toBe(null);
    expect(started()).toEqual([`start: ${fixture.picked}`]);
  });
});
