import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const root = path.resolve(import.meta.dirname, '..');
export const repo = path.resolve(root, '../..');
export const ID = /^[a-z0-9][a-z0-9-]*$/;

const KINDS = {
  film: { dir: 'films', manifest: 'film.js' },
  image: { dir: 'images', manifest: 'image.js' },
};

function list(kind) {
  const { dir, manifest } = KINDS[kind];
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && ID.test(e.name))
    .filter((e) => fs.existsSync(path.join(base, e.name, manifest)))
    .map((e) => e.name)
    .sort();
}

export const listFilms = () => list('film');

// Films and images share out/<id>, so an image can't reuse a film's id.
export function listImages() {
  const films = new Set(listFilms());
  return list('image').filter((id) => !films.has(id));
}

export const listProjects = () => [
  ...listFilms().map((id) => ({ id, kind: 'film' })),
  ...listImages().map((id) => ({ id, kind: 'image' })),
];

async function load(kind, id, ids) {
  if (!id) {
    if (ids.length === 1) [id] = ids;
    else throw new Error(`pick a ${kind}: ${ids.join(', ')}`);
  }
  if (!ids.includes(id)) throw new Error(`no ${kind} "${id}" (${kind}s: ${ids.join(', ')})`);
  const { dir, manifest } = KINDS[kind];
  const mod = await import(pathToFileURL(path.join(root, dir, id, manifest)).href);
  return { ...mod.default, id };
}

export const loadFilm = (id) => load('film', id, listFilms());
export const loadImage = (id) => load('image', id, listImages());

export const outDir = (id, ...rest) => path.join(root, 'out', id, ...rest);
