import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import { applyEditBatch, type BatchEdit } from '../../editing/batch-edit.ts';
import { applyEdit, type EditOp } from '../../editing/edit-ops.ts';
import { applyRevertAsset } from '../../editing/revert-asset.ts';
import { resolveSlideSourceFile } from '../../editing/slide-ops.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  json,
  readBody,
  readSlideSource,
  resolveSlideEntryPath,
} from './context.ts';

// POST /__edit                applyEdit({ slideId, file?, line, column, ops })
// POST /__edit/revert-asset   applyRevertAsset({ slideId, assetPath })
// POST /__edit/batch          applyEditBatch per source file, one FS write per file

type EditBody = {
  slideId?: string;
  file?: string;
  line?: number;
  column?: number;
  ops?: EditOp[];
};

type FileBatchEdit = BatchEdit & { file?: string };

type EditBatchBody = {
  slideId?: string;
  edits?: FileBatchEdit[];
};

function resolveEditFile(ctx: ApiContext, slideId: string, rel?: string): string | null {
  return resolveSlideSourceFile(ctx.slidesRoot, slideId, rel);
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
        if (body.file !== undefined && typeof body.file !== 'string') {
          return json(res, 400, { error: 'invalid file' });
        }
        const file = resolveEditFile(ctx, slideId, body.file);
        if (!file) return json(res, 400, { error: body.file ? 'invalid file' : 'invalid slideId' });
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!Array.isArray(body.ops)) return json(res, 400, { error: 'missing ops' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const result = applyEdit(source, body.line, body.column ?? 0, body.ops);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const changed = result.source !== source;
        if (changed) await fs.writeFile(file, result.source, 'utf8');
        return json(res, 200, { ok: true, changed });
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
        const changed = result.source !== source;
        if (changed) await fs.writeFile(file, result.source, 'utf8');
        return json(res, 200, { ok: true, changed });
      }

      // One read-modify-write per source file so edits in one file land as a
      // single HMR. dependsOn indexes the original batch, so each file group
      // remaps it onto that group's own order. Per-edit failures are reported
      // but do not abort the batch.
      if (url.pathname === '/batch') {
        const body = (await readBody(req)) as EditBatchBody;
        const slideId = body.slideId ?? '';
        if (!Array.isArray(body.edits)) return json(res, 400, { error: 'missing edits' });

        const results: Array<{ ok: boolean; error?: string }> = body.edits.map(() => ({
          ok: false,
          error: 'invalid edit',
        }));
        const groups = new Map<string, Array<{ index: number; edit: FileBatchEdit }>>();
        for (let i = 0; i < body.edits.length; i++) {
          const edit = body.edits[i];
          if (edit == null || typeof edit !== 'object') continue;
          if (edit.file !== undefined && typeof edit.file !== 'string') {
            results[i] = { ok: false, error: 'invalid file' };
            continue;
          }
          const abs = resolveEditFile(ctx, slideId, edit?.file);
          if (!abs) {
            results[i] = { ok: false, error: edit?.file ? 'invalid file' : 'invalid slideId' };
            continue;
          }
          const group = groups.get(abs);
          if (group) group.push({ index: i, edit });
          else groups.set(abs, [{ index: i, edit }]);
        }

        if (groups.size === 0) {
          const slideOk = resolveEditFile(ctx, slideId);
          if (!slideOk) return json(res, 400, { error: 'invalid slideId' });
          return json(res, 200, { ok: true, changed: false, results });
        }

        let changed = false;
        for (const [file, group] of groups) {
          const source = await readSlideSource(file);
          if (source === null) {
            for (const { index } of group) {
              results[index] = { ok: false, error: 'slide not found' };
            }
            continue;
          }
          const localOf = new Map<number, number>();
          for (let local = 0; local < group.length; local++) {
            const item = group[local];
            if (item) localOf.set(item.index, local);
          }
          const localEdits: BatchEdit[] = group.map((item, local) => {
            const { file: _file, dependsOn, ...rest } = item.edit;
            const mapped = dependsOn === undefined ? undefined : localOf.get(dependsOn);
            return mapped !== undefined && mapped < local ? { ...rest, dependsOn: mapped } : rest;
          });
          const applied = applyEditBatch(source, localEdits);
          if (applied.source !== source) {
            await fs.writeFile(file, applied.source, 'utf8');
            changed = true;
          }
          applied.results.forEach((result, local) => {
            results[group[local].index] = result;
          });
        }
        return json(res, 200, { ok: true, changed, results });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
