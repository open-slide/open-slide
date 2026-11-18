import { type ChildProcess, fork } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import net from 'node:net';
import {
  CACHE_DIR_ENV,
  DEV_SUPERVISED_ENV,
  listeningPort,
  MANAGED_CORE_ENV,
  RESTART_EXIT_CODE,
} from '../../../../packages/core/src/supervision';
import type { PackageManager, ServerStatus } from '../shared/types';
import { stripAnsi } from './process';
import { bundledCore, needsInstall } from './workspace';

const LISTEN_TIMEOUT_MS = 60_000;
const LOG_LIMIT = 200 * 1024;

type ServerFailure = {
  reason: 'core-missing' | 'timeout' | 'exited';
  code?: number | null;
  signal?: string | null;
};

type ServerEvents = {
  status: [ServerStatus];
  log: [string];
  failure: [ServerFailure];
};

function reservePort(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(port, '127.0.0.1', () => {
      const address = probe.address();
      probe.close(() => {
        if (address && typeof address === 'object') resolve(address.port);
        else reject(new Error('Could not reserve a port'));
      });
    });
  });
}

export class DevServer extends EventEmitter<ServerEvents> {
  status: ServerStatus = { state: 'idle' };
  private child: ChildProcess | null = null;
  private exited: Promise<void> | null = null;
  private root: string | null = null;
  // Last requested workspace, which the queue may not have reached yet.
  private wanted: string | null = null;
  private port: number | null = null;
  private logText = '';
  private generation = 0;
  private request = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly env: () => Promise<NodeJS.ProcessEnv>,
    private readonly packageManagerFor: (root: string) => PackageManager,
    private readonly ports: {
      get: (root: string) => number | null;
      set: (root: string, port: number) => void;
    },
    private readonly cacheDirFor: (root: string) => string,
  ) {
    super();
  }

  get log(): string {
    return this.logText;
  }

  start(root: string): Promise<void> {
    this.wanted = root;
    return this.enqueue(async (latest) => {
      if (latest()) await this.launch(root, true);
    });
  }

  // Targets the last request, so a start still queued is not dropped for the previous workspace.
  restart(): Promise<void> {
    if (!this.wanted) return Promise.resolve();
    return this.enqueue(async (latest) => {
      const root = this.wanted;
      if (root && latest()) await this.launch(root, root !== this.root);
    });
  }

  private async launch(root: string, fresh: boolean): Promise<void> {
    await this.halt();
    this.root = root;
    if (fresh) {
      this.port = null;
      this.logText = '';
    }
    await this.spawn();
  }

  markInstalling() {
    this.setStatus({ state: 'installing' });
  }

  stop(): Promise<void> {
    this.wanted = null;
    return this.enqueue(async (latest) => {
      if (latest()) await this.halt();
    });
  }

  // Serialized, and a request overtaken while waiting is skipped, so the last request wins.
  private enqueue(task: (latest: () => boolean) => Promise<void>): Promise<void> {
    const request = ++this.request;
    const run = this.queue.then(() => task(() => request === this.request));
    this.queue = run.catch(() => {});
    return run;
  }

  private async halt(): Promise<void> {
    this.generation++;
    const child = this.child;
    const exited = this.exited;
    this.child = null;
    this.exited = null;
    this.root = null;
    this.setStatus({ state: 'idle' });
    if (!child || !exited || child.exitCode !== null || child.signalCode !== null) return;
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
    child.kill('SIGTERM');
    await exited;
    clearTimeout(timer);
  }

  private append(text: string) {
    const clean = stripAnsi(text);
    this.logText += clean;
    if (this.logText.length > LOG_LIMIT * 2) this.logText = this.logText.slice(-LOG_LIMIT);
    this.emit('log', clean);
  }

  private setStatus(status: ServerStatus) {
    this.status = status;
    this.emit('status', status);
  }

  private async spawn(): Promise<void> {
    const root = this.root;
    if (!root) return;
    const { bin } = bundledCore();
    if (!existsSync(bin)) {
      this.fail('core-missing', 'The bundled @open-slide/core is missing.');
      return;
    }
    if (needsInstall(root)) {
      this.setStatus({ state: 'not-installed', packageManager: this.packageManagerFor(root) });
      return;
    }
    const generation = ++this.generation;
    this.setStatus({ state: 'starting' });
    let env: NodeJS.ProcessEnv;
    try {
      // Kept per workspace: the port is part of the tabs' origin, and so of their localStorage.
      this.port ??= await reservePort(this.ports.get(root) ?? 0).catch(() => reservePort(0));
      env = await this.env();
    } catch (err) {
      if (generation === this.generation) this.fail('exited', (err as Error).message);
      return;
    }
    if (generation !== this.generation) return;

    const child = fork(bin, ['dev', '--port', String(this.port), '--no-skills-check'], {
      cwd: root,
      execPath: process.execPath,
      env: {
        ...env,
        ELECTRON_RUN_AS_NODE: '1',
        [DEV_SUPERVISED_ENV]: '1',
        [MANAGED_CORE_ENV]: '1',
        [CACHE_DIR_ENV]: this.cacheDirFor(root),
        FORCE_COLOR: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    this.child = child;
    child.stdout?.on('data', (d: Buffer) => this.append(d.toString('utf8')));
    child.stderr?.on('data', (d: Buffer) => this.append(d.toString('utf8')));

    let ended = false;
    let timedOut = false;
    const end = (code: number | null, signal: string | null, error?: Error) => {
      if (ended) return;
      ended = true;
      clearTimeout(timeout);
      if (generation !== this.generation) return;
      this.child = null;
      this.exited = null;
      if (timedOut) return;
      if (code === RESTART_EXIT_CODE) {
        this.append('\nRestarting dev server…\n');
        void this.spawn();
        return;
      }
      const reason = error ? error.message : signal ? `signal ${signal}` : `code ${code}`;
      this.fail('exited', `The dev server exited (${reason}).`, code, signal);
    };

    this.exited = new Promise((resolve) => {
      child.once('exit', (code, signal) => {
        end(code, signal);
        resolve();
      });
      child.on('error', (err) => {
        this.append(`${err.message}\n`);
        // A failed spawn never emits exit.
        if (child.pid !== undefined) return;
        end(null, null, err);
        resolve();
      });
    });

    const timeout = setTimeout(() => {
      if (generation !== this.generation || this.status.state !== 'starting') return;
      timedOut = true;
      this.fail('timeout', 'The dev server did not start in time.');
      child.kill('SIGKILL');
    }, LISTEN_TIMEOUT_MS);

    child.on('message', (message) => {
      const port = listeningPort(message);
      if (generation !== this.generation || port === null) return;
      clearTimeout(timeout);
      this.port = port;
      this.ports.set(root, port);
      this.setStatus({ state: 'ready', url: `http://localhost:${port}` });
    });
  }

  private fail(
    reason: ServerFailure['reason'],
    message: string,
    code?: number | null,
    signal?: string | null,
  ) {
    this.setStatus({ state: 'error', message });
    this.emit('failure', { reason, code, signal });
  }
}
