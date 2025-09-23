/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { createSharedConfig } from '../../vite.shared';

export default defineConfig(() => {
  const sharedConfig = createSharedConfig(__dirname);
  return ({
    ...sharedConfig,
    // Configuration for building your library.
    // See: https://vitejs.dev/guide/build.html#library-mode
    build: {
      ...sharedConfig.build,
      lib: {
        entry: 'src/index.ts',
        name: '@ci-dokumentor/cli',
        fileName: 'index',
        formats: ['es' as const],
      },
      rollupOptions: {
        input: {
          'bin/ci-dokumentor': 'src/bin/ci-dokumentor.ts',
        },
        output: {
          entryFileNames: '[name].js',
          format: 'es' as const,
        },
        // Bundle workspace dependencies for npm publishing
        external: [
          "commander",
          "inversify",
          "reflect-metadata"
          // All @ci-dokumentor/* workspace dependencies are bundled (not external)
        ],
      },
    },
  })
});
