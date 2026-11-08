import { describe, expect, it } from 'vitest';
import { RevisionJournal } from './revisions.ts';

describe('RevisionJournal', () => {
  it('undoes and redoes a recorded write', () => {
    const journal = new RevisionJournal();
    const id = journal.record('deck', 'a', 'b');
    expect(journal.restore('deck', id, 'undo', 'b')).toEqual({ ok: true, source: 'a' });
    expect(journal.restore('deck', id, 'redo', 'a')).toEqual({ ok: true, source: 'b' });
  });

  it('refuses when the file no longer matches the revision', () => {
    const journal = new RevisionJournal();
    const id = journal.record('deck', 'a', 'b');
    const result = journal.restore('deck', id, 'undo', 'b + agent edit');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it('scopes revisions to their slide', () => {
    const journal = new RevisionJournal();
    const id = journal.record('deck', 'a', 'b');
    expect(journal.restore('other', id, 'undo', 'b').ok).toBe(false);
  });

  it('forgets the oldest revisions past the limit', () => {
    const journal = new RevisionJournal(2);
    const first = journal.record('deck', '0', '1');
    journal.record('deck', '1', '2');
    const third = journal.record('deck', '2', '3');
    const result = journal.restore('deck', first, 'undo', '1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(410);
    expect(journal.restore('deck', third, 'undo', '3')).toEqual({ ok: true, source: '2' });
  });
});
