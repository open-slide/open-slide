import { useCallback } from 'react';
import type { ElementLoc, PageLayout, PageLayoutText, StructureOp } from '../structure';

export type EditOp =
  | { kind: 'set-style'; key: string; value: string | null; prevText?: string }
  | { kind: 'set-text'; value: string; prevText?: string }
  | {
      kind: 'set-text-range-style';
      start: number;
      end: number;
      key: string;
      value: string | null;
      prevText?: string;
    }
  | { kind: 'set-attr-asset'; attr: string; assetPath: string; previewUrl: string }
  | { kind: 'set-prop'; name: string; value: string | number | boolean | null }
  | { kind: 'replace-placeholder-with-image'; assetPath: string };

export type Edit = { line: number; column: number; ops: EditOp[]; dependsOn?: number };

export type EditResult = { ok: boolean; error?: string };

export type BatchResponse = { results: EditResult[]; revision?: string };
export type StructureResponse = { created: ElementLoc[]; revision?: string };

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new EditRequestError(body.error ?? `POST ${url} → ${res.status}`, res.status);
  return body;
}

export class EditRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'EditRequestError';
  }
}

export class NoOpEditError extends Error {
  constructor() {
    super(
      'Edit completed but the source file did not change — the target JSX may already match, or the target element may not be directly editable here.',
    );
    this.name = 'NoOpEditError';
  }
}

export function useEditor(slideId: string) {
  const applyEdit = useCallback(
    async (line: number, column: number, ops: EditOp[]): Promise<string> => {
      const body = await postJson<{ changed?: boolean; revision?: string }>('/__edit', {
        slideId,
        line,
        column,
        ops,
      });
      if (body.changed === false || !body.revision) throw new NoOpEditError();
      return body.revision;
    },
    [slideId],
  );

  // Batch many element edits into one file write and one HMR tick.
  // Returns one result per input edit so callers can keep failed
  // edits buffered while clearing the ones that landed.
  const applyEdits = useCallback(
    async (edits: Edit[]): Promise<BatchResponse> => {
      if (edits.length === 0) return { results: [] };
      const body = await postJson<Partial<BatchResponse>>('/__edit/batch', { slideId, edits });
      return { results: body.results ?? [], revision: body.revision };
    },
    [slideId],
  );

  const applyStructure = useCallback(
    async (op: StructureOp): Promise<StructureResponse> => {
      const body = await postJson<Partial<StructureResponse>>('/__edit/structure', { slideId, op });
      return { created: body.created ?? [], revision: body.revision };
    },
    [slideId],
  );

  const copyElements = useCallback(
    async (targets: ElementLoc[]): Promise<string[]> => {
      const body = await postJson<{ snippets?: string[] }>('/__edit/copy', { slideId, targets });
      return body.snippets ?? [];
    },
    [slideId],
  );

  const restoreRevision = useCallback(
    async (revision: string, direction: 'undo' | 'redo'): Promise<void> => {
      await postJson('/__edit/history', { slideId, revision, direction });
    },
    [slideId],
  );

  const insertPage = useCallback(
    async (after: number, layout: PageLayout, copy: PageLayoutText) => {
      const body = await postJson<{ index?: number; revision?: string }>('/__edit/insert-page', {
        slideId,
        after,
        layout,
        copy,
      });
      return { index: body.index ?? after + 1, revision: body.revision };
    },
    [slideId],
  );

  return { applyEdit, applyEdits, applyStructure, copyElements, restoreRevision, insertPage };
}
