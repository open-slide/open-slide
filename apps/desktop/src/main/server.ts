import { type ChildProcess, fork } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import net from 'node:net';
import type { PackageManager, ServerStatus } from '../shared/types';
import { stripAnsi } from './process';
import { coreBin } from './workspace';

// Mirrors core's dev supervisor protocol (packages/core/src/cli/dev.ts and
// vite/routes/restart.ts): a supervised server reports its port over IPC and
// exits with RESTART_EXIT_CODE when an in-app update wants a fresh process.
const DEV_SUPERVISED_ENV = 'OPEN_SLIDE_DEV_SUPERVISED';
const RESTART_EXIT_CODE = 52;
const LISTEN_TIMEOUT_MS = 60_000;
const LOG_LIMIT = 200 * 1024;

type ServerEvents = {
  status: [ServerStatus];
  log: [string];
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
  private root: string | null = null;
  private port: number | null = null;
  private logText = '';
  private generation = 0;

  constructor(
    private readonly env: () => Promise<NodeJS.ProcessEnv>,
    private readonly packageManagerFor: (root: string) => PackageManager,
    private readonly ports: {
      get: (root: string) => number | null;
      set: (root: string, port: number) => void;
    },
  ) {
    super();
  }

  get log(): string {
    return this.logText;
  }

  async start(root: string): Promise<void> {
    await this.stop();
    this.root = root;
    this.port = null;
    this.logText = '';
    await this.spawn();
  }

  async restart(): Promise<void> {
    if (!this.root) return;
    const root = this.root;
    await this.stop();
    this.root = root;
    await this.spawn();
  }

  markInstalling() {
    this.setStatus({ state: 'installing' });
  }

  stop(): Promise<void> {
    this.generation++;
    const child = this.child;
    this.child = null;
    this.root = null;
    this.setStatus({ state: 'idle' });
    if (!child || child.exitCode !== null) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      child.kill('SIGTERM');
    });
  }

  private append(text: string) {
    const clean = stripAnsi(text);
    this.logText = (this.logText + clean).slice(-LOG_LIMIT);
    this.emit('log', clean);
  }

  private setStatus(status: ServerStatus) {
    this.status = status;
    this.emit('status', status);
  }

  private async spawn(): Promise<void> {
    const root = this.root;
    if (!root) return;
    const bin = coreBin(root);
    if (!existsSync(bin)) {
      this.setStatus({ state: 'not-installed', packageManager: this.packageManagerFor(root) });
      return;
    }
    const generation = ++this.generation;
    this.setStatus({ state: 'starting' });
    // Each workspace keeps its port across launches: the port is part of the
    // tabs' origin, and with it their localStorage (theme, agent panel state).
    if (this.port === null) {
      const preferred = this.ports.get(root);
      this.port = await (preferred ? reservePort(preferred) : Promise.reject()).catch(() =>
        reservePort(0),
      );
    }
    const env = await this.env();
    if (generation !== this.generation) return;

    const child = fork(bin, ['dev', '--port', String(this.port), '--no-skills-check'], {
      cwd: root,
      execPath: process.execPath,
      env: {
        ...env,
        ELECTRON_RUN_AS_NODE: '1',
        [DEV_SUPERVISED_ENV]: '1',
        OPEN_SLIDE_SKIP_SKILLS_CHECK: '1',
        FORCE_COLOR: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    this.child = child;
    child.stdout?.on('data', (d: Buffer) => this.append(d.toString('utf8')));
    child.stderr?.on('data', (d: Buffer) => this.append(d.toString('utf8')));

    const timeout = setTimeout(() => {
      if (generation === this.generation && this.status.state === 'starting') {
        this.setStatus({ state: 'error', message: 'The dev server did not start in time.' });
      }
    }, LISTEN_TIMEOUT_MS);

    child.on('message', (message) => {
      if (generation !== this.generation || typeof message !== 'object' || message === null) return;
      const { type, port } = message as { type?: unknown; port?: unknown };
      if (type !== 'open-slide:listening' || typeof port !== 'number') return;
      clearTimeout(timeout);
      this.port = port;
      this.ports.set(root, port);
      this.setStatus({ state: 'ready', url: `http://localhost:${port}` });
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timeout);
      if (generation !== this.generation) return;
      this.child = null;
      if (code === RESTART_EXIT_CODE) {
        this.append('\nRestarting dev server…\n');
        void this.spawn();
        return;
      }
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      this.setStatus({ state: 'error', message: `The dev server exited (${reason}).` });
    });
  }
}
