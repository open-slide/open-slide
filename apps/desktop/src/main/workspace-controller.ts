import { type BrowserWindow, dialog, type MessageBoxOptions } from 'electron';
import type {
  CreateWorkspaceRequest,
  LogTask,
  PackageManager,
  TaskResult,
  WorkspaceError,
  WorkspaceInfo,
} from '../shared/types';
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

// `created` is a workspace this app just scaffolded; `restored` is the one
// reopened on launch. The rest name where the user asked from.
export type OpenSource = 'restored' | 'created' | 'shell' | 'menu';

type Tabs = {
  readonly session: DeckSession;
  reset(session: DeckSession): void;
  confirmLeave(intent: LeaveIntent): Promise<boolean>;
};

type Options = {
  tabs: () => Tabs | null;
  server: { start(root: string): Promise<void>; markInstalling(): void };
  // Brings the main window up, creating it when there is none: a workspace
  // must never start behind no window at all.
  ensureWindow: () => Promise<BrowserWindow>;
  env: () => Promise<NodeJS.ProcessEnv>;
  log: (task: LogTask, chunk: string) => void;
  prepare: (root: string) => Promise<unknown>;
  removeCache: (root: string) => void;
  onChange: () => void;
};

// The one owner of which workspace is open. Every way in (the menu, the
// shell, settings, a restored session, a freshly created folder) goes through
// here, so trust, unsaved work, the server switch and failures are handled the
// same way for all of them.
export class WorkspaceController {
  current: WorkspaceInfo | null = null;
  error: WorkspaceError | null = null;
  private errors = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly opts: Options) {}

  // Resolves ok when the workspace opened and also when the user backed out;
  // only a real failure is an error, and it is kept for the shell to show.
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
      this.fail(err instanceof Error ? err.message : String(err));
    }
    return null;
  }

  // The dialog that asked for the workspace shows how creating it went, so a
  // failure here is returned without also being raised on the shell.
  async create(request: CreateWorkspaceRequest): Promise<TaskResult> {
    const created = await this.scaffold('custom', request.packageManager, async () =>
      createWorkspace(request, await this.opts.env(), (chunk) => this.opts.log('create', chunk)),
    );
    if (!created.ok) return created;
    settings.update({ packageManager: request.packageManager });
    return this.transition(() => this.switchTo(created.root, 'created'));
  }

  async createDefault(): Promise<TaskResult> {
    const created = await this.scaffold('default', undefined, async () =>
      createDefaultWorkspace(await this.opts.env(), (chunk) => this.opts.log('create', chunk)),
    );
    if (!created.ok) return this.report(Promise.resolve(created));
    // A project that was already at the default location is not this app's
    // work: it is opened like any other folder, and asked about first.
    return this.open(created.root, created.created ? 'created' : 'shell');
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
    if (this.current?.root === root) await this.opts.server.start(root);
    return result;
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

  private async scaffold(
    method: 'custom' | 'default',
    packageManager: PackageManager | undefined,
    create: () => Promise<CreateResult>,
  ): Promise<CreateResult> {
    const started = Date.now();
    const result = await create();
    // Finding the default workspace already there created nothing.
    if (!result.ok || result.created) {
      track(result.ok ? 'workspace_created' : 'workspace_create_failed', {
        method,
        package_manager: packageManager,
        duration_ms: Date.now() - started,
      });
    }
    return result;
  }

  // One switch at a time: each waits on the user, and two interleaved would
  // leave the tabs of one workspace on the server of another.
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
      (err: unknown): TaskResult => ({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }),
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
    const window = source === 'restored' ? null : await this.opts.ensureWindow();
    if (!(await this.confirmTrust(inspection.path, inspection.name, source, window))) {
      return { ok: true };
    }
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

  // Opening a workspace runs its config and slides with the user's
  // permissions, and its decks can drive the agents they are signed in to. One
  // this app just scaffolded is trusted; any other folder is asked about once,
  // and is never reopened on launch before that.
  private async confirmTrust(
    root: string,
    name: string,
    source: OpenSource,
    window: BrowserWindow | null,
  ): Promise<boolean> {
    if (settings.trusted(root)) return true;
    if (source === 'restored') return false;
    if (source !== 'created') {
      const options: MessageBoxOptions = {
        type: 'question',
        message: `Do you trust the authors of “${name}”?`,
        detail: `Opening this workspace runs its code on your computer, and its decks can use the agents you are signed in to. Only open folders from people you trust.\n\n${root}`,
        buttons: ['Trust and Open', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
      };
      const { response } = await (window
        ? dialog.showMessageBox(window, options)
        : dialog.showMessageBox(options));
      if (response !== 0) return false;
    }
    settings.trust(root);
    return true;
  }
}
