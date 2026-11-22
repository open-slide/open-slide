import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { run, terminateRunning } from './process';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// An exited descendant whose parent was killed can linger as a zombie until init reaps it.
function zombie(pid: number): boolean {
  if (process.platform !== 'linux') return false;
  try {
    return readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ').at(-1)?.startsWith('Z') ?? false;
  } catch {
    return false;
  }
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
  } catch {
    return false;
  }
  return !zombie(pid);
}

async function gone(pid: number): Promise<boolean> {
  for (let i = 0; i < 100 && alive(pid); i++) await pause(20);
  return !alive(pid);
}

function node(script: string, opts: Partial<Parameters<typeof run>[2]> = {}) {
  return run(process.execPath, ['-e', script], {
    cwd: tmpdir(),
    env: process.env,
    killGraceMs: 200,
    ...opts,
  });
}

const PARENT_OF = (grandchild: string, after = 'setInterval(() => {}, 1000)') =>
  `const { spawn } = require('node:child_process');
   const c = spawn(process.execPath, ['-e', ${JSON.stringify(grandchild)}], { stdio: ['ignore', 'inherit', 'inherit'] });
   console.log('descendant:' + c.pid);
   ${after}`;

const PARENT_OF_STUBBORN = `
  const { spawn } = require('node:child_process');
  const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); process.send('ready'); setInterval(() => {}, 1000)"], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  child.once('message', () => console.log('descendant:' + child.pid));
  setInterval(() => {}, 1000);
`;

async function withDescendant(script: string) {
  let output = '';
  const handle = node(script, {
    onChunk: (chunk) => {
      output += chunk;
    },
  });
  for (let i = 0; i < 200; i++) {
    const match = /descendant:(\d+)/.exec(output);
    if (match) return { handle, descendant: Number(match[1]) };
    if (handle.child.exitCode !== null && i > 50) break;
    await pause(10);
  }
  await handle.terminate();
  throw new Error('the child never reported its descendant');
}

describe.skipIf(process.platform === 'win32')('run', () => {
  it('reports the exit code and output of a process that ends on its own', async () => {
    const result = await node("console.log('hello'); process.exit(3)").done;
    expect(result).toMatchObject({ code: 3, timedOut: false });
    expect(result.output).toContain('hello');
  });

  it('settles a timed-out process that ignores SIGTERM, and kills it', async () => {
    const started = Date.now();
    const handle = node(
      "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000)",
      { timeoutMs: 300 },
    );
    const pid = handle.child.pid as number;
    const result = await handle.done;

    expect(result.timedOut).toBe(true);
    expect(result.code).toBe(null);
    expect(Date.now() - started).toBeLessThan(4000);
    expect(await gone(pid)).toBe(true);
  });

  it('does not report a cancellation that outlasts the deadline as a timeout', async () => {
    let output = '';
    const handle = node(
      "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000)",
      {
        timeoutMs: 300,
        killGraceMs: 600,
        onChunk: (chunk) => {
          output += chunk;
        },
      },
    );
    while (!output.includes('ready')) await pause(10);
    void handle.terminate();

    const result = await handle.done;

    expect(result.timedOut).toBe(false);
  });

  it('terminates the processes a child started, not only the child', async () => {
    const { handle, descendant } = await withDescendant(PARENT_OF('setInterval(() => {}, 1000)'));
    expect(alive(descendant)).toBe(true);

    await handle.terminate();

    expect(await gone(descendant)).toBe(true);
    expect(await gone(handle.child.pid as number)).toBe(true);
  });

  it('kills a descendant that ignores SIGTERM once the grace period ends', async () => {
    const { descendant } = await withDescendant(PARENT_OF_STUBBORN);

    await terminateRunning();

    expect(await gone(descendant)).toBe(true);
  });

  it('settles after a clean exit even while a descendant holds the output open', async () => {
    const started = Date.now();
    const { handle, descendant } = await withDescendant(
      PARENT_OF('setInterval(() => {}, 1000)', 'setTimeout(() => process.exit(0), 100)'),
    );
    try {
      const result = await handle.done;
      expect(result).toMatchObject({ code: 0, timedOut: false });
      expect(Date.now() - started).toBeLessThan(4000);
      expect(alive(descendant)).toBe(true);
    } finally {
      process.kill(descendant, 'SIGKILL');
    }
  });

  it('finishes termination of descendants even after the parent closes its pipes', async () => {
    const { handle, descendant } = await withDescendant(PARENT_OF_STUBBORN);
    try {
      await handle.terminate();
      expect(await gone(descendant)).toBe(true);
    } finally {
      if (alive(descendant)) process.kill(descendant, 'SIGKILL');
    }
  });

  it('resolves terminate for a process that already ended', async () => {
    const handle = node('process.exit(0)');
    await handle.done;
    await expect(handle.terminate()).resolves.toBeUndefined();
  });

  it('reports a command that cannot be started', async () => {
    const result = await run('/nonexistent/open-slide-test-binary', [], {
      cwd: tmpdir(),
      env: process.env,
    }).done;
    expect(result.code).toBe(-1);
  });
});
