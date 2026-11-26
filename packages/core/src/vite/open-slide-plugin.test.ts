import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer, normalizePath } from 'vite';
import { describe, expect, it } from 'vitest';
import { createViteConfig } from './config.ts';
import { generateSlidesModule } from './open-slide-plugin.ts';
import { recordWrite } from './recent-writes.ts';

async function withSlidesRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-test-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeSlide(root: string, id: string): Promise<string> {
  await fs.mkdir(path.join(root, id), { recursive: true });
  const entry = path.join(root, id, 'index.tsx');
  await fs.writeFile(
    entry,
    `export const meta = { title: '${id}' };\nexport default [];\n`,
    'utf8',
  );
  return entry;
}

describe('generateSlidesModule', () => {
  it('keeps slides whose id is ASCII-safe and reports none ignored', async () => {
    await withSlidesRoot(async (root) => {
      const files = [await writeSlide(root, 'cover'), await writeSlide(root, 'intro_2')].sort();

      const { code, ignored } = await generateSlidesModule(files, root, false);

      expect(ignored).toEqual([]);
      expect(code).toContain('export const slideIds = ["cover","intro_2"];');
    });
  });

  it('excludes folders whose id is not ASCII-safe and reports them as ignored', async () => {
    await withSlidesRoot(async (root) => {
      const files = [await writeSlide(root, 'cover'), await writeSlide(root, '推薦系統')].sort();

      const { code, ignored } = await generateSlidesModule(files, root, false);

      expect(ignored).toEqual(['推薦系統']);
      expect(code).toContain('export const slideIds = ["cover"];');
      expect(code).not.toContain('推薦系統');
    });
  });
});

async function waitFor<T>(predicate: () => T | undefined, timeoutMs = 4000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value !== undefined) return value;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error('Timed out waiting for condition');
}

describe('openSlidePlugin nested file HMR', () => {
  it('hot-reloads nested modules and atomic replacements without full-reload', async () => {
    await withSlidesRoot(async (workspaceRoot) => {
      const slideDir = path.join(workspaceRoot, 'slides', 'demo');
      const partsDir = path.join(slideDir, 'parts');
      await fs.mkdir(partsDir, { recursive: true });
      const dataFile = path.join(partsDir, 'data.ts');
      const frameFile = path.join(partsDir, 'frame.tsx');
      const entryFile = path.join(slideDir, 'index.tsx');

      await fs.writeFile(dataFile, 'export const label = "V1";\n', 'utf8');
      await fs.writeFile(
        frameFile,
        'import { label } from "./data";\nexport const pages = [() => label];\n',
        'utf8',
      );
      await fs.writeFile(
        entryFile,
        [
          'import { pages } from "./parts/frame";',
          'export default pages;',
          'if (import.meta.hot) { import.meta.hot.accept(["./parts/frame"], () => {}); }',
        ].join('\n'),
        'utf8',
      );

      const config = await createViteConfig({ userCwd: workspaceRoot, config: {} });
      const server = await createServer({
        ...config,
        server: { ...config.server, host: '127.0.0.1', port: 0, strictPort: false },
        logLevel: 'silent',
      });
      await server.listen();

      try {
        const addr = server.httpServer?.address();
        if (!addr || typeof addr === 'string') throw new Error('Server failed to bind');
        const baseUrl = `http://127.0.0.1:${addr.port}`;
        const wsEvents: Array<{ type?: string; event?: string; data?: { slideIds?: string[] } }> =
          [];
        const origSend = server.ws.send.bind(server.ws);
        server.ws.send = ((payload: unknown, ...rest: unknown[]) => {
          wsEvents.push(payload as (typeof wsEvents)[number]);
          return (origSend as (...args: unknown[]) => unknown)(payload, ...rest);
        }) as typeof server.ws.send;

        const fetchMod = async (urlPath: string) => {
          const res = await fetch(`${baseUrl}/${urlPath.replace(/^\/+/, '')}`);
          return res.text();
        };
        const entryFsUrl = `@fs/${normalizePath(entryFile).replace(/^\/+/, '')}`;

        const idx0 = await fetchMod(`${entryFsUrl}?t=0`);
        const frameUrl0 = idx0.match(/from\s+"([^"]*frame\.tsx[^"]*)"/)?.[1];
        expect(frameUrl0).toBeTruthy();
        const frame0 = await fetchMod(frameUrl0 as string);
        const dataUrl0 = frame0.match(/from\s+"([^"]*data\.ts[^"]*)"/)?.[1];
        expect(dataUrl0).toBeTruthy();
        expect(await fetchMod(dataUrl0 as string)).toContain('V1');

        wsEvents.length = 0;
        await fs.writeFile(
          frameFile,
          'import { label } from "./data";\nexport const pages = [() => "FRAME_V2:" + label];\n',
          'utf8',
        );
        const frameEvent = await waitFor(() =>
          wsEvents.find((e) => e.event === 'open-slide:slide-changed'),
        );
        expect(frameEvent.data?.slideIds).toEqual(['demo']);
        expect(wsEvents.some((e) => e.type === 'full-reload')).toBe(false);

        const idx1 = await fetchMod(`${entryFsUrl}?t=1`);
        const frameUrl1 = idx1.match(/from\s+"([^"]*frame\.tsx[^"]*)"/)?.[1];
        expect(frameUrl1).toContain('?t=');
        expect(await fetchMod(frameUrl1 as string)).toContain('FRAME_V2');

        wsEvents.length = 0;
        const tmpFile = path.join(partsDir, '.data.ts.tmp');
        await fs.writeFile(tmpFile, 'export const label = "DATA_V3";\n', 'utf8');
        await fs.rename(tmpFile, dataFile);
        const dataEvent = await waitFor(() =>
          wsEvents.find((e) => e.event === 'open-slide:slide-changed'),
        );
        expect(dataEvent.data?.slideIds).toEqual(['demo']);
        expect(wsEvents.some((e) => e.type === 'full-reload')).toBe(false);

        const idx2 = await fetchMod(`${entryFsUrl}?t=2`);
        const frameUrl2 = idx2.match(/from\s+"([^"]*frame\.tsx[^"]*)"/)?.[1];
        const frame2 = await fetchMod(frameUrl2 as string);
        const dataUrl2 = frame2.match(/from\s+"([^"]*data\.ts[^"]*)"/)?.[1];
        expect(dataUrl2).toContain('?t=');
        expect(await fetchMod(dataUrl2 as string)).toContain('DATA_V3');

        wsEvents.length = 0;
        await fs.writeFile(path.join(slideDir, 'NOTES.md'), '# notes\n', 'utf8');
        recordWrite(entryFile);
        await fs.writeFile(entryFile, await fs.readFile(entryFile, 'utf8'), 'utf8');
        await new Promise((r) => setTimeout(r, 250));
        expect(wsEvents).toEqual([]);
      } finally {
        await server.close();
      }
    });
  }, 15_000);
});
