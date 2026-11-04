import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

const coreApp = resolve(import.meta.dirname, '../../packages/core/src/app');

export default defineConfig({
  main: {
    build: { outDir: 'dist/main' },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
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
    plugins: [react(), tailwindcss()],
    build: { outDir: 'dist/renderer' },
  },
});
