// Vite serves the shipped src/ files to the browser as-is, so every relative
// or `@/` import they make must resolve to a file that is also in the tarball.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const pkgRoot = path.resolve(import.meta.dirname, '..');
const [{ files }] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: pkgRoot,
    encoding: 'utf8',
  }),
);
const shipped = new Set(files.map((f) => f.path));

const SOURCE_RE = /\.(ts|tsx|js|jsx|mjs)$/;
const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g;
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx'];

const missing = [];
for (const file of shipped) {
  if (!file.startsWith('src/') || !SOURCE_RE.test(file)) continue;
  const code = readFileSync(path.join(pkgRoot, file), 'utf8');
  for (const [, spec] of code.matchAll(IMPORT_RE)) {
    let base;
    if (spec.startsWith('@/')) base = path.posix.join('src/app', spec.slice(2));
    else if (spec.startsWith('.')) base = path.posix.join(path.posix.dirname(file), spec);
    else continue;
    base = base.replace(/\?.*$/, '');
    if (!EXTENSIONS.some((ext) => shipped.has(base + ext))) {
      missing.push(`${file}: '${spec}'`);
    }
  }
}

if (missing.length > 0) {
  console.error('Shipped files import paths missing from the package:');
  for (const line of missing) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`check-pack: ${shipped.size} files, all source imports resolve.`);
