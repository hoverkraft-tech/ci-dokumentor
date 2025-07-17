/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/cli',
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Multiple entry points for library and CLI binary
      input: {
        index: 'src/index.ts',
        'bin/ci-dokumentor': 'src/bin/ci-dokumentor.ts'
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es' as const
      },
      // External packages that should not be bundled into your library.
      external: [], // Bundle everything for standalone binary
    },
    target: 'node20', // Specify Node.js version target
    ssr: true, // Server-side rendering mode for Node.js
  },
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
    setupFiles: ['../core/src/error-logging/vitest-setup.ts'],
    // Enhanced error output configuration
    outputFile: {
      junit: './test-output/vitest/junit.xml',
      json: './test-output/vitest/results.json',
    },
    // Better error handling configuration
    testTimeout: 30000,
    hookTimeout: 30000,
  },
}));
