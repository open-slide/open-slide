import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';

const coreApp = resolve(import.meta.dirname, '../../packages/core/src/app');

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ');

// Build only: the dev renderer needs Vite's inline preamble and HMR socket.
function contentSecurityPolicy(): Plugin {
  return {
    name: 'open-slide:shell-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  main: {
    build: { outDir: 'dist/main', sourcemap: 'hidden' },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      sourcemap: 'hidden',
      // Sandboxed preloads cannot require sibling chunks, so each entry is
      // bundled on its own.
      isolatedEntries: true,
      externalizeDeps: false,
      rolldownOptions: {
        input: {
          shell: resolve(import.meta.dirname, 'src/preload/shell.ts'),
          view: resolve(import.meta.dirname, 'src/preload/view.ts'),
        },
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    // The shell reuses core's own UI primitives and tokens, so it reads core's
    // source through the same `@` alias core uses internally.
    resolve: {
      alias: { '@': coreApp },
      dedupe: ['react', 'react-dom'],
    },
    plugins: [react(), tailwindcss(), contentSecurityPolicy()],
    build: { outDir: 'dist/renderer', sourcemap: 'hidden' },
  },
});
