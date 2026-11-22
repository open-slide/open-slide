import { type BrowserWindow, dialog } from 'electron';
import type {
  CreateWorkspaceRequest,
  LogTask,
  PackageManager,
  TaskResult,
  WorkspaceError,
  WorkspaceInfo,
} from '../shared/types';
import { errorMessage } from './errors';
import { type DeckSession, settings } from './settings';
import { track } from './telemetry';
import type { LeaveIntent } from './unsaved';
import {
  type CreateResult,
  createDefaultWorkspace,
  createWorkspace,
  detectPackageManager,
  inspectWorkspace,
  installDependencies,
} from './workspace';

type OpenSource = 'restored' | 'created' | 'shell' | 'menu';

type Tabs = {
  readonly session: DeckSession;
  reset(session: DeckSession): void;
  confirmLeave(intent: LeaveIntent): Promise<boolean>;
};

type Options = {
  tabs: () => Tabs | null;
  server: { start(root: string): Promise<void>; markInstalling(): void };
  ensureWindow: () => Promise<BrowserWindow>;
  env: () => Promise<NodeJS.ProcessEnv>;
  log: (task: LogTask, chunk: string) => void;
  prepare: (root: string) => Promise<unknown>;
  removeCache: (root: string) => void;
  onChange: () => void;
};

export class WorkspaceController {
  current: WorkspaceInfo | null = null;
  error: WorkspaceError | null = null;
  private errors = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private closing = false;

  constructor(private readonly opts: Options) {}

  open(root: string, source: OpenSource): Promise<TaskResult> {
    return this.report(this.transition(() => this.switchTo(root, source)));
  }

  async choose(): Promise<{ create: string } | null> {
    this.clearError();
    try {
      const window = await this.opts.ensureWindow();
      const result = await dialog.showOpenDialog(window, {
        title: 'Open Workspace',
        buttonLabel: 'Open',
        properties: ['openDirectory', 'createDirectory'],
      });
      const [dir] = result.filePaths;
      if (result.canceled || !dir) return null;
      const picked = inspectWorkspace(dir);
      if (picked.kind === 'empty') return { create: picked.path };
      if (picked.kind === 'project') {
        await this.open(picked.path, 'shell');
        return null;
      }
      this.fail(
        `“${picked.name}” isn’t an open-slide workspace. Pick a folder with one, an empty folder to set up, or create a new workspace.`,
      );
    } catch (err) {
      this.fail(errorMessage(err));
    }
    return null;
  }

  async create(request: CreateWorkspaceRequest): Promise<TaskResult> {
    const created = await this.scaffold('custom', request.packageManager, (env, log) =>
      createWorkspace(request, env, log),
    );
    if (!created.ok) return created;
    settings.update({ packageManager: request.packageManager });
    return this.transition(() => this.switchTo(created.root, 'created'));
  }

  createDefault(): Promise<TaskResult> {
    return this.report(this.openDefault());
  }

  async install(): Promise<TaskResult> {
    if (!this.current) return { ok: false, error: 'No workspace is open.' };
    const root = this.current.root;
    const pm = detectPackageManager(root, settings.packageManager() ?? 'npm');
    this.opts.server.markInstalling();
    const started = Date.now();
    const result = await installDependencies(root, pm, await this.opts.env(), (chunk) =>
      this.opts.log('install', chunk),
    );
    track(result.ok ? 'install_completed' : 'install_failed', {
      package_manager: pm,
      duration_ms: Date.now() - started,
    });
    if (!this.closing && this.current?.root === root) await this.opts.server.start(root);
    return result;
  }

  shutdown() {
    this.closing = true;
  }

  persistSession() {
    const tabs = this.opts.tabs();
    if (this.current && tabs) settings.setSession(this.current.root, tabs.session);
  }

  dismissError(id: unknown) {
    if (this.error?.id !== id) return;
    this.error = null;
    this.opts.onChange();
  }

  private async openDefault(): Promise<TaskResult> {
    const created = await this.scaffold('default', undefined, createDefaultWorkspace);
    if (!created.ok) return created;
    const source = created.created ? 'created' : 'shell';
    return this.transition(() => this.switchTo(created.root, source));
  }

  private async scaffold(
    method: 'custom' | 'default',
    packageManager: PackageManager | undefined,
    create: (env: NodeJS.ProcessEnv, log: (chunk: string) => void) => Promise<CreateResult>,
  ): Promise<CreateResult> {
    const started = Date.now();
    const log = (chunk: string) => this.opts.log('create', chunk);
    const result = await create(await this.opts.env(), log);
    if (!result.ok || result.created) {
      track(result.ok ? 'workspace_created' : 'workspace_create_failed', {
        method,
        package_manager: packageManager,
        duration_ms: Date.now() - started,
      });
    }
    return result;
  }

  private transition<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task);
    this.queue = run.catch(() => {});
    return run;
  }

  private clearError() {
    if (!this.error) return;
    this.error = null;
    this.opts.onChange();
  }

  private async report(attempt: Promise<TaskResult>): Promise<TaskResult> {
    this.clearError();
    const result = await attempt.catch(
      (err: unknown): TaskResult => ({ ok: false, error: errorMessage(err) }),
    );
    if (!result.ok) this.fail(result.error);
    return result;
  }

  private fail(message: string) {
    this.error = { id: ++this.errors, message };
    this.opts.onChange();
  }

  private async switchTo(root: string, source: OpenSource): Promise<TaskResult> {
    const inspection = inspectWorkspace(root);
    if (inspection.kind !== 'project') {
      return { ok: false, error: `${inspection.path} is not an open-slide workspace.` };
    }
    const trusted =
      source === 'restored'
        ? settings.trusted(inspection.path)
        : await this.confirmTrust(inspection.path, inspection.name, source);
    if (!trusted) return { ok: true };
    const tabs = this.opts.tabs();
    if (tabs && !(await tabs.confirmLeave('switch'))) return { ok: true };
    track('workspace_opened', { source });
    this.persistSession();
    this.current = { root: inspection.path, name: inspection.name };
    for (const evicted of settings.setWorkspace(inspection.path)) this.opts.removeCache(evicted);
    settings.setOnboarded(true);
    this.opts.tabs()?.reset(settings.session(inspection.path));
    this.opts.onChange();
    await Promise.all([
      this.opts.prepare(inspection.path),
      this.opts.server.start(inspection.path),
    ]);
    return { ok: true };
  }

  private async confirmTrust(root: string, name: string, source: OpenSource): Promise<boolean> {
    const window = await this.opts.ensureWindow();
    if (settings.trusted(root)) return true;
    if (source !== 'created') {
      const { response } = await dialog.showMessageBox(window, {
        type: 'question',
        message: `Do you trust the authors of “${name}”?`,
        detail: `Opening this workspace runs its code on your computer, and its decks can use the agents you are signed in to. Only open folders from people you trust.\n\n${root}`,
        buttons: ['Trust and Open', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
      });
      if (response !== 0) return false;
    }
    settings.trust(root);
    return true;
  }
}
