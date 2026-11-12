import { type PackageManager, runCommand } from '../vite/routes/update.ts';
import { commandVersion, findOnPath, resolveWorkspacePackage } from './detect.ts';
import type { AgentProvider } from './provider.ts';
import type { AgentProviderId, AgentProviderStatus, AgentStatus } from './types.ts';

const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;

async function providerStatus(
  userCwd: string,
  provider: AgentProvider,
): Promise<AgentProviderStatus> {
  const sdk = resolveWorkspacePackage(userCwd, provider.sdkPackage);
  const cliPath = findOnPath(provider.cliCommand);
  const [cliVersion, models] = await Promise.all([
    cliPath ? commandVersion(cliPath) : null,
    provider.models(),
  ]);
  return {
    id: provider.id,
    name: provider.name,
    sdkPackage: provider.sdkPackage,
    sdkVersion: sdk?.version ?? null,
    cliCommand: provider.cliCommand,
    cliFound: cliPath !== null,
    cliVersion,
    ready: sdk !== null,
    models,
  };
}

export async function agentStatus(
  userCwd: string,
  providers: Record<AgentProviderId, AgentProvider>,
  packageManager: PackageManager,
): Promise<AgentStatus> {
  const list = await Promise.all(
    Object.values(providers).map((provider) => providerStatus(userCwd, provider)),
  );
  return { enabled: true, packageManager, providers: list };
}

function installCommandFor(
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
  return runCommand(installCommandFor(packageManager, pkg), cwd, INSTALL_TIMEOUT_MS);
}
