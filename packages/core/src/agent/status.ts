import { spawn } from 'node:child_process';
import { commandVersion, findOnPath, resolveWorkspacePackage } from './detect.ts';
import type { AgentProvider } from './provider.ts';
import type { AgentProviderId, AgentProviderStatus, AgentStatus } from './types.ts';

const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export async function providerStatus(
  userCwd: string,
  provider: AgentProvider,
): Promise<AgentProviderStatus> {
  const sdk = resolveWorkspacePackage(userCwd, provider.sdkPackage);
  const cliPath = findOnPath(provider.cliCommand);
  const cliVersion = cliPath ? await commandVersion(cliPath) : null;
  return {
    id: provider.id,
    name: provider.name,
    sdkPackage: provider.sdkPackage,
    sdkInstalled: sdk !== null,
    sdkVersion: sdk?.version ?? null,
    cliCommand: provider.cliCommand,
    cliFound: cliPath !== null,
    cliVersion,
    ready: sdk !== null,
  };
}

export async function agentStatus(
  userCwd: string,
  providers: Record<AgentProviderId, AgentProvider>,
  packageManager: PackageManager,
  enabled: boolean,
): Promise<AgentStatus> {
  const list = await Promise.all(
    Object.values(providers).map((provider) => providerStatus(userCwd, provider)),
  );
  return { enabled, packageManager, providers: list };
}

export function installCommandFor(
  packageManager: PackageManager,
  pkg: string,
): { cmd: string; args: string[] } {
  switch (packageManager) {
    case 'pnpm':
      return { cmd: 'pnpm', args: ['add', '-D', pkg] };
    case 'yarn':
      return { cmd: 'yarn', args: ['add', '-D', pkg] };
    case 'bun':
      return { cmd: 'bun', args: ['add', '-d', pkg] };
    case 'npm':
      return { cmd: 'npm', args: ['install', '-D', pkg] };
  }
}

export function installSdk(
  packageManager: PackageManager,
  pkg: string,
  cwd: string,
): Promise<void> {
  const spec = installCommandFor(packageManager, pkg);
  return new Promise<void>((resolve, reject) => {
    const child = spawn(spec.cmd, spec.args, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${spec.cmd} ${spec.args.join(' ')} timed out`));
    }, INSTALL_TIMEOUT_MS);
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 2000) stderr = stderr.slice(-2000);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve();
      reject(
        new Error(
          stderr.trim() ||
            `${spec.cmd} ${spec.args.join(' ')} exited with code ${code ?? 'unknown'}`,
        ),
      );
    });
  });
}
