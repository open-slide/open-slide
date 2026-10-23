import type { OpenSlideAcpProviderConfig } from '../../config.ts';
import type { AgentProvider } from '../provider.ts';
import type { AgentProviderId } from '../types.ts';
import { createAcpProvider } from './acp.ts';
import { createClaudeProvider } from './claude.ts';
import { createCodexProvider } from './codex.ts';

export function createProviders(
  configured: OpenSlideAcpProviderConfig[] = [],
  coreVersion = '0.0.0',
  builtins = true,
): Record<AgentProviderId, AgentProvider> {
  const providers: Record<AgentProviderId, AgentProvider> = builtins
    ? { claude: createClaudeProvider(), codex: createCodexProvider() }
    : {};
  for (const config of configured) {
    if (
      config.type !== 'acp' ||
      !/^[a-z][a-z0-9-]*$/.test(config.id) ||
      !config.name?.trim() ||
      !config.command?.trim() ||
      (config.args !== undefined &&
        (!Array.isArray(config.args) || !config.args.every((arg) => typeof arg === 'string'))) ||
      Object.hasOwn(providers, config.id)
    ) {
      throw new Error(`Invalid or duplicate ACP agent provider: ${config.id}`);
    }
    providers[config.id] = createAcpProvider(config, coreVersion);
  }
  return providers;
}
