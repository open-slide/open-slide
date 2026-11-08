import * as t from '@babel/types';
import { parseSource, walkAll } from './babel-walk.ts';
import {
  applyEdit,
  applySplices,
  collectTopLevelIdentifiers,
  findImports,
  findJsxByStart,
  jsString,
  planAssetImport,
  type Splice,
} from './edit-ops.ts';

export type ElementLoc = { line: number; column: number };
export type StyleMap = Record<string, string | number>;

export const SHAPE_KINDS = [
  'rect',
  'ellipse',
  'triangle',
  'right-triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'star',
  'arrow',
  'chevron',
  'callout',
  'line',
  'line-arrow',
] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

export type ElementSpec =
  | { type: 'text'; text: string; style: StyleMap }
  | {
      type: 'shape';
      kind: ShapeKind;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      style: StyleMap;
    }
  | { type: 'image'; assetPath: string; alt?: string; style: StyleMap }
  | { type: 'jsx'; code: string; style?: StyleMap };

export type StructureOp =
  | { kind: 'insert'; pageIndex: number; element: ElementSpec }
  | { kind: 'delete'; targets: ElementLoc[] }
  | { kind: 'duplicate'; targets: ElementLoc[]; style?: StyleMap }
  | { kind: 'group'; targets: ElementLoc[]; style: StyleMap; childStyles?: StyleMap[] }
  | { kind: 'ungroup'; target: ElementLoc; childStyles?: StyleMap[] };

export type StructureResult =
  | { ok: true; source: string; created: ElementLoc[] }
  | { ok: false; status: number; error: string };

export type CopyResult =
  | { ok: true; snippets: string[] }
  | { ok: false; status: number; error: string };

const CORE_MODULE = '@open-slide/core';

function fail(error: string, status = 422): { ok: false; status: number; error: string } {
  return { ok: false, status, error };
}

function isIdentifierName(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function formatStyleValue(value: string | number): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : jsString(String(value));
}

export function formatStyleObject(style: StyleMap): string {
  const entries = Object.entries(style).filter(([key]) => isIdentifierName(key));
  if (entries.length === 0) return '{}';
  return `{ ${entries.map(([key, value]) => `${key}: ${formatStyleValue(value)}`).join(', ')} }`;
}

function styleOps(style: StyleMap | undefined) {
  return Object.entries(style ?? {})
    .filter(([key]) => isIdentifierName(key))
    .map(([key, value]) => ({ kind: 'set-style' as const, key, value: String(value) }));
}

// Rewrites the root element's `style` in a standalone snippet, reusing the
// regular set-style planner by parking the snippet at a known location.
function withStyle(code: string, style: StyleMap | undefined): string | { error: string } {
  const ops = styleOps(style);
  if (ops.length === 0) return code;
  const head = 'const __snippet = (\n';
  const tail = '\n);\n';
  const result = applyEdit(`${head}${code}${tail}`, 2, 0, ops);
  if (!result.ok) return { error: result.error };
  return result.source.slice(head.length, result.source.length - tail.length);
}

function formatJsxText(text: string): string {
  const lines = text.split('\n');
  return lines
    .map((line, index) => {
      const safe = /^[^{}<>]*$/.test(line) && line.trim() === line && line.length > 0;
      const body = safe ? line : `{${jsString(line)}}`;
      return index < lines.length - 1 ? `${body}<br />` : body;
    })
    .join('');
}

function lineStart(source: string, offset: number): number {
  return source.lastIndexOf('\n', offset - 1) + 1;
}

function indentAt(source: string, offset: number): string {
  const start = lineStart(source, offset);
  return /^[ \t]*/.exec(source.slice(start, offset))?.[0] ?? '';
}

function templateRanges(ast: t.Node): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  walkAll(ast, (node) => {
    if (t.isTemplateLiteral(node) && node.start != null && node.end != null) {
      ranges.push([node.start, node.end]);
    }
  });
  return ranges;
}

// Shifts every line of `text` after the first by `delta` spaces (negative
// strips), leaving lines that start inside a template literal untouched so
// multi-line strings keep their exact contents.
function reindent(
  text: string,
  delta: number,
  ranges: Array<[number, number]> = [],
  base = 0,
): string {
  if (delta === 0) return text;
  let out = '';
  let offset = 0;
  for (const [index, line] of text.split('\n').entries()) {
    const at = base + offset;
    offset += line.length + 1;
    if (index === 0 || ranges.some(([from, to]) => at > from && at < to)) {
      out += index === 0 ? line : `\n${line}`;
      continue;
    }
    const shifted =
      delta > 0
        ? line.length > 0
          ? ' '.repeat(delta) + line
          : line
        : line.replace(new RegExp(`^ {0,${-delta}}`), '');
    out += `\n${shifted}`;
  }
  return out;
}

function snippetRanges(code: string): Array<[number, number]> {
  const ast = parseSource(`<>${code}</>`);
  if (!ast) return [];
  return templateRanges(ast).map(([from, to]) => [from - 2, to - 2]);
}

function minIndent(text: string): number {
  let min = Number.POSITIVE_INFINITY;
  for (const line of text.split('\n').slice(1)) {
    if (!line.trim()) continue;
    min = Math.min(min, /^ */.exec(line)?.[0].length ?? 0);
  }
  return Number.isFinite(min) ? min : 0;
}

function placeSnippet(code: string, indent: string): string {
  const trimmed = code.trim();
  const ranges = snippetRanges(trimmed);
  const normalized = reindent(trimmed, -minIndent(trimmed), ranges);
  return reindent(normalized, indent.length, snippetRanges(normalized));
}

type Unwrapped = t.Expression | null | undefined;

function unwrapTs(node: Unwrapped): Unwrapped {
  let current = node;
  while (
    current &&
    (t.isTSAsExpression(current) ||
      t.isTSSatisfiesExpression(current) ||
      t.isTSNonNullExpression(current) ||
      t.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function defaultExportPages(ast: t.File): Array<t.Node | null> | null {
  for (const node of ast.program.body) {
    if (!t.isExportDefaultDeclaration(node)) continue;
    const declaration = node.declaration;
    if (!t.isExpression(declaration)) return null;
    const inner = unwrapTs(declaration);
    if (!t.isArrayExpression(inner)) return null;
    return inner.elements;
  }
  return null;
}

type FunctionLike = t.ArrowFunctionExpression | t.FunctionExpression | t.FunctionDeclaration;

function resolvePageFunction(ast: t.File, node: t.Node | null): FunctionLike | null {
  if (!node) return null;
  const expr = t.isExpression(node) ? unwrapTs(node) : null;
  if (t.isArrowFunctionExpression(expr) || t.isFunctionExpression(expr)) return expr;
  if (!t.isIdentifier(expr)) return null;
  const name = expr.name;
  for (const statement of ast.program.body) {
    const decl =
      t.isExportNamedDeclaration(statement) && statement.declaration
        ? statement.declaration
        : statement;
    if (t.isFunctionDeclaration(decl) && decl.id?.name === name) return decl;
    if (!t.isVariableDeclaration(decl)) continue;
    for (const declarator of decl.declarations) {
      if (!t.isIdentifier(declarator.id) || declarator.id.name !== name) continue;
      const init = unwrapTs(declarator.init);
      if (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init)) return init;
    }
  }
  return null;
}

function returnedJsx(fn: FunctionLike): t.JSXElement | t.JSXFragment | null {
  if (!t.isBlockStatement(fn.body)) {
    const body = unwrapTs(fn.body);
    return t.isJSXElement(body) || t.isJSXFragment(body) ? body : null;
  }
  for (let index = fn.body.body.length - 1; index >= 0; index--) {
    const statement = fn.body.body[index];
    if (!t.isReturnStatement(statement)) continue;
    const arg = unwrapTs(statement.argument);
    return t.isJSXElement(arg) || t.isJSXFragment(arg) ? arg : null;
  }
  return null;
}

export function findPageRoot(ast: t.File, pageIndex: number): t.JSXElement | t.JSXFragment | null {
  const pages = defaultExportPages(ast);
  if (!pages || pageIndex < 0 || pageIndex >= pages.length) return null;
  const fn = resolvePageFunction(ast, pages[pageIndex]);
  return fn ? returnedJsx(fn) : null;
}

function isWhitespaceText(node: t.Node): boolean {
  return t.isJSXText(node) && node.value.trim() === '';
}

function appendChildSplice(
  source: string,
  container: t.JSXElement | t.JSXFragment,
  code: string,
): { splice: Splice; codeOffset: number } {
  const indent = indentAt(source, container.start ?? 0);
  const childIndent = `${indent}  `;
  const placed = placeSnippet(code, childIndent);
  if (t.isJSXElement(container) && container.openingElement.selfClosing) {
    const opening = container.openingElement;
    const end = opening.end ?? 0;
    // Drop the `/>` (and any space before it) and close the tag explicitly.
    let cut = end - 2;
    while (cut > 0 && /\s/.test(source[cut - 1] ?? '')) cut--;
    const name = source.slice(opening.name.start ?? 0, opening.name.end ?? 0);
    const prefix = `>\n${childIndent}`;
    return {
      splice: { from: cut, to: end, text: `${prefix}${placed}\n${indent}</${name}>` },
      codeOffset: cut + prefix.length,
    };
  }
  const children = container.children.filter((child) => !isWhitespaceText(child));
  const last = children.at(-1);
  const opening = t.isJSXElement(container) ? container.openingElement : container.openingFragment;
  const closing = t.isJSXElement(container) ? container.closingElement : container.closingFragment;
  const at = last ? (last.end ?? 0) : (opening.end ?? 0);
  const prefix = `\n${childIndent}`;
  const closesOnSameLine = !source.slice(at, closing?.start ?? at).includes('\n');
  const suffix = closesOnSameLine ? `\n${indent}` : '';
  return {
    splice: { from: at, to: at, text: `${prefix}${placed}${suffix}` },
    codeOffset: at + prefix.length,
  };
}

function wrapInFragmentSplice(
  source: string,
  ast: t.File,
  root: t.JSXElement,
  code: string,
): { splice: Splice; codeOffset: number } {
  const start = root.start ?? 0;
  const end = root.end ?? 0;
  const indent = indentAt(source, start);
  const ranges = templateRanges(ast);
  const body = reindent(source.slice(start, end), 2, ranges, start);
  const childIndent = `${indent}  `;
  const head = `<>\n${childIndent}${body}\n${childIndent}`;
  return {
    splice: {
      from: start,
      to: end,
      text: `${head}${placeSnippet(code, childIndent)}\n${indent}</>`,
    },
    codeOffset: start + head.length,
  };
}

function coreImportSplice(
  ast: t.File,
  source: string,
  name: string,
): Splice | { error: string } | null {
  const imports = findImports(ast);
  for (const imp of imports) {
    for (const spec of imp.node.specifiers) {
      if (spec.local.name !== name) continue;
      if (
        imp.source === CORE_MODULE &&
        t.isImportSpecifier(spec) &&
        t.isIdentifier(spec.imported) &&
        spec.imported.name === name &&
        imp.node.importKind !== 'type' &&
        spec.importKind !== 'type'
      ) {
        return null;
      }
      return { error: `\`${name}\` is already imported from ${imp.source}` };
    }
  }
  if (topLevelBindings(ast).has(name)) return { error: `\`${name}\` is already declared` };
  const core = imports.find((imp) => imp.source === CORE_MODULE && imp.node.importKind !== 'type');
  if (core) {
    const named = core.node.specifiers.filter((spec) => t.isImportSpecifier(spec));
    const last = named.at(-1);
    if (last) {
      return { from: last.end ?? 0, to: last.end ?? 0, text: `, ${name}` };
    }
  }
  const last = imports.at(-1);
  const at = last ? (last.node.end ?? 0) : 0;
  const statement = `import { ${name} } from '${CORE_MODULE}';`;
  if (!last) return { from: 0, to: 0, text: `${statement}\n` };
  const nextLine = source.indexOf('\n', at);
  return { from: at, to: at, text: `\n${statement}${nextLine === -1 ? '\n' : ''}` };
}

function topLevelBindings(ast: t.File): Set<string> {
  const names = collectTopLevelIdentifiers(ast);
  const addPattern = (node: t.Node | null | undefined) => {
    if (!node) return;
    if (t.isIdentifier(node)) names.add(node.name);
    else if (t.isObjectPattern(node)) {
      for (const prop of node.properties) {
        if (t.isRestElement(prop)) addPattern(prop.argument);
        else addPattern(prop.value as t.Node);
      }
    } else if (t.isArrayPattern(node)) {
      for (const element of node.elements) addPattern(element);
    } else if (t.isAssignmentPattern(node)) addPattern(node.left);
    else if (t.isRestElement(node)) addPattern(node.argument);
  };
  for (const statement of ast.program.body) {
    const decl =
      (t.isExportNamedDeclaration(statement) || t.isExportDefaultDeclaration(statement)) &&
      statement.declaration
        ? statement.declaration
        : statement;
    if ((t.isFunctionDeclaration(decl) || t.isClassDeclaration(decl)) && decl.id) {
      names.add(decl.id.name);
    } else if (t.isVariableDeclaration(decl)) {
      for (const declarator of decl.declarations) addPattern(declarator.id);
    } else if (t.isTSEnumDeclaration(decl)) {
      names.add(decl.id.name);
    }
  }
  return names;
}

function buildElementCode(
  ast: t.File,
  source: string,
  spec: ElementSpec,
): { code: string; imports: Splice[] } | { error: string } {
  if (spec.type === 'text') {
    return {
      code: `<div style={${formatStyleObject(spec.style)}}>${formatJsxText(spec.text || ' ')}</div>`,
      imports: [],
    };
  }
  if (spec.type === 'shape') {
    if (!SHAPE_KINDS.includes(spec.kind)) return { error: `unknown shape kind: ${spec.kind}` };
    const attrs = [`kind="${spec.kind}"`];
    if (spec.fill) attrs.push(`fill=${jsxStringAttr(spec.fill)}`);
    if (spec.stroke) attrs.push(`stroke=${jsxStringAttr(spec.stroke)}`);
    if (spec.strokeWidth != null && Number.isFinite(spec.strokeWidth)) {
      attrs.push(`strokeWidth={${spec.strokeWidth}}`);
    }
    attrs.push(`style={${formatStyleObject(spec.style)}}`);
    const importSplice = coreImportSplice(ast, source, 'Shape');
    if (importSplice && 'error' in importSplice) return importSplice;
    return { code: `<Shape ${attrs.join(' ')} />`, imports: importSplice ? [importSplice] : [] };
  }
  if (spec.type === 'image') {
    if (!spec.assetPath.startsWith('./assets/') && !spec.assetPath.startsWith('@assets/')) {
      return { error: 'asset path must start with ./assets/ or @assets/' };
    }
    const { identifier, importSplice } = planAssetImport(ast, spec.assetPath);
    return {
      code: `<img src={${identifier}} alt=${jsxStringAttr(spec.alt ?? '')} style={${formatStyleObject(spec.style)}} />`,
      imports: importSplice ? [importSplice] : [],
    };
  }
  const code = spec.code.trim();
  const parsed = parseSource(`<>${code}</>`);
  if (!parsed || !isSingleElementFragment(parsed)) {
    return { error: 'pasted content must be a single JSX element' };
  }
  const missing = unresolvedIdentifiers(parsed, topLevelBindings(ast));
  if (missing.length > 0) {
    return {
      error: `pasted content references ${missing.join(', ')}, which this deck doesn't define`,
    };
  }
  const styled = withStyle(code, spec.style);
  if (typeof styled !== 'string') return styled;
  return { code: styled, imports: [] };
}

function isSingleElementFragment(ast: t.File): boolean {
  const [statement, ...rest] = ast.program.body;
  if (rest.length > 0 || !t.isExpressionStatement(statement)) return false;
  if (!t.isJSXFragment(statement.expression)) return false;
  const children = statement.expression.children.filter((child) => !isWhitespaceText(child));
  return children.length === 1 && t.isJSXElement(children[0]);
}

function jsxStringAttr(value: string): string {
  return /^[^"\\<>&{}\n\r]*$/.test(value) ? `"${value}"` : `{${jsString(value)}}`;
}

const AST_META_KEYS = new Set([
  'loc',
  'start',
  'end',
  'type',
  'extra',
  'leadingComments',
  'trailingComments',
  'innerComments',
]);

const KNOWN_GLOBALS = new Set([
  'undefined',
  'NaN',
  'Infinity',
  'Math',
  'Number',
  'String',
  'Boolean',
  'Array',
  'Object',
  'JSON',
  'Date',
  'Intl',
  'Symbol',
  'Map',
  'Set',
  'Promise',
  'console',
  'window',
  'document',
  'React',
  'globalThis',
  'parseInt',
  'parseFloat',
  'encodeURIComponent',
  'decodeURIComponent',
]);

// Identifiers a pasted snippet reads but neither declares itself nor finds at
// the target file's top level. A snippet copied out of a `.map()` callback or a
// page-local `const` would otherwise paste into a component that can't see it.
function unresolvedIdentifiers(snippet: t.File, available: Set<string>): string[] {
  const declared = new Set<string>();
  const used = new Set<string>();
  const declare = (node: t.Node | null | undefined) => {
    if (!node) return;
    walkAll(node, (inner) => {
      if (t.isIdentifier(inner)) declared.add(inner.name);
    });
  };
  walkAll(snippet, (node) => {
    if (t.isFunction(node)) for (const param of node.params) declare(param);
    if (t.isVariableDeclarator(node)) declare(node.id);
    if (t.isCatchClause(node)) declare(node.param);
  });
  const visit = (node: t.Node, parent: t.Node | null, key: string) => {
    if (t.isIdentifier(node)) {
      const isPropertyKey =
        (t.isObjectProperty(parent) || t.isObjectMethod(parent)) &&
        key === 'key' &&
        !(parent as t.ObjectProperty).computed;
      const isMemberProperty =
        (t.isMemberExpression(parent) || t.isOptionalMemberExpression(parent)) &&
        key === 'property' &&
        !parent.computed;
      if (!isPropertyKey && !isMemberProperty) used.add(node.name);
    } else if (t.isJSXIdentifier(node)) {
      const isElementName =
        (t.isJSXOpeningElement(parent) || t.isJSXClosingElement(parent)) && key === 'name';
      const isMemberObject = t.isJSXMemberExpression(parent) && key === 'object';
      if ((isElementName && /^[A-Z]/.test(node.name)) || isMemberObject) used.add(node.name);
    }
    for (const childKey of Object.keys(node)) {
      if (AST_META_KEYS.has(childKey)) continue;
      const value = (node as unknown as Record<string, unknown>)[childKey];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && 'type' in item)
            visit(item as t.Node, node, childKey);
        }
      } else if (value && typeof value === 'object' && 'type' in value) {
        visit(value as t.Node, node, childKey);
      }
    }
  };
  visit(snippet.program, null, '');
  return [...used].filter(
    (name) => !declared.has(name) && !available.has(name) && !KNOWN_GLOBALS.has(name),
  );
}

type Located = { element: t.JSXElement; parent: t.JSXElement | t.JSXFragment };

function locateInJsxParent(ast: t.File, loc: ElementLoc): Located | { error: string } {
  const element = findJsxByStart(ast, loc.line, loc.column);
  if (!element) return { error: `no JSX element at ${loc.line}:${loc.column}` };
  let parent: t.JSXElement | t.JSXFragment | null = null;
  walkAll(ast, (node) => {
    if (!t.isJSXElement(node) && !t.isJSXFragment(node)) return;
    if (node.children.includes(element)) {
      parent = node;
      return 'stop';
    }
  });
  if (!parent) {
    return { error: 'element is not a direct JSX child, so it can only be changed in code' };
  }
  return { element, parent };
}

function locOfOffset(ast: t.File, offset: number): ElementLoc | null {
  let hit: ElementLoc | null = null;
  walkAll(ast, (node) => {
    if (t.isJSXElement(node) && node.start === offset && node.loc) {
      hit = { line: node.loc.start.line, column: node.loc.start.column };
      return 'stop';
    }
  });
  return hit;
}

type Created = { splice: Splice; local: number };

// Maps a position inside one splice's inserted text to the spliced output by
// adding the net length change of every splice that lands before it.
function outputOffset(splices: Splice[], created: Created): number {
  let shift = 0;
  for (const splice of splices) {
    if (splice !== created.splice && splice.from < created.splice.from) {
      shift += splice.text.length - (splice.to - splice.from);
    }
  }
  return created.splice.from + shift + created.local;
}

function finish(source: string, splices: Splice[], created: Created[]): StructureResult {
  const applied = applySplices(source, splices);
  if (!applied.ok) return applied;
  const ast = parseSource(applied.source);
  if (!ast) return fail('edit would produce invalid source');
  const locs: ElementLoc[] = [];
  for (const item of created) {
    const loc = locOfOffset(ast, outputOffset(splices, item));
    if (!loc) return fail('could not locate the new element');
    locs.push(loc);
  }
  return { ok: true, source: applied.source, created: locs };
}

function planInsert(
  source: string,
  ast: t.File,
  op: Extract<StructureOp, { kind: 'insert' }>,
): StructureResult {
  const root = findPageRoot(ast, op.pageIndex);
  if (!root) return fail('could not find the JSX this page returns');
  const built = buildElementCode(ast, source, op.element);
  if ('error' in built) return fail(built.error);
  const canAppend =
    t.isJSXFragment(root) ||
    !root.openingElement.selfClosing ||
    (t.isJSXIdentifier(root.openingElement.name) && /^[a-z]/.test(root.openingElement.name.name));
  const placed = canAppend
    ? appendChildSplice(source, root, built.code)
    : wrapInFragmentSplice(source, ast, root as t.JSXElement, built.code);
  return finish(
    source,
    [...built.imports, placed.splice],
    [{ splice: placed.splice, local: placed.codeOffset - placed.splice.from }],
  );
}

function planDelete(source: string, ast: t.File, targets: ElementLoc[]): StructureResult {
  if (targets.length === 0) return fail('nothing to delete', 400);
  const located: t.JSXElement[] = [];
  for (const loc of targets) {
    const hit = locateInJsxParent(ast, loc);
    if ('error' in hit) return fail(hit.error);
    if (!located.includes(hit.element)) located.push(hit.element);
  }
  // Deleting an ancestor already removes its descendants.
  const roots = located.filter((element) => !located.some((other) => contains(other, element)));
  const applied = applySplices(
    source,
    roots.map((element) => removalSplice(source, element)),
  );
  if (!applied.ok) return applied;
  return { ok: true, source: applied.source, created: [] };
}

function contains(outer: t.Node, inner: t.Node): boolean {
  return (
    outer !== inner &&
    (outer.start ?? 0) <= (inner.start ?? 0) &&
    (outer.end ?? 0) >= (inner.end ?? 0)
  );
}

// Removes the element and, when it sits alone on its lines, the line break and
// indentation in front of it so no blank line is left behind.
function removalSplice(source: string, element: t.JSXElement): Splice {
  const start = element.start ?? 0;
  const end = element.end ?? 0;
  const ls = lineStart(source, start);
  const lineEnd = source.indexOf('\n', end);
  const after = source.slice(end, lineEnd === -1 ? source.length : lineEnd);
  if (source.slice(ls, start).trim() === '' && after.trim() === '' && ls > 0) {
    return { from: ls - 1, to: end, text: '' };
  }
  return { from: start, to: end, text: '' };
}

function planDuplicate(
  source: string,
  ast: t.File,
  targets: ElementLoc[],
  style: StyleMap | undefined,
): StructureResult {
  if (targets.length === 0) return fail('nothing to duplicate', 400);
  const splices: Splice[] = [];
  const created: Created[] = [];
  const seen: t.JSXElement[] = [];
  for (const loc of targets) {
    const hit = locateInJsxParent(ast, loc);
    if ('error' in hit) return fail(hit.error);
    if (seen.some((other) => other === hit.element || contains(other, hit.element))) continue;
    seen.push(hit.element);
    const start = hit.element.start ?? 0;
    const end = hit.element.end ?? 0;
    const copy = withStyle(source.slice(start, end), style);
    if (typeof copy !== 'string') return fail(copy.error);
    const prefix = `\n${indentAt(source, start)}`;
    const splice = { from: end, to: end, text: `${prefix}${copy}` };
    splices.push(splice);
    created.push({ splice, local: prefix.length });
  }
  return finish(source, splices, created);
}

function sameParentSiblings(
  ast: t.File,
  targets: ElementLoc[],
): { elements: t.JSXElement[] } | { error: string } {
  let parent: t.JSXElement | t.JSXFragment | null = null;
  const elements: t.JSXElement[] = [];
  for (const loc of targets) {
    const hit = locateInJsxParent(ast, loc);
    if ('error' in hit) return hit;
    if (parent && hit.parent !== parent) {
      return { error: 'only elements that share a parent can be grouped' };
    }
    parent = hit.parent;
    if (!elements.includes(hit.element)) elements.push(hit.element);
  }
  if (!parent) return { error: 'nothing to group' };
  const order = (parent as t.JSXElement | t.JSXFragment).children;
  elements.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return { elements };
}

// `childStyles[i]` restyles the i-th selected element in selection order, so
// callers can re-base positions without caring how the source orders them.
function planGroup(
  source: string,
  ast: t.File,
  op: Extract<StructureOp, { kind: 'group' }>,
): StructureResult {
  if (op.targets.length < 2) return fail('select at least two elements to group', 400);
  const siblings = sameParentSiblings(ast, op.targets);
  if ('error' in siblings) return fail(siblings.error);
  const { elements } = siblings;
  const styleFor = new Map<t.JSXElement, StyleMap | undefined>();
  for (const [index, loc] of op.targets.entries()) {
    const element = findJsxByStart(ast, loc.line, loc.column);
    if (element) styleFor.set(element, op.childStyles?.[index]);
  }
  const first = elements[0];
  const start = first.start ?? 0;
  const indent = indentAt(source, start);
  const bodies: string[] = [];
  for (const element of elements) {
    const from = element.start ?? 0;
    const styled = withStyle(source.slice(from, element.end ?? 0), styleFor.get(element));
    if (typeof styled !== 'string') return fail(styled.error);
    const delta = indent.length + 2 - indentAt(source, from).length;
    bodies.push(reindent(styled, delta, snippetRanges(styled)));
  }
  const head = `<div style={${formatStyleObject(op.style)}}>`;
  const text = `${head}\n${bodies.map((body) => `${indent}  ${body}`).join('\n')}\n${indent}</div>`;
  const splice: Splice = { from: start, to: first.end ?? 0, text };
  const splices = [splice, ...elements.slice(1).map((element) => removalSplice(source, element))];
  return finish(source, splices, [{ splice, local: 0 }]);
}

function planUngroup(
  source: string,
  ast: t.File,
  op: Extract<StructureOp, { kind: 'ungroup' }>,
): StructureResult {
  const hit = locateInJsxParent(ast, op.target);
  if ('error' in hit) return fail(hit.error);
  const group = hit.element;
  const name = group.openingElement.name;
  if (!t.isJSXIdentifier(name) || !/^[a-z]/.test(name.name)) {
    return fail('only plain elements can be ungrouped');
  }
  const children = group.children.filter((child) => !isWhitespaceText(child));
  if (children.length === 0 || !children.every((child) => t.isJSXElement(child))) {
    return fail('the group must contain only elements to ungroup');
  }
  const start = group.start ?? 0;
  const indent = indentAt(source, start);
  const bodies: string[] = [];
  for (const [index, child] of (children as t.JSXElement[]).entries()) {
    const from = child.start ?? 0;
    const original = source.slice(from, child.end ?? 0);
    const styled = withStyle(original, op.childStyles?.[index]);
    if (typeof styled !== 'string') return fail(styled.error);
    const delta = indent.length - indentAt(source, from).length;
    bodies.push(reindent(styled, delta, snippetRanges(styled)));
  }
  const splice: Splice = { from: start, to: group.end ?? 0, text: bodies.join(`\n${indent}`) };
  const created: Created[] = [];
  let local = 0;
  for (const body of bodies) {
    created.push({ splice, local });
    local += body.length + 1 + indent.length;
  }
  return finish(source, [splice], created);
}

export function applyStructureOp(source: string, op: StructureOp): StructureResult {
  const ast = parseSource(source);
  if (!ast) return fail('could not parse source');
  switch (op.kind) {
    case 'insert':
      return planInsert(source, ast, op);
    case 'delete':
      return planDelete(source, ast, op.targets);
    case 'duplicate':
      return planDuplicate(source, ast, op.targets, op.style);
    case 'group':
      return planGroup(source, ast, op);
    case 'ungroup':
      return planUngroup(source, ast, op);
    default:
      return fail('unknown structure op', 400);
  }
}

export function copyElements(source: string, targets: ElementLoc[]): CopyResult {
  const ast = parseSource(source);
  if (!ast) return fail('could not parse source');
  const ranges = templateRanges(ast);
  const snippets: string[] = [];
  for (const loc of targets) {
    const element = findJsxByStart(ast, loc.line, loc.column);
    if (!element) return fail(`no JSX element at ${loc.line}:${loc.column}`);
    const start = element.start ?? 0;
    const text = source.slice(start, element.end ?? 0);
    snippets.push(reindent(text, -indentAt(source, start).length, ranges, start));
  }
  return { ok: true, snippets };
}
