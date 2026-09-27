import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { ID, listFilms, root } from './projects.mjs';

const { values: opts, positionals } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== '--'),
  allowPositionals: true,
  options: { title: { type: 'string' } },
});

const [id] = positionals;
if (!id || !ID.test(id)) {
  console.error('usage: pnpm marketing new:image <image-id> [--title "…"]');
  console.error('image-id: lowercase letters, digits, and dashes, e.g. comments-og');
  process.exit(1);
}
const dest = path.join(root, 'images', id);
if (fs.existsSync(dest) || listFilms().includes(id)) {
  console.error(`"${id}" is taken; films and images share ids`);
  process.exit(1);
}

const title =
  opts.title ??
  id
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
fs.cpSync(path.join(root, 'templates/image'), dest, { recursive: true });
for (const file of ['image.js', 'index.html']) {
  const p = path.join(dest, file);
  const escaped = file === 'image.js' ? title.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : title;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replaceAll('__TITLE__', escaped));
}

console.log(`created images/${id} — "${title}"

  preview   pnpm dev:marketing → http://127.0.0.1:5180/#/${id}/preview
  render    pnpm marketing render ${id}`);
