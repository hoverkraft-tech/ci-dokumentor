/// <reference types='vitest' />
import type { UserConfig } from 'vite';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import { join } from 'path';

// Common shared Vite configuration for all packages. Keep this file limited to
// settings that are identical across packages (build/test defaults).
const packagesPath = join(__dirname, 'packages');
export function createSharedConfig(packageDirPath: string): UserConfig {
    if (!packageDirPath.startsWith(packagesPath)) {
        throw new Error(`Invalid package directory: ${packageDirPath}`);
    }

    const packageDirname = packageDirPath.replace(packagesPath, '');

    return {
        root: packageDirPath,
        cacheDir: join(__dirname, 'node_modules/.vite/packages/', packageDirname),
        plugins: [
            // enable TS path mapping resolution during dev/test
            tsconfigPaths(),
            nxCopyAssetsPlugin(['*.md', 'package.json']),
            dts({
                entryRoot: 'src',
                tsconfigPath: join(packageDirPath, 'tsconfig.lib.json'),
            }),
        ],
        build: {
            outDir: './dist',
            emptyOutDir: true,
            reportCompressedSize: true,
            commonjsOptions: {
                transformMixedEsModules: true,
            },
            // target and ssr are common for node libraries in this workspace
            target: 'node20',
            ssr: true,
            rollupOptions: {
                external: [
                    "inversify",
                    "reflect-metadata",
                    "@ci-dokumentor/core",
                    "@ci-dokumentor/repository-git",
                    "@ci-dokumentor/repository-github",
                    "@ci-dokumentor/cicd-github-actions",
                ],
            },
        },
        test: {
            watch: false,
            globals: true,
            environment: 'node',
            include: ['{src,__tests__}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
            reporters: ['default'],
            coverage: {
                provider: 'v8' as const,
            },
        },
    };
}
