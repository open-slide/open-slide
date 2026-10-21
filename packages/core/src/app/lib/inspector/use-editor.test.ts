import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({ useCallback: <T>(fn: T) => fn }));

const { useEditor } = await import('./use-editor.ts');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('applyEdits', () => {
  it('reports earlier groups when a later group fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ ok: true }] }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'boom' }) });
    vi.stubGlobal('fetch', fetchMock);
    const { applyEdits } = useEditor('demo');
    const results = await applyEdits([
      { file: 'index.tsx', line: 1, column: 0, ops: [] },
      { file: 'pages/01-a.tsx', line: 2, column: 0, ops: [] },
    ]);
    expect(results).toEqual([{ ok: true }, { ok: false, error: 'boom' }]);
  });

  it('throws when no group could be sent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { applyEdits } = useEditor('demo');
    await expect(applyEdits([{ file: 'index.tsx', line: 1, column: 0, ops: [] }])).rejects.toThrow(
      'offline',
    );
  });
});
