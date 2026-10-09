import { useCallback } from 'react';
import type { ElementOp, RemovedSource } from '../../../editing/remove-element';

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
  | { kind: 'replace-placeholder-with-image'; assetPath: string };

export type Edit = { line: number; column: number; ops: EditOp[]; dependsOn?: number };

export type EditResult = { ok: boolean; error?: string };

export class NoOpEditError extends Error {
  constructor() {
    super(
      'Edit completed but the source file did not change — the target JSX may already match, or the target element may not be directly editable here.',
    );
    this.name = 'NoOpEditError';
  }
}

export class ElementEditError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ElementEditError';
  }
}

export function useEditor(slideId: string) {
  const applyEdit = useCallback(
    async (line: number, column: number, ops: EditOp[]) => {
      const res = await fetch('/__edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, line, column, ops }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; changed?: boolean };
      if (!res.ok) {
        throw new Error(body.error ?? `POST /__edit → ${res.status}`);
      }
      if (body.changed === false) {
        throw new NoOpEditError();
      }
    },
    [slideId],
  );

  // Batch many element edits into one file write and one HMR tick.
  // Returns one result per input edit so callers can keep failed
  // edits buffered while clearing the ones that landed.
  const applyEdits = useCallback(
    async (edits: Edit[]): Promise<EditResult[]> => {
      if (edits.length === 0) return [];
      const res = await fetch('/__edit/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, edits }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        results?: EditResult[];
      };
      if (!res.ok) {
        throw new Error(body.error ?? `POST /__edit/batch → ${res.status}`);
      }
      return body.results ?? [];
    },
    [slideId],
  );

  // Removing and restoring land immediately, outside the buffered edits. The
  // returned revision lets undo and redo refuse a source that changed since.
  const postElementEdit = useCallback(
    async (line: number, column: number, op: ElementOp, revision?: string) => {
      const res = await fetch('/__edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, line, column, ops: [op], revision }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        revision?: string;
        removed?: RemovedSource;
      };
      if (!res.ok || !body.revision) {
        throw new ElementEditError(body.error ?? `POST /__edit → ${res.status}`, body.code);
      }
      return { revision: body.revision, removed: body.removed };
    },
    [slideId],
  );

  const removeElement = useCallback(
    async (line: number, column: number, instanceCount: number, revision?: string) => {
      const result = await postElementEdit(
        line,
        column,
        { kind: 'remove-element', instanceCount },
        revision,
      );
      if (!result.removed) throw new ElementEditError('the server did not report the removal');
      return { revision: result.revision, removed: result.removed };
    },
    [postElementEdit],
  );

  const restoreElement = useCallback(
    async (line: number, column: number, removed: RemovedSource, revision: string) => {
      const result = await postElementEdit(
        line,
        column,
        { kind: 'restore-element', ...removed },
        revision,
      );
      return result.revision;
    },
    [postElementEdit],
  );

  return { applyEdit, applyEdits, removeElement, restoreElement };
}
