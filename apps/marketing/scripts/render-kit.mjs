import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { root } from './projects.mjs';

// `pnpm <script> -- --flag` forwards the bare `--`, which parseArgs would
// read as the end of options.
export const parseRenderArgs = () =>
  parseArgs({
    args: process.argv.slice(2).filter((a) => a !== '--'),
    allowPositionals: true,
    options: {
      fps: { type: 'string' },
      samples: { type: 'string' },
      shutter: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      workers: { type: 'string' },
      scale: { type: 'string' },
      quality: { type: 'string' },
      crf: { type: 'string' },
      grain: { type: 'string' },
      name: { type: 'string' },
      out: { type: 'string' },
      only: { type: 'string' },
      stills: { type: 'boolean', default: false },
      draft: { type: 'boolean', default: false },
      'no-audio': { type: 'boolean', default: false },
      'no-publish': { type: 'boolean', default: false },
    },
  });

export function timestamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function gitInfo() {
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    return {
      commit: git('rev-parse', '--short', 'HEAD'),
      dirty: git('status', '--porcelain', '--', '.') !== '',
    };
  } catch {
    return null;
  }
}
