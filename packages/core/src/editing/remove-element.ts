import { createHash } from 'node:crypto';
import * as t from '@babel/types';
import { parseSource, walkAll, walkJsx } from './babel-walk.ts';

export function sourceRevision(source: string): string {
  return createHash('sha256').update(source).digest('hex');
}

function pageFunctions(ast: t.File): t.Node[] {
  const declaration = ast.program.body.find(t.isExportDefaultDeclaration)?.declaration;
  const value =
    declaration && (t.isTSSatisfiesExpression(declaration) || t.isTSAsExpression(declaration))
      ? declaration.expression
      : declaration;
  if (!value || !t.isArrayExpression(value)) return [];
  const pages: t.Node[] = [];
  for (const entry of value.elements) {
    if (!entry) continue;
    if (t.isArrowFunctionExpression(entry) || t.isFunctionExpression(entry)) {
      pages.push(entry);
      continue;
    }
    if (!t.isIdentifier(entry)) continue;
    let references = 0;
    walkAll(ast, (node) => {
      if (t.isIdentifier(node) && node.name === entry.name) references++;
      if (
        t.isJSXOpeningElement(node) &&
        t.isJSXIdentifier(node.name) &&
        node.name.name === entry.name
      )
        references++;
    });
    if (references !== 2) continue;
    for (const statement of ast.program.body) {
      const node = t.isExportNamedDeclaration(statement) ? statement.declaration : statement;
      if (node && t.isFunctionDeclaration(node) && node.id?.name === entry.name) {
        pages.push(node);
      } else if (node && t.isVariableDeclaration(node)) {
        for (const declarator of node.declarations) {
          if (
            t.isIdentifier(declarator.id) &&
            declarator.id.name === entry.name &&
            declarator.init &&
            (t.isArrowFunctionExpression(declarator.init) ||
              t.isFunctionExpression(declarator.init))
          )
            pages.push(declarator.init);
        }
      }
    }
  }
  return pages;
}

// Only JSX children in a single, statically identified page are safe to
// remove. Reused component definitions and callback-produced nodes are not.
export function removableStarts(source: string): Set<number> {
  const ast = parseSource(source);
  const starts = new Set<number>();
  if (!ast) return starts;
  for (const page of pageFunctions(ast)) {
    walkJsx(page, (element) => {
      if (!t.isJSXElement(element) || element.start == null || element.end == null) return;
      const name = element.openingElement.name;
      if (!t.isJSXIdentifier(name) || !/^[a-z]/.test(name.name)) return;
      let parent: t.JSXElement | t.JSXFragment | null = null;
      let dynamic = false;
      walkAll(page, (node) => {
        if ((t.isJSXElement(node) || t.isJSXFragment(node)) && node.children.includes(element))
          parent = node;
        if (
          node !== page &&
          (node.start ?? Infinity) < (element.start ?? 0) &&
          (node.end ?? 0) > (element.end ?? Infinity) &&
          (t.isFunction(node) || t.isCallExpression(node) || t.isJSXExpressionContainer(node))
        )
          dynamic = true;
      });
      if (!parent || dynamic) return;
      const children = (parent as t.JSXElement | t.JSXFragment).children;
      const index = children.indexOf(element);
      const previous = children[index - 1];
      const following = children[index + 1];
      if (
        t.isJSXText(previous) &&
        previous.value.trim() &&
        t.isJSXText(following) &&
        following.value.trim()
      )
        return;
      const before = children
        .slice(0, index)
        .reverse()
        .find((child) => !t.isJSXText(child) || !!child.value.trim());
      if (
        before &&
        t.isJSXExpressionContainer(before) &&
        source.slice(before.start ?? 0, before.end ?? 0).includes('@slide-comment')
      )
        return;
      starts.add(element.start);
    });
  }
  return starts;
}
