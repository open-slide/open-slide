export type Revision = { id: string; slideId: string; before: string; after: string };

export type RestoreResult =
  | { ok: true; source: string }
  | { ok: false; status: number; error: string };

const DEFAULT_LIMIT = 60;

// Remembers what each editor write replaced so the client can undo or redo a
// write after it has landed on disk. Restoring only succeeds while the file
// still holds the exact content that revision left behind, so an agent or a
// hand edit in between is never silently overwritten.
export class RevisionJournal {
  private readonly bySlide = new Map<string, Revision[]>();
  private counter = 0;

  constructor(private readonly limit = DEFAULT_LIMIT) {}

  record(slideId: string, before: string, after: string): string {
    const list = this.bySlide.get(slideId) ?? [];
    const last = list.at(-1);
    // Consecutive writes usually chain; reuse the previous string so a long
    // session holds roughly one copy of the file per revision, not two.
    const shared = last && last.after === before ? last.after : before;
    const id = `r${Date.now().toString(36)}-${(++this.counter).toString(36)}`;
    list.push({ id, slideId, before: shared, after });
    if (list.length > this.limit) list.splice(0, list.length - this.limit);
    this.bySlide.set(slideId, list);
    return id;
  }

  restore(slideId: string, id: string, direction: 'undo' | 'redo', current: string): RestoreResult {
    const revision = this.bySlide.get(slideId)?.find((entry) => entry.id === id);
    if (!revision) return { ok: false, status: 410, error: 'this change is no longer in history' };
    const expected = direction === 'undo' ? revision.after : revision.before;
    if (current !== expected) {
      return { ok: false, status: 409, error: 'the file changed outside the editor' };
    }
    return { ok: true, source: direction === 'undo' ? revision.before : revision.after };
  }
}
