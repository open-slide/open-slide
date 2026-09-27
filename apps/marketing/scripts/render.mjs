import { listImages } from './projects.mjs';
import { parseRenderArgs } from './render-kit.mjs';

// `render <id>` renders whichever project <id> names: a film to MP4, or an
// image to one PNG per output. Positionals of digits are --stills times.
const { positionals } = parseRenderArgs();
const id = positionals.find((p) => !/^[\d.,]+$/.test(p));
await import(listImages().includes(id) ? './render-image.mjs' : './render-film.mjs');
