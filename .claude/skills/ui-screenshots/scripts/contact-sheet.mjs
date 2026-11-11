// Tiles several images into one PNG so a batch can be reviewed in one read.
//
//   node contact-sheet.mjs <out.png> <img> [img...]
import path from 'node:path';
import { loadSharp } from './lib.mjs';

const [out, ...files] = process.argv.slice(2);
if (!out || files.length === 0) {
  console.error('usage: node contact-sheet.mjs <out.png> <img> [img...]');
  process.exit(1);
}

const sharp = loadSharp();
const W = 1000;
const H = 667;
const cols = files.length === 1 ? 1 : 2;
const rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(
  files.map(async (file, i) => ({
    input: await sharp(file).resize(W, H, { fit: 'contain', background: '#ffffff' }).toBuffer(),
    left: (i % cols) * W,
    top: Math.floor(i / cols) * H,
  })),
);
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: '#ffffff' } })
  .composite(tiles)
  .png()
  .toFile(path.resolve(out));
console.log(path.resolve(out));
