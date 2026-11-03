import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';

const OUTPUT_LIMIT = 64 * 1024;

export type RunOptions = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  onChunk?: (chunk: string) => void;
  timeoutMs?: number;
  stdin?: boolean;
};

export type RunHandle = {
  child: ChildProcess;
  done: Promise<{ code: number | null; output: string }>;
};

const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, 'g');

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '');
}

export function run(cmd: string, args: string[], opts: RunOptions): RunHandle {
  const child = spawn(cmd, args, {
    cwd: opts.cwd,
    env: { ...opts.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    stdio: [opts.stdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    // Package managers are .cmd shims on Windows, which only a shell can run.
    shell: process.platform === 'win32' && !path.isAbsolute(cmd),
    windowsHide: true,
  });
  let output = '';
  const onData = (data: Buffer) => {
    const chunk = stripAnsi(data.toString('utf8'));
    output = (output + chunk).slice(-OUTPUT_LIMIT);
    opts.onChunk?.(chunk);
  };
  child.stdout?.on('data', onData);
  child.stderr?.on('data', onData);
  const done = new Promise<{ code: number | null; output: string }>((resolve) => {
    const timer = opts.timeoutMs
      ? setTimeout(() => child.kill(), opts.timeoutMs).unref()
      : undefined;
    child.on('error', (err) => {
      clearTimeout(timer);
      onData(Buffer.from(`${err.message}\n`));
      resolve({ code: -1, output });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
  return { child, done };
}

// Runs a Node script on Electron's own runtime, so the app needs no separate
// Node install for its own tooling.
export function runNodeScript(script: string, args: string[], opts: RunOptions): RunHandle {
  return run(process.execPath, [script, ...args], {
    ...opts,
    env: { ...opts.env, ELECTRON_RUN_AS_NODE: '1' },
  });
}
