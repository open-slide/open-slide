import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import { applyEditBatch, type BatchEdit } from '../../editing/batch-edit.ts';
import { applyEdit, type EditOp } from '../../editing/edit-ops.ts';
import { applyRevertAsset } from '../../editing/revert-asset.ts';
import { RevisionJournal } from '../../editing/revisions.ts';
import {
  applyStructureOp,
  copyElements,
  type ElementLoc,
  type StructureOp,
} from '../../editing/structure-ops.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  json,
  readBody,
  readSlideSource,
  resolveSlideEntryPath,
} from './context.ts';

// POST /__edit                applyEdit({ slideId, line, column, ops })
// POST /__edit/revert-asset   applyRevertAsset({ slideId, assetPath })
// POST /__edit/batch          applyEdit × N — single FS write per request
// POST /__edit/structure      applyStructureOp({ slideId, op }) → { created }
// POST /__edit/copy           copyElements({ slideId, targets }) → { snippets }
// POST /__edit/history        undo/redo a recorded write { slideId, revision, direction }
//
// Every write answers with a `revision` id the client can hand back to
// /history, so undo keeps working after an edit has been saved.

type EditBody = {
  slideId?: string;
  line?: number;
  column?: number;
  ops?: EditOp[];
};

type EditBatchBody = {
  slideId?: string;
  edits?: BatchEdit[];
};

type StructureBody = { slideId?: string; op?: StructureOp };
type CopyBody = { slideId?: string; targets?: ElementLoc[] };
type HistoryBody = { slideId?: string; revision?: string; direction?: string };

export const editRevisions = new RevisionJournal();

async function writeRevision(
  file: string,
  slideId: string,
  before: string,
  after: string,
): Promise<string | undefined> {
  if (after === before) return undefined;
  await fs.writeFile(file, after, 'utf8');
  return editRevisions.record(slideId, before, after);
}

function isLocList(value: unknown): value is ElementLoc[] {
  return (
    Array.isArray(value) &&
    value.every(
      (loc) =>
        loc &&
        typeof loc === 'object' &&
        Number.isInteger((loc as ElementLoc).line) &&
        Number.isInteger((loc as ElementLoc).column),
    )
  );
}

export function registerEditRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__edit', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';
    if (method !== 'POST') return next();
    const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
    if (!requestCheck.ok) return json(res, requestCheck.status, { error: requestCheck.error });

    try {
      if (url.pathname === '/') {
        const body = (await readBody(req)) as EditBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!Array.isArray(body.ops)) return json(res, 400, { error: 'missing ops' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = applyEdit(source, body.line, body.column ?? 0, body.ops);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const revision = await writeRevision(file, slideId, source, result.source);
        return json(res, 200, { ok: true, changed: !!revision, revision });
      }

      if (url.pathname === '/revert-asset') {
        const body = (await readBody(req)) as { slideId?: string; assetPath?: string };
        const slideId = body.slideId ?? '';
        const assetPath = body.assetPath;
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (typeof assetPath !== 'string' || !assetPath) {
          return json(res, 400, { error: 'missing assetPath' });
        }
        if (!assetPath.startsWith('./assets/') && !assetPath.startsWith('@assets/')) {
          return json(res, 400, { error: 'asset path must start with ./assets/ or @assets/' });
        }

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = applyRevertAsset(source, assetPath);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const revision = await writeRevision(file, slideId, source, result.source);
        return json(res, 200, { ok: true, changed: !!revision, revision });
      }

      // One read-modify-write per batch so a multi-element edit session
      // lands as a single HMR. Per-edit failures are reported but don't
      // abort the batch.
      if (url.pathname === '/batch') {
        const body = (await readBody(req)) as EditBatchBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!Array.isArray(body.edits)) return json(res, 400, { error: 'missing edits' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const { source: updated, results } = applyEditBatch(source, body.edits);
        const revision = await writeRevision(file, slideId, source, updated);
        return json(res, 200, { ok: true, changed: !!revision, results, revision });
      }

      if (url.pathname === '/structure') {
        const body = (await readBody(req)) as StructureBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!body.op || typeof body.op !== 'object') return json(res, 400, { error: 'missing op' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = applyStructureOp(source, body.op);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const revision = await writeRevision(file, slideId, source, result.source);
        return json(res, 200, { ok: true, changed: !!revision, created: result.created, revision });
      }

      if (url.pathname === '/copy') {
        const body = (await readBody(req)) as CopyBody;
        const file = resolveSlideEntryPath(ctx, body.slideId ?? '');
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!isLocList(body.targets)) return json(res, 400, { error: 'invalid targets' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = copyElements(source, body.targets);
        if (!result.ok) return json(res, result.status, { error: result.error });
        return json(res, 200, { ok: true, snippets: result.snippets });
      }

      if (url.pathname === '/history') {
        const body = (await readBody(req)) as HistoryBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (typeof body.revision !== 'string') return json(res, 400, { error: 'missing revision' });
        if (body.direction !== 'undo' && body.direction !== 'redo') {
          return json(res, 400, { error: 'invalid direction' });
        }

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = editRevisions.restore(slideId, body.revision, body.direction, source);
        if (!result.ok) return json(res, result.status, { error: result.error });
        await fs.writeFile(file, result.source, 'utf8');
        return json(res, 200, { ok: true, changed: true });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
