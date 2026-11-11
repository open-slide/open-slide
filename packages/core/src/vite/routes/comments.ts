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
  readBody,
  readSlideSource,
  resolveSlideEntryPath,
} from './context.ts';

// GET    /__comments        list markers for ?slideId=…
// POST   /__comments/add    add marker { slideId, line, column?, text, hint?, rect?, page? }
// PUT    /__comments/:id    replace note { slideId, text }
// DELETE /__comments/:id    remove marker

type AddCommentBody = {
  slideId?: string;
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
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });
        return json(res, 200, { comments: resolveTargets(source, parseMarkers(source)) });
      }

      if (method === 'POST' && url.pathname === '/add') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as AddCommentBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
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
        const body = (await readBody(req)) as { slideId?: string; text?: string };
        const file = resolveSlideEntryPath(ctx, body.slideId ?? '');
        if (!file) return json(res, 400, { error: 'invalid slideId' });
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
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });

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
