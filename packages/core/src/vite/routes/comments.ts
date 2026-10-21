import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import {
  b64urlEncode,
  buildMarker,
  type CommentPayload,
  findInsertion,
  newCommentId,
  offsetToLine,
  parseCommentPage,
  parseCommentRect,
  parseMarkers,
  removeMarker,
  resolveTargets,
  updateMarkerNote,
} from '../../editing/comments.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  json,
  listDeckFiles,
  readBody,
  readSlideSource,
  rejectDeckFile,
  requestedDeckFile,
  resolveDeckFile,
  resolveSlideEntryPath,
} from './context.ts';

// GET    /__comments        list markers of every deck file for ?slideId=…
// POST   /__comments/add    add marker { slideId, file?, line, column?, text, hint?, rect?, page? }
// PUT    /__comments/:id    replace note { slideId, file?, text }
// DELETE /__comments/:id    remove marker ?slideId=…&file=…

type AddCommentBody = {
  slideId?: string;
  file?: unknown;
  line?: number;
  column?: number;
  text?: string;
  hint?: string;
  rect?: unknown;
  page?: unknown;
};

export function registerCommentRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__comments', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      if (method === 'GET' && url.pathname === '/') {
        const slideId = url.searchParams.get('slideId') ?? '';
        const entry = resolveSlideEntryPath(ctx, slideId);
        if (!entry) return json(res, 400, { error: 'invalid slideId' });
        const entrySource = await readSlideSource(entry);
        if (entrySource === null) return json(res, 404, { error: 'slide not found' });
        const comments = [];
        for (const rel of await listDeckFiles(ctx, slideId)) {
          const abs = await resolveDeckFile(ctx, slideId, rel);
          if (!abs) continue;
          const source = await readSlideSource(abs);
          if (source === null) continue;
          comments.push(...resolveTargets(source, parseMarkers(source), rel));
        }
        return json(res, 200, { comments });
      }

      if (method === 'POST' && url.pathname === '/add') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as AddCommentBody;
        const slideId = body.slideId ?? '';
        if (!resolveSlideEntryPath(ctx, slideId))
          return json(res, 400, { error: 'invalid slideId' });
        const rel = requestedDeckFile(body.file);
        const file = await resolveDeckFile(ctx, slideId, rel);
        if (!file) return rejectDeckFile(res, rel);
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!body.text || typeof body.text !== 'string') {
          return json(res, 400, { error: 'missing text' });
        }

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const plan = findInsertion(source, body.line, body.column);
        if (!plan) {
          return json(res, 422, {
            error:
              'could not find a JSX container around line ' +
              `${body.line}. Try clicking a different element.`,
          });
        }

        const id = newCommentId();
        const ts = new Date().toISOString();
        const payload: CommentPayload = {
          note: body.text,
          hint: body.hint,
          rect: parseCommentRect(body.rect),
          page: parseCommentPage(body.page),
        };
        const encoded = b64urlEncode(JSON.stringify(payload));
        const marker = buildMarker(plan, id, ts, encoded);

        const next = source.slice(0, plan.offset) + marker + source.slice(plan.offset);
        await fs.writeFile(file, next, 'utf8');
        const markerLine = offsetToLine(next, plan.offset + 1);
        return json(res, 200, { id, line: markerLine });
      }

      if (method === 'PUT' && url.pathname.startsWith('/')) {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const id = url.pathname.slice(1);
        if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
        const body = (await readBody(req)) as { slideId?: string; file?: unknown; text?: string };
        const slideId = body.slideId ?? '';
        if (!resolveSlideEntryPath(ctx, slideId))
          return json(res, 400, { error: 'invalid slideId' });
        const rel = requestedDeckFile(body.file);
        const file = await resolveDeckFile(ctx, slideId, rel);
        if (!file) return rejectDeckFile(res, rel);
        if (!body.text || typeof body.text !== 'string') {
          return json(res, 400, { error: 'missing text' });
        }
        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });
        const next = updateMarkerNote(source, id, body.text);
        if (next === null) return json(res, 404, { error: 'marker not found' });
        await fs.writeFile(file, next, 'utf8');
        return json(res, 200, { ok: true });
      }

      if (method === 'DELETE' && url.pathname.startsWith('/')) {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const id = url.pathname.slice(1);
        if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
        const slideId = url.searchParams.get('slideId') ?? '';
        if (!resolveSlideEntryPath(ctx, slideId))
          return json(res, 400, { error: 'invalid slideId' });
        const rel = requestedDeckFile(url.searchParams.get('file'));
        const file = await resolveDeckFile(ctx, slideId, rel);
        if (!file) return rejectDeckFile(res, rel);

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const next = removeMarker(source, id);
        if (next === null) return json(res, 404, { error: 'marker not found' });
        await fs.writeFile(file, next, 'utf8');
        return json(res, 200, { ok: true });
      }

      next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
