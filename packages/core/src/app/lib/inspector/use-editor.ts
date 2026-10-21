import { useCallback } from 'react';

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

export type Edit = {
  file: string;
  line: number;
  column: number;
  ops: EditOp[];
  dependsOn?: number;
};

export type EditResult = { ok: boolean; error?: string };

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
    async (file: string, line: number, column: number, ops: EditOp[]) => {
      const res = await fetch('/__edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, file, line, column, ops }),
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
      const groups = new Map<string, number[]>();
      edits.forEach((edit, index) => {
        const group = groups.get(edit.file);
        if (group) group.push(index);
        else groups.set(edit.file, [index]);
      });
      const results: EditResult[] = new Array(edits.length);
      let sent = 0;
      let lastError: unknown;
      for (const [file, indices] of groups) {
        const batch = indices.map((i) => {
          const { file: _file, ...rest } = edits[i];
          if (rest.dependsOn === undefined) return rest;
          const local = indices.indexOf(rest.dependsOn);
          return { ...rest, dependsOn: local >= 0 ? local : undefined };
        });
        try {
          const res = await fetch('/__edit/batch', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ slideId, file, edits: batch }),
          });
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
            results?: EditResult[];
          };
          if (!res.ok) {
            throw new Error(body.error ?? `POST /__edit/batch → ${res.status}`);
          }
          sent++;
          indices.forEach((i, k) => {
            results[i] = body.results?.[k] ?? { ok: false, error: 'missing result' };
          });
        } catch (err) {
          lastError = err;
          const error = err instanceof Error ? err.message : String(err);
          for (const i of indices) results[i] = { ok: false, error };
        }
      }
      if (sent === 0) throw lastError;
      return results;
    },
    [slideId],
  );

  return { applyEdit, applyEdits };
}
