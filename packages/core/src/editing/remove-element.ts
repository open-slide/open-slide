import * as t from '@babel/types';
import { parseSource, walkAll } from './babel-walk.ts';
import {
  applySplices,
  ELEMENT_OP_KINDS,
  findEnclosingComponent,
  findEnclosingMapCallback,
  findJsxByStart,
  type Splice,
} from './edit-ops.ts';

export type ElementOp =
  | { kind: 'remove-element'; instanceCount?: number }
  | { kind: 'restore-element'; offset: number; text: string };

export type ElementRefusal =
  | 'not-found'
  | 'root'
  | 'expression'
  | 'conditional'
  | 'map'
  | 'shared'
  | 'comment'
  | 'stale';

export type RemovedSource = { offset: number; text: string };

export type ElementEditResult =
  | { ok: true; source: string; removed?: RemovedSource }
  | { ok: false; status: number; error: string; code?: ElementRefusal };

export function isElementOp(op: { kind: string }): op is ElementOp {
  return ELEMENT_OP_KINDS.has(op.kind);
}

const REFUSALS: Record<ElementRefusal, string> = {
  'not-found': 'no JSX element starts at this location',
  root: 'the page or component root cannot be removed',
  expression: 'the element is inside a JSX expression, not a list of JSX children',
  conditional: 'the element is rendered conditionally',
  map: 'the element is rendered by a .map() callback',
  shared: 'the element is rendered more than once, so removing it would remove every copy',
  comment: 'the element contains an inspector comment',
  stale: 'the slide source changed since the element was removed',
};

function refuse(code: ElementRefusal, status = 422): ElementEditResult {
  return { ok: false, status, error: REFUSALS[code], code };
}

function findParent(ast: t.Node, target: t.Node): t.Node | null {
  let parent: t.Node | null = null;
  walkAll(ast, (node) => {
    for (const value of Object.values(node)) {
      if (value === target || (Array.isArray(value) && value.includes(target))) {
        parent = node;
        return 'stop';
      }
    }
  });
  return parent;
}

// A component defined in this file and rendered at more than one call site
// shares its JSX, so removing from it removes from every call site.
function isReusedComponent(ast: t.File, element: t.JSXElement): boolean {
  const component = findEnclosingComponent(ast, element);
  if (!component) return false;
  let uses = 0;
  walkAll(ast, (node) => {
    if (!t.isJSXOpeningElement(node)) return;
    if (t.isJSXIdentifier(node.name) && node.name.name === component.name) uses++;
  });
  return uses > 1;
}

function guardRemoval(
  ast: t.File,
  source: string,
  element: t.JSXElement,
  instanceCount: number,
): t.JSXElement | t.JSXFragment | ElementRefusal {
  const parent = findParent(ast, element);
  if (t.isLogicalExpression(parent) || t.isConditionalExpression(parent)) return 'conditional';
  if (findEnclosingMapCallback(ast, element)) return 'map';
  if (!t.isJSXElement(parent) && !t.isJSXFragment(parent)) {
    return t.isReturnStatement(parent) ||
      t.isArrowFunctionExpression(parent) ||
      t.isVariableDeclarator(parent)
      ? 'root'
      : 'expression';
  }
  if (instanceCount > 1 || isReusedComponent(ast, element)) return 'shared';
  if (source.slice(element.start ?? 0, element.end ?? 0).includes('@slide-comment')) {
    return 'comment';
  }
  return parent;
}

function isHorizontalSpace(char: string | undefined): boolean {
  return char === ' ' || char === '\t';
}

// JSX drops whitespace runs that hold a newline, so `Hello\n<b/>\nworld`
// renders `Helloworld`. Removing only `<b/>`'s line would leave
// `Hello\nworld`, which JSX joins with a space; joining the texts keeps it.
function textJoinSplice(children: t.Node[], element: t.Node): Splice | null {
  const index = children.indexOf(element);
  const before = children[index - 1];
  const after = children[index + 1];
  if (!t.isJSXText(before) || !t.isJSXText(after)) return null;
  const trailing = before.value.match(/[ \t\r\n]*$/)?.[0] ?? '';
  const leading = after.value.match(/^[ \t\r\n]*/)?.[0] ?? '';
  if (trailing.length === before.value.length || leading.length === after.value.length) return null;
  if (!trailing.includes('\n') || !leading.includes('\n')) return null;
  return {
    from: (before.end ?? 0) - trailing.length,
    to: (after.start ?? 0) + leading.length,
    text: '',
  };
}

// An element alone on its line(s) takes its indentation and trailing newline
// with it. Inline, it takes one of the surrounding space runs: `a <b/> c` → `a c`.
export function removalSplice(source: string, element: t.Node, siblings: t.Node[] = []): Splice {
  const joined = textJoinSplice(siblings, element);
  if (joined) return joined;
  const start = element.start ?? 0;
  const end = element.end ?? 0;
  const lineStart = source.lastIndexOf('\n', start - 1) + 1;
  const newline = source.indexOf('\n', end);
  const lineEnd = newline === -1 ? source.length : newline;
  if (
    /^[ \t]*$/.test(source.slice(lineStart, start)) &&
    /^[ \t]*$/.test(source.slice(end, lineEnd))
  ) {
    return { from: lineStart, to: newline === -1 ? lineEnd : newline + 1, text: '' };
  }
  if (!isHorizontalSpace(source[start - 1])) return { from: start, to: end, text: '' };
  let to = end;
  while (isHorizontalSpace(source[to])) to++;
  return { from: start, to, text: '' };
}

function removeElement(
  source: string,
  line: number,
  column: number,
  instanceCount: number,
): ElementEditResult {
  const ast = parseSource(source);
  if (!ast) return { ok: false, status: 422, error: 'could not parse source' };
  const element = findJsxByStart(ast, line, column);
  if (!element) return refuse('not-found');
  const parent = guardRemoval(ast, source, element, instanceCount);
  if (typeof parent === 'string') return refuse(parent);
  const splice = removalSplice(source, element, parent.children);
  const result = applySplices(source, [splice]);
  if (!result.ok) return result;
  return {
    ok: true,
    source: result.source,
    removed: { offset: splice.from, text: source.slice(splice.from, splice.to) },
  };
}

// Undo re-inserts the exact removed bytes, then checks they put an element
// back at its original location.
function restoreElement(
  source: string,
  line: number,
  column: number,
  offset: number,
  text: string,
): ElementEditResult {
  if (!Number.isInteger(offset) || offset < 0 || offset > source.length || !text) {
    return refuse('stale', 409);
  }
  const result = applySplices(source, [{ from: offset, to: offset, text }]);
  if (!result.ok) return refuse('stale', 409);
  const ast = parseSource(result.source);
  const element = ast && findJsxByStart(ast, line, column);
  if (!element || (element.start ?? 0) < offset || (element.end ?? 0) > offset + text.length) {
    return refuse('stale', 409);
  }
  return result;
}

export function applyElementOp(
  source: string,
  line: number,
  column: number,
  op: ElementOp,
): ElementEditResult {
  if (op.kind === 'restore-element') {
    return restoreElement(source, line, column, op.offset, op.text);
  }
  const { instanceCount } = op;
  return removeElement(
    source,
    line,
    column,
    typeof instanceCount === 'number' && Number.isInteger(instanceCount) ? instanceCount : 1,
  );
}

export function staleElementEdit(): ElementEditResult {
  return refuse('stale', 409);
}
