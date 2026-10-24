import fs from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import type { Connect, ViteDevServer } from 'vite';
import { afterEach, describe, expect, it } from 'vitest';
import { ASSET_MAX_BYTES } from '../../files/assets.ts';
import { registerAssetRoutes } from './assets.ts';
import { makeContext } from './context.ts';

type Mount = { prefix: string; handler: Connect.NextHandleFunction };

type AssetServer = { server: http.Server; port: number; cwd: string };

async function startAssetServer(): Promise<AssetServer> {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-assets-'));
  await fs.mkdir(path.join(cwd, 'slides', 'demo'), { recursive: true });
  await fs.writeFile(path.join(cwd, 'slides', 'demo', 'index.tsx'), 'export default [];\n');

  const mounts: Mount[] = [];
  const fakeVite = {
    middlewares: {
      use: (prefix: string, handler: Connect.NextHandleFunction) =>
        mounts.push({ prefix, handler }),
    },
  } as unknown as ViteDevServer;
  registerAssetRoutes(fakeVite, makeContext({ userCwd: cwd, coreVersion: 'test' }));

  const server = http.createServer((req, res) => {
    const mount = mounts.find((m) => req.url?.startsWith(m.prefix));
    if (!mount) {
      res.statusCode = 404;
      res.end();
      return;
    }
    req.url = req.url?.slice(mount.prefix.length) || '/';
    mount.handler(req as Connect.IncomingMessage, res, () => {
      res.statusCode = 404;
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, port: (server.address() as AddressInfo).port, cwd };
}

function chunkedUpload(port: number, bytes: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, method: 'POST', path: '/__assets/demo/big.png' },
      (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      },
    );
    req.on('error', reject);
    const chunk = Buffer.alloc(1024 * 1024);
    let sent = 0;
    const write = () => {
      while (sent < bytes) {
        sent += chunk.length;
        if (!req.write(chunk)) {
          req.once('drain', write);
          return;
        }
      }
      req.end();
    };
    write();
  });
}

describe('asset upload route', () => {
  let server: http.Server | undefined;

  afterEach(async () => {
    server?.closeAllConnections();
    await new Promise((resolve) => server?.close(resolve));
    server = undefined;
  });

  it('answers an oversized upload without content-length with 413', async () => {
    const started = await startAssetServer();
    server = started.server;

    const status = await chunkedUpload(started.port, ASSET_MAX_BYTES + 1024 * 1024);

    expect(status).toBe(413);
    await expect(
      fs.access(path.join(started.cwd, 'slides', 'demo', 'assets', 'big.png')),
    ).rejects.toThrow();
  });
});
