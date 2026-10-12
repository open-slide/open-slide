import * as t from '@babel/types';
import { shortId } from '../files/short-id.ts';
import { findJsxAncestors, type JsxContainer, parseSource } from './babel-walk.ts';

const MARKER_RE =
  /\{\/\*\s*@slide-comment\s+id="(c-[a-f0-9]+)"\s+ts="([^"]+)"\s+text="([A-Za-z0-9_-]+={0,2})"\s*\*\/\}/;

export type CommentRect = { x: number; y: number; w: number; h: number };
export type CommentTarget = { line: number; column: number };
export type CommentPayload = { note: string; hint?: string; rect?: CommentRect; page?: number };

export type Comment = {
  id: string;
  line: number;
  ts: string;
  note: string;
  hint?: string;
  rect?: CommentRect;
  page?: number;
  // Source location of the JSX element the marker sits in, matching the
  // `data-slide-loc` the loc-tags plugin stamps on the rendered element.
  target?: CommentTarget | null;
};

export function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function parseCommentRect(value: unknown): CommentRect | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { x, y, w, h } = value as Record<string, unknown>;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(w) || !isFiniteNumber(h))
    return undefined;
  if (w <= 0 || h <= 0) return undefined;
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

export function parseCommentPage(value: unknown): number | undefined {
  return isFiniteNumber(value) && value >= 0 ? Math.floor(value) : undefined;
}

export function parseMarkers(source: string): Comment[] {
  const comments: Comment[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(MARKER_RE);
    if (!m) continue;
    const [, id, ts, textB64] = m;
    try {
      const payload = JSON.parse(b64urlDecode(textB64)) as CommentPayload;
      comments.push({
        id,
        line: i + 1,
        ts,
        note: payload.note,
        hint: payload.hint,
        rect: parseCommentRect(payload.rect),
        page: parseCommentPage(payload.page),
      });
    } catch {}
  }
  return comments;
}

function markerColumn(source: string, line: number): number {
  const text = source.split('\n')[line - 1] ?? '';
  const index = text.search(/\{\/\*\s*@slide-comment/);
  return index === -1 ? 0 : index;
}

export function resolveTargets(source: string, comments: Comment[]): Comment[] {
  const ast = parseSource(source);
  return comments.map((comment) => {
    if (!ast) return { ...comment, target: null };
    const column = markerColumn(source, comment.line);
    const element = findJsxAncestors(ast, comment.line, column).find((node) =>
      t.isJSXElement(node),
    );
    const start = element?.loc?.start;
    return { ...comment, target: start ? { line: start.line, column: start.column } : null };
  });
}

export function newCommentId(): string {
  return shortId('c');
}

export function markerDeleteRegex(id: string): RegExp {
  return new RegExp(
    `\\{\\/\\*\\s*@slide-comment\\s+id="${id}"\\s+ts="[^"]+"\\s+text="[A-Za-z0-9_\\-]+={0,2}"\\s*\\*\\/\\}`,
  );
}

// We always splice the marker as the first child of a JSX container.
// A JSX-comment-like token outside JSX context (e.g. as the body of
// `() => ( <Foo/> )`) is parsed as an empty object literal and breaks
// the surrounding expression.
// `breakAfter` is set when content follows the opening tag on the same
// line, so the marker gets a line of its own instead of gluing onto that
// content (deleting the marker line would otherwise take the content too).
export type InsertionPlan = { offset: number; indent: string; breakAfter: boolean };

function lineToOffset(source: string, line: number): number {
  let off = 0;
  for (let l = 1; l < line; l++) {
    const nl = source.indexOf('\n', off);
    if (nl === -1) return source.length;
    off = nl + 1;
  }
  return off;
}

function lineIndent(source: string, lineNumber: number): string {
  const start = lineToOffset(source, lineNumber);
  const m = source.slice(start, start + 200).match(/^[ \t]*/);
  return m?.[0] ?? '';
}

function planInsertion(source: string, target: JsxContainer): InsertionPlan | null {
  if (t.isJSXElement(target) && target.openingElement.selfClosing) return null;
  const opening = t.isJSXFragment(target) ? target.openingFragment : target.openingElement;
  const offset = opening.end ?? 0;
  return {
    offset,
    indent: `${lineIndent(source, target.loc?.start.line ?? 1)}  `,
    breakAfter: !/^[ \t]*\r?\n/.test(source.slice(offset)),
  };
}

export function buildMarker(
  plan: InsertionPlan,
  id: string,
  ts: string,
  encodedText: string,
): string {
  const marker = `\n${plan.indent}{/* @slide-comment id="${id}" ts="${ts}" text="${encodedText}" */}`;
  return plan.breakAfter ? `${marker}\n${plan.indent}` : marker;
}

export function updateMarkerNote(source: string, id: string, note: string): string | null {
  const re = new RegExp(
    `(\\{\\/\\*\\s*@slide-comment\\s+id="${id}"\\s+ts="[^"]+"\\s+text=")([A-Za-z0-9_\\-]+={0,2})("\\s*\\*\\/\\})`,
  );
  const m = source.match(re);
  if (!m) return null;
  let payload: CommentPayload;
  try {
    payload = JSON.parse(b64urlDecode(m[2])) as CommentPayload;
  } catch {
    return null;
  }
  const encoded = b64urlEncode(JSON.stringify({ ...payload, note }));
  return source.replace(re, `$1${encoded}$3`);
}

// Strips just the marker token; the line only goes away when nothing
// else was on it, so content that shares the line survives.
export function removeMarker(source: string, id: string): string | null {
  const lines = source.split('\n');
  const idRe = markerDeleteRegex(id);
  const hit = lines.findIndex((line) => idRe.test(line));
  if (hit === -1) return null;
  const stripped = lines[hit].replace(idRe, '');
  if (stripped.trim() === '') lines.splice(hit, 1);
  else lines[hit] = stripped;
  return lines.join('\n');
}

// Walk innermost → outermost looking for the first JSX container we
// can insert *inside* (not self-closing). Self-closing elements like
// `<img/>` get hoisted to their nearest non-self-closing ancestor.
export function findInsertion(
  source: string,
  line: number,
  column: number | undefined,
): InsertionPlan | null {
  const ast = parseSource(source);
  if (!ast) return null;

  const col = column ?? 0;
  const ancestors = findJsxAncestors(ast, line, col);
  for (const node of ancestors) {
    const plan = planInsertion(source, node);
    if (plan) return plan;
  }
  return null;
}

export function offsetToLine(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}
