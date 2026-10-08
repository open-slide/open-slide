import { rmSync } from 'node:fs';
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
  const tmpFile = `${outFile}.tmp`;

  return {
    name: 'open-slide:server-info',
    apply: 'serve',
    configureServer(server) {
      const httpServer = server.httpServer;
      if (!httpServer) return;

      httpServer.on('listening', async () => {
        const address = httpServer.address();
        if (!address || typeof address === 'string') return;
        const body = {
          url: serverInfoUrl(address, Boolean(server.config.server.https), server.config.base),
          port: address.port,
          pid: process.pid,
          startedAt: new Date().toISOString(),
        };
        try {
          await fs.mkdir(outDir, { recursive: true });
          await fs.writeFile(tmpFile, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
          await fs.rename(tmpFile, outFile);
        } catch {
          // Best-effort: a transient FS error here shouldn't crash the dev server.
        }
      });

      httpServer.on('close', () => {
        rmSync(outFile, { force: true });
      });
    },
  };
}
