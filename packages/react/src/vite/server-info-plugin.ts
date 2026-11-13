import { randomUUID } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import fs from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { Plugin } from 'vite';

export type ServerInfoPluginOptions = {
  userCwd: string;
};

export function serverInfoUrl(address: AddressInfo, https: boolean, base: string): string {
  const wildcard = address.address === '::' || address.address === '0.0.0.0';
  let host = wildcard ? 'localhost' : address.address;
  if (host.includes(':')) host = `[${host}]`;
  const pathname = base.startsWith('/') ? base : '/';
  return `${https ? 'https' : 'http'}://${host}:${address.port}${pathname}`;
}

export function serverInfoPlugin(opts: ServerInfoPluginOptions): Plugin {
  const outDir = path.join(opts.userCwd, 'node_modules', '.open-slide');
  const outFile = path.join(outDir, 'server.json');

  return {
    name: 'open-slide:server-info',
    apply: 'serve',
    configureServer(server) {
      const httpServer = server.httpServer;
      if (!httpServer) return;

      let publication: Promise<string | null> = Promise.resolve(null);

      httpServer.on('listening', () => {
        const address = httpServer.address();
        if (!address || typeof address === 'string') return;
        const token = randomUUID();
        const body = {
          url: serverInfoUrl(address, Boolean(server.config.server.https), server.config.base),
          port: address.port,
          pid: process.pid,
          startedAt: new Date().toISOString(),
          token,
        };
        const tmpFile = `${outFile}.${token}.tmp`;
        publication = (async () => {
          try {
            await fs.mkdir(outDir, { recursive: true });
            await fs.writeFile(tmpFile, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
            await fs.rename(tmpFile, outFile);
            return token;
          } catch {
            // Best-effort: a transient FS error here shouldn't crash the dev server.
            await fs.rm(tmpFile, { force: true }).catch(() => {});
            return null;
          }
        })();
      });

      httpServer.on('close', async () => {
        const token = await publication;
        if (!token) return;
        // Sync from here on: shutdown can exit the process before further awaits resolve.
        try {
          const current = JSON.parse(readFileSync(outFile, 'utf8')) as { token?: unknown };
          // Another dev server in the same project may have published since.
          if (current.token === token) rmSync(outFile, { force: true });
        } catch {
          // Already removed or unreadable — nothing to clean up.
        }
      });
    },
  };
}
