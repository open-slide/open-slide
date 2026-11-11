import { useCallback, useEffect, useState } from 'react';

export type CommentRect = { x: number; y: number; w: number; h: number };

export type SlideComment = {
  id: string;
  line: number;
  ts: string;
  note: string;
  hint?: string;
  rect?: CommentRect;
  page?: number;
  target?: { line: number; column: number } | null;
};

export type AddCommentInput = {
  line: number;
  column: number;
  text: string;
  rect?: CommentRect;
  page?: number;
};

type ListResponse = { comments: SlideComment[] };

export function useComments(slideId: string) {
  const [comments, setComments] = useState<SlideComment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!slideId) return;
    try {
      const res = await fetch(`/__comments?slideId=${encodeURIComponent(slideId)}`);
      if (!res.ok) {
        setError(`GET /__comments → ${res.status}`);
        return;
      }
      const data = (await res.json()) as ListResponse;
      setComments(data.comments);
      setError(null);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  }, [slideId]);

  const add = useCallback(
    async (input: AddCommentInput) => {
      const res = await fetch('/__comments/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, ...input }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `POST /__comments/add → ${res.status}`);
      }
      await refetch();
    },
    [slideId, refetch],
  );

  const update = useCallback(
    async (id: string, text: string) => {
      const res = await fetch(`/__comments/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, text }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `PUT /__comments/${id} → ${res.status}`);
      }
      await refetch();
    },
    [slideId, refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/__comments/${id}?slideId=${encodeURIComponent(slideId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`DELETE /__comments/${id} → ${res.status}`);
      await refetch();
    },
    [slideId, refetch],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = () => refetch();
    import.meta.hot.on('vite:afterUpdate', handler);
    return () => {
      import.meta.hot?.off('vite:afterUpdate', handler);
    };
  }, [refetch]);

  return { comments, error, add, update, remove };
}
