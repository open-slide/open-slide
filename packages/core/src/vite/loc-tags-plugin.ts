import path from 'node:path';
import * as t from '@babel/types';
import type { Plugin } from 'vite';
import { tryParse, walkJsx } from '../editing/babel-walk.ts';

// Inject `data-slide-loc="<line>:<col>"` onto every host JSX element in
// slide source files so the inspector can map a click straight to a
// source location, sidestepping HMR-stale `_debugSource` on fibers.

// Capitalized components that explicitly forward `data-slide-loc` to a
// host root, so the inspector can target them like a host element.
const FORWARDING_COMPONENTS = new Set(['ImagePlaceholder']);

function isTaggableJsxName(name: t.JSXOpeningElement['name']): name is t.JSXIdentifier {
  if (!t.isJSXIdentifier(name)) return false;
  return /^[a-z]/.test(name.name) || FORWARDING_COMPONENTS.has(name.name);
}

function alreadyTagged(opening: t.JSXOpeningElement): boolean {
  return opening.attributes.some(
    (attr) =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'data-slide-loc',
  );
}

// Edits are always written to `slides/<id>/index.tsx`, so a real
// `line:col` from any other file would splice the wrong spot there. Those
// files get this sentinel instead: it still claims the element (so
// `closest('[data-slide-loc]')` doesn't resolve to an unrelated ancestor
// in index.tsx) but never parses as a location.
export const EXTERNAL_LOC = 'external';

export function injectLocTags(code: string, opts?: { external?: boolean }): string | null {
  const ast = tryParse(code);
  if (!ast) return null;

  const insertions: { offset: number; text: string }[] = [];
  walkJsx(ast, (node) => {
    if (!t.isJSXElement(node) || !node.loc) return;
    const opening = node.openingElement;
    const name = opening.name;
    if (!isTaggableJsxName(name) || alreadyTagged(opening)) return;
    insertions.push({
      offset: name.end ?? 0,
      text: ` data-slide-loc="${opts?.external ? EXTERNAL_LOC : `${node.loc.start.line}:${node.loc.start.column}`}"`,
    });
  });

  if (insertions.length === 0) return null;
  insertions.sort((a, b) => b.offset - a.offset);
  let next = code;
  for (const ins of insertions) {
    next = next.slice(0, ins.offset) + ins.text + next.slice(ins.offset);
  }
  return next;
}

export type LocTagsPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

// Vite normally hands `id` to plugins with forward slashes, but other
// plugins or virtual modules can pass through Windows-style paths.
// Compare both sides in POSIX shape so the match doesn't depend on
// which separator the caller happened to use.
function classifySlideSourceFile(id: string, slidesRootPosix: string): 'entry' | 'external' | null {
  const filePath = id.split(/[?#]/)[0].replace(/\\/g, '/');
  if (!filePath.startsWith(`${slidesRootPosix}/`)) return null;
  if (!filePath.endsWith('.tsx')) return null;
  if (filePath.endsWith('.d.ts') || filePath.endsWith('.test.tsx')) return null;
  const parts = filePath.slice(slidesRootPosix.length + 1).split('/');
  if (parts.length < 2) return null;
  return parts.length === 2 && parts[1] === 'index.tsx' ? 'entry' : 'external';
}

export function locTagsPlugin(opts: LocTagsPluginOptions): Plugin {
  const slidesRoot = path.resolve(opts.userCwd, opts.slidesDir ?? 'slides').replace(/\\/g, '/');
  return {
    name: 'open-slide:loc-tags',
    apply: 'serve',
    // Must run before @vitejs/plugin-react so the JSX transform
    // sees our injected attributes.
    enforce: 'pre',
    transform(code, id) {
      const kind = classifySlideSourceFile(id, slidesRoot);
      if (!kind) return null;
      const next = injectLocTags(code, { external: kind === 'external' });
      if (next === null) return null;
      return { code: next, map: null };
    },
  };
}
