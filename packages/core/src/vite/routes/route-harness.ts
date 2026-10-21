import { Readable } from 'node:stream';
import type { ViteDevServer } from 'vite';

type Handler = (req: unknown, res: unknown, next: () => void) => Promise<void> | void;

export type FakeResponse = { statusCode: number; body: unknown };

export function captureRoute(register: (server: ViteDevServer) => void) {
  let handler: Handler | null = null;
  const server = {
    middlewares: {
      use: (_prefix: string, h: Handler) => {
        handler = h;
      },
    },
  } as unknown as ViteDevServer;
  register(server);
  return async (method: string, url: string, body?: unknown): Promise<FakeResponse> => {
    const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
    Object.assign(req, {
      method,
      url,
      headers: { 'content-type': 'application/json' },
      socket: {},
    });
    const out: FakeResponse = { statusCode: 0, body: undefined };
    const res = {
      set statusCode(v: number) {
        out.statusCode = v;
      },
      setHeader: () => {},
      end: (raw: string) => {
        out.body = JSON.parse(raw);
      },
    };
    if (!handler) throw new Error('route not registered');
    await handler(req, res, () => {
      out.statusCode = 404;
    });
    return out;
  };
}
