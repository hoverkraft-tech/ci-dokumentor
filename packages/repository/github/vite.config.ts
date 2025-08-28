/// <reference types='vitest' />
import { defineConfig } from 'vite';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { createSharedConfig } from '../../../vite.shared';

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
        name: '@ci-dokumentor/repository-github',
        fileName: 'index',
        formats: ['es' as const],
      },
    },
  })
});
