export type NoteInline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: NoteInline[] }
  | { type: 'em'; children: NoteInline[] }
  | { type: 'code'; text: string };

export type NoteListItem = { content: NoteInline[]; children: NoteBlock[] };

export type NoteBlock =
  | { type: 'paragraph'; lines: NoteInline[][] }
  | { type: 'heading'; level: 1 | 2 | 3; children: NoteInline[] }
  | { type: 'list'; ordered: boolean; start: number; items: NoteListItem[] }
  | { type: 'rule' };

const HEADING = /^(#{1,3})\s+(.*)$/;
const RULE = /^(?:-[ \t]*){3,}$|^(?:\*[ \t]*){3,}$|^(?:_[ \t]*){3,}$/;
// Ordered before the single-star branch so `**bold**` never parses as
// empty italics. Emphasis content must start and end with non-whitespace
// (CommonMark) so spaced stars like `2 * 3 … 5 * 4` never pair up, and `_`
// needs word boundaries to leave snake_case alone.
const INLINE =
  /`([^`\n]+)`|\*\*(\S(?:[^\n]*?\S)?)\*\*|\*([^\s*](?:[^*\n]*[^\s*])?)\*|(?<![\w])_([^\s_](?:[^_\n]*[^\s_])?)_(?![\w])/g;

// Backslash-escaped punctuation is swapped for private-use characters before
// any block or inline matching, so an escaped delimiter can never open or
// close anything. Leaves swap them back — code spans keep the backslash,
// matching CommonMark's "no escapes inside code" rule.
const ESCAPABLE = '\\`*_#-.)';
const ESCAPE = /\\([\\`*_#\-.)])/g;
const HIDDEN = /[-]/g;

function hideEscapes(text: string): string {
  return text
    .replace(HIDDEN, '')
    .replace(ESCAPE, (_, ch: string) => String.fromCharCode(0xe000 + ESCAPABLE.indexOf(ch)));
}

function restoreEscapes(text: string, keepBackslash: boolean): string {
  return text.replace(HIDDEN, (ch) => {
    const original = ESCAPABLE[ch.charCodeAt(0) - 0xe000];
    return keepBackslash ? `\\${original}` : original;
  });
}

type ListMarker = { ordered: boolean; start: number; indent: number; content: string };

function indentOf(line: string): number {
  let width = 0;
  for (const ch of line) {
    if (ch === ' ') width++;
    else if (ch === '\t') width += 4 - (width % 4);
    else break;
  }
  return width;
}

function matchListItem(line: string): ListMarker | null {
  const indent = indentOf(line);
  const unordered = /^\s*[-*]\s+(.*)$/.exec(line);
  if (unordered) return { ordered: false, start: 1, indent, content: unordered[1] };
  const ordered = /^\s*(\d{1,3})[.)]\s+(.*)$/.exec(line);
  if (ordered) return { ordered: true, start: Number(ordered[1]), indent, content: ordered[2] };
  return null;
}

function isBlank(line: string | undefined): boolean {
  return line === undefined || line.trim() === '';
}

function dedent(lines: string[]): string[] {
  const depth = Math.min(...lines.filter((l) => !isBlank(l)).map(indentOf));
  return lines.map((l) => {
    let cut = 0;
    while (/[ \t]/.test(l[cut] ?? '') && indentOf(l.slice(0, cut + 1)) <= depth) cut++;
    return l.slice(cut);
  });
}

function parseInlineHidden(text: string): NoteInline[] {
  const out: NoteInline[] = [];
  const pushText = (raw: string) => {
    if (raw) out.push({ type: 'text', text: restoreEscapes(raw, false) });
  };
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    pushText(text.slice(last, m.index));
    if (m[1] !== undefined) out.push({ type: 'code', text: restoreEscapes(m[1], true) });
    else if (m[2] !== undefined) out.push({ type: 'strong', children: parseInlineHidden(m[2]) });
    else out.push({ type: 'em', children: parseInlineHidden(m[3] ?? m[4]) });
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return out;
}

export function parseInline(text: string): NoteInline[] {
  return parseInlineHidden(hideEscapes(text));
}

function parseList(lines: string[], from: number): { block: NoteBlock; next: number } {
  const first = matchListItem(lines[from]) as ListMarker;
  const items: NoteListItem[] = [];
  let i = from;
  while (i < lines.length) {
    const marker = matchListItem(lines[i]);
    if (!marker || marker.ordered !== first.ordered || marker.indent > first.indent) break;
    i++;
    // Anything indented past the marker belongs to the item, so loosely
    // indented agent output (two spaces under `1.`) still nests.
    const body: string[] = [];
    while (i < lines.length) {
      if (isBlank(lines[i])) {
        let peek = i;
        while (isBlank(lines[peek]) && peek < lines.length) peek++;
        if (peek < lines.length && indentOf(lines[peek]) > marker.indent) {
          body.push(...lines.slice(i, peek));
          i = peek;
          continue;
        }
        break;
      }
      if (indentOf(lines[i]) <= marker.indent) break;
      body.push(lines[i]);
      i++;
    }
    items.push({
      content: parseInlineHidden(marker.content.trim()),
      children: body.length ? parseBlocks(dedent(body)) : [],
    });
    let peek = i;
    while (isBlank(lines[peek]) && peek < lines.length) peek++;
    const sibling = peek < lines.length ? matchListItem(lines[peek]) : null;
    if (sibling && sibling.ordered === first.ordered && sibling.indent <= first.indent) i = peek;
  }
  return {
    block: { type: 'list', ordered: first.ordered, start: first.start, items },
    next: i,
  };
}

function startsBlock(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || HEADING.test(trimmed) || RULE.test(trimmed) || !!matchListItem(line);
}

function parseBlocks(lines: string[]): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === '') {
      i++;
      continue;
    }
    const heading = HEADING.exec(trimmed);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        children: parseInlineHidden(heading[2].trim()),
      });
      i++;
      continue;
    }
    if (RULE.test(trimmed)) {
      blocks.push({ type: 'rule' });
      i++;
      continue;
    }
    if (matchListItem(lines[i])) {
      const { block, next } = parseList(lines, i);
      blocks.push(block);
      i = next;
      continue;
    }
    // Paragraph lines keep leading whitespace (rendered with pre-wrap) so
    // plain-text notes don't lose manual indentation or spacing.
    const paragraph = [parseInlineHidden(lines[i].trimEnd())];
    i++;
    while (i < lines.length && !startsBlock(lines[i])) {
      paragraph.push(parseInlineHidden(lines[i].trimEnd()));
      i++;
    }
    blocks.push({ type: 'paragraph', lines: paragraph });
  }
  return blocks;
}

export function parseNoteMarkdown(text: string): NoteBlock[] {
  return parseBlocks(hideEscapes(text).split('\n'));
}
