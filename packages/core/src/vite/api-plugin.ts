import type { Plugin } from 'vite';
import { registerAgentRoutes } from './routes/agent.ts';
import { registerAssetRoutes } from './routes/assets.ts';
import { registerCommentRoutes } from './routes/comments.ts';
import { type ApiPluginOptions, makeContext } from './routes/context.ts';
import { registerEditRoutes } from './routes/edit.ts';
import { registerFolderRoutes } from './routes/folders.ts';
import { registerGfontsRoutes } from './routes/gfonts.ts';
import { registerRestartRoutes } from './routes/restart.ts';
import { registerSlideRoutes } from './routes/slides.ts';
import { registerSvglRoutes } from './routes/svgl.ts';
import { registerThemeRoutes } from './routes/themes.ts';
import { registerUpdateRoutes } from './routes/update.ts';
import { registerWatchers } from './routes/watchers.ts';

// All open-slide dev-server endpoints in one plugin. To see the routes
// owned by a group, open the matching file under `routes/` — each file
// leads with a comment-block manifest of its endpoints.
export function apiPlugin(opts: ApiPluginOptions): Plugin {
  // A restart reuses this plugin object and configures the new server before
  // closing the old one, so each server's agent is keyed by its environments.
  const agents = new WeakMap<object, () => Promise<void>>();
  let running: (() => Promise<void>) | null = null;
  return {
    name: 'open-slide:api',
    apply: 'serve',
    async configureServer(server) {
      // The outgoing agent writes its sessions out before the new one reads them.
      await running?.();
      const ctx = makeContext(opts);
      registerWatchers(server, ctx);
      registerEditRoutes(server, ctx);
      registerCommentRoutes(server, ctx);
      registerSlideRoutes(server, ctx);
      registerAssetRoutes(server, ctx);
      registerSvglRoutes(server);
      registerThemeRoutes(server, ctx);
      registerGfontsRoutes(server);
      registerFolderRoutes(server, ctx);
      registerUpdateRoutes(server, ctx);
      registerRestartRoutes(server);
      const closeAgent = registerAgentRoutes(server, ctx);
      running = closeAgent;
      for (const environment of Object.values(server.environments)) {
        agents.set(environment, closeAgent);
      }
    },
    // Vite waits for this while it closes the server.
    async closeBundle() {
      await agents.get(this.environment)?.();
    },
  };
}
