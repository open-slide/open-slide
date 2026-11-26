import fs from 'node:fs';
import path from 'node:path';
import { parse, Scalar, stringify } from 'yaml';

const RELEASES = 'https://github.com/open-slide/open-slide/releases/download';
const root = path.resolve(import.meta.dirname, '..');

export function tagFor(version) {
  return `desktop-v${version}`;
}

function findFeeds(dir) {
  return fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((name) => /^latest(-\w+)?\.yml$/.test(path.basename(name)))
    .map((name) => path.join(dir, name));
}

// Each platform job writes its own feed; macOS builds each arch separately, so their
// feeds merge into one that lists both zips.
export function mergeFeeds(feeds, tag) {
  const base = `${RELEASES}/${tag}/`;
  const absolute = (url) => new URL(url, base).href;
  const [first] = feeds;
  const files = [];
  for (const feed of feeds) {
    if (feed.version !== first.version) {
      throw new Error(`Feeds disagree on the version: ${first.version} and ${feed.version}`);
    }
    for (const file of feed.files) {
      if (!files.some((f) => f.url === file.url)) files.push(file);
    }
  }
  const releaseDate = feeds
    .map((f) => f.releaseDate)
    .sort()
    .at(-1);
  // Unquoted, electron-updater's YAML parser would read the date as a Date object.
  const quotedDate = Object.assign(new Scalar(releaseDate), { type: Scalar.QUOTE_SINGLE });
  return {
    ...first,
    files: files.map((file) => ({ ...file, url: absolute(file.url) })),
    path: absolute(first.path),
    releaseDate: quotedDate,
  };
}

function feed(artifacts, out, tag) {
  const byName = new Map();
  for (const file of findFeeds(artifacts)) {
    const name = path.basename(file);
    byName.set(name, [...(byName.get(name) ?? []), parse(fs.readFileSync(file, 'utf8'))]);
  }
  if (byName.size === 0) throw new Error(`No update feeds under ${artifacts}`);
  fs.mkdirSync(out, { recursive: true });
  for (const [name, feeds] of byName) {
    fs.writeFileSync(path.join(out, name), stringify(mergeFeeds(feeds, tag)));
    console.log(`${name}: ${feeds.length} build(s)`);
  }
}

export function notesFor(changelog, version) {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start < 0) return '';
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join('\n')
    .trim();
}

function notes(version) {
  const file = path.join(root, 'CHANGELOG.md');
  const changelog = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  process.stdout.write(`${notesFor(changelog, version) || `open-slide desktop ${version}.`}\n`);
}

if (import.meta.filename === process.argv[1]) {
  const [command, ...args] = process.argv.slice(2);
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (command === 'version') console.log(version);
  else if (command === 'tag') console.log(tagFor(version));
  else if (command === 'notes') notes(version);
  else if (command === 'feed' && args.length === 2) feed(args[0], args[1], tagFor(version));
  else {
    console.error('Usage: release.mjs version | tag | notes | feed <artifacts-dir> <out-dir>');
    process.exit(1);
  }
}
