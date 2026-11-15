import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';

const OUTPUT_LIMIT = 64 * 1024;
const KILL_GRACE_MS = 2000;
// How long output pipes may stay open once the process itself is gone. A
// descendant that inherited them would otherwise keep a run from ever ending.
const DRAIN_MS = 1000;

export type RunOptions = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  onChunk?: (chunk: string) => void;
  timeoutMs?: number;
  stdin?: boolean;
  // How long the process tree gets to exit on its own once asked to stop.
  killGraceMs?: number;
};

export type RunResult = { code: number | null; output: string; timedOut: boolean };

export type RunHandle = {
  child: ChildProcess;
  // Always settles: at the latest a grace period and a drain after the
  // process is asked to stop or exits.
  done: Promise<RunResult>;
  terminate: () => Promise<void>;
};

const running = new Set<RunHandle>();

export function terminateRunning(): Promise<void> {
  return Promise.all([...running].map((handle) => handle.terminate())).then(() => {});
}

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, 'g');

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

const isWindows = process.platform === 'win32';

// Signals the child and everything it started. Only called between spawn and
// settlement: while the child or one of its descendants is alive its pid still
// names their process group, so the signal cannot land on an unrelated process.
function signalTree(child: ChildProcess, signal: NodeJS.Signals) {
  const pid = child.pid;
  if (pid === undefined) return;
  if (isWindows) {
    // Console processes get no graceful signal on Windows, and child.kill()
    // would leave whatever a .cmd shim started behind.
    const taskkill = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe');
    spawn(taskkill, ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }).on(
      'error',
      () => child.kill(),
    );
    return;
  }
  try {
    process.kill(-pid, signal);
  } catch {
    child.kill(signal);
  }
}

export function run(cmd: string, args: string[], opts: RunOptions): RunHandle {
  const child = spawn(cmd, args, {
    cwd: opts.cwd,
    env: { ...opts.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    stdio: [opts.stdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    // Package managers are .cmd shims on Windows, which only a shell can run.
    shell: isWindows && !path.isAbsolute(cmd),
    windowsHide: true,
    // Its own process group, so stopping it reaches the processes it started.
    detached: !isWindows,
  });
  let output = '';
  let timedOut = false;
  let stopping = false;
  let settled = false;
  let settle: (code: number | null) => void = () => {};
  const timers = new Set<NodeJS.Timeout>();
  const later = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
  };
  const onData = (data: Buffer) => {
    if (settled) return;
    const chunk = stripAnsi(data.toString('utf8'));
    output = (output + chunk).slice(-OUTPUT_LIMIT);
    opts.onChunk?.(chunk);
  };
  child.stdout?.on('data', onData);
  child.stderr?.on('data', onData);

  const done = new Promise<RunResult>((resolve) => {
    settle = (code) => {
      if (settled) return;
      settled = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      running.delete(handle);
      child.stdout?.destroy();
      child.stderr?.destroy();
      resolve({ code, output, timedOut });
    };
  });

  const terminate = () => {
    if (!settled && !stopping) {
      stopping = true;
      signalTree(child, 'SIGTERM');
      later(() => {
        signalTree(child, 'SIGKILL');
        later(() => settle(child.exitCode), DRAIN_MS);
      }, opts.killGraceMs ?? KILL_GRACE_MS);
    }
    return done.then(() => {});
  };

  const handle: RunHandle = { child, done, terminate };
  running.add(handle);

  child.on('error', (err) => {
    onData(Buffer.from(`${err.message}\n`));
    // Only a failed spawn ends the child; it never emits exit.
    if (child.pid === undefined) settle(-1);
  });
  child.on('exit', (code) => {
    // A stop in progress still has descendants to reach, and settles itself.
    later(() => {
      if (!stopping) settle(code);
    }, DRAIN_MS);
  });
  child.on('close', (code) => {
    // Closed pipes do not mean every descendant accepted SIGTERM.
    if (!stopping) settle(code);
  });
  if (opts.timeoutMs) {
    later(() => {
      timedOut = true;
      void terminate();
    }, opts.timeoutMs);
  }
  return handle;
}

// Runs a Node script on Electron's own runtime, so the app needs no separate
// Node install for its own tooling.
export function runNodeScript(script: string, args: string[], opts: RunOptions): RunHandle {
  return run(process.execPath, [script, ...args], {
    ...opts,
    env: { ...opts.env, ELECTRON_RUN_AS_NODE: '1' },
  });
}
