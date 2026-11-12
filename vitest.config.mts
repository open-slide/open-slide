import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./packages/react/src/app', import.meta.url)),
      },
      {
        find: '@open-slide/shared/editing',
        replacement: fileURLToPath(
          new URL('./packages/shared/src/editing/index.ts', import.meta.url),
        ),
      },
      {
        find: '@open-slide/shared/files',
        replacement: fileURLToPath(
          new URL('./packages/shared/src/files/index.ts', import.meta.url),
        ),
      },
      {
        find: '@open-slide/shared/http',
        replacement: fileURLToPath(new URL('./packages/shared/src/http/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/shared/locale',
        replacement: fileURLToPath(
          new URL('./packages/shared/src/locale/index.ts', import.meta.url),
        ),
      },
      {
        find: '@open-slide/shared/vite',
        replacement: fileURLToPath(new URL('./packages/shared/src/vite/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/shared',
        replacement: fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core/files',
        replacement: fileURLToPath(new URL('./packages/core/src/files/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core/http',
        replacement: fileURLToPath(new URL('./packages/core/src/http/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core/locale',
        replacement: fileURLToPath(new URL('./packages/core/src/locale/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core/vite',
        replacement: fileURLToPath(new URL('./packages/core/src/vite/index.ts', import.meta.url)),
      },
      {
        find: '@open-slide/core',
        replacement: fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      },
    ],
  },
  test: {
    // Screenshot and preview tooling copies apps into e2e/.scratch.
    exclude: [...configDefaults.exclude, '**/.scratch/**'],
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx'],
        },
      },
      {
        extends: true,
        test: {
          name: 'changelog',
          include: ['apps/web/lib/**/*.test.ts'],
        },
      },
    ],
  },
});
