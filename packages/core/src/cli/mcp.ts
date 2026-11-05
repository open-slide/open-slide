import path from 'node:path';
import { closePreviewBrowser } from '../mcp/preview.ts';
import { createServer, serveStdio } from '../mcp/protocol.ts';
import { buildTools, SERVER_INSTRUCTIONS } from '../mcp/tools.ts';
import { loadUserConfig } from '../vite/open-slide-plugin.ts';
import { readVersion } from './ui.ts';

export interface McpOptions {
  cwd?: string;
  builtinSkillsDir: string;
}

export async function mcp(opts: McpOptions): Promise<void> {
  const userCwd = path.resolve(opts.cwd ?? process.cwd());
  const config = await loadUserConfig(userCwd);
  const project = {
    userCwd,
    slidesRoot: path.resolve(userCwd, config.slidesDir ?? 'slides'),
    themesRoot: path.resolve(userCwd, config.themesDir ?? 'themes'),
    globalAssetsRoot: path.resolve(userCwd, config.assetsDir ?? 'assets'),
    builtinSkillsDir: opts.builtinSkillsDir,
  };
  const server = createServer({
    name: 'open-slide',
    version: readVersion(),
    instructions: SERVER_INSTRUCTIONS,
    tools: buildTools(project),
  });
  process.stderr.write(`open-slide MCP server ready for ${userCwd}\n`);
  await serveStdio(server);
  await closePreviewBrowser();
}
