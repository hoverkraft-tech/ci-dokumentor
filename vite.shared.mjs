import { join } from "node:path";
import dts from "vite-plugin-dts";

// Common shared Vite configuration for all packages. Keep this file limited to
// settings that are identical across packages (build/test defaults).
const packagesPath = join(import.meta.dirname, "packages");

/**
 * @param {string} packageDirPath
 * @returns {import("vite").UserConfig}
 */
export function createSharedConfig(packageDirPath) {
  if (!packageDirPath.startsWith(packagesPath)) {
    throw new Error(`Invalid package directory: ${packageDirPath}`);
  }

  const packageDirname = packageDirPath.replace(packagesPath, "");

  return {
    root: packageDirPath,
    cacheDir: join(
      import.meta.dirname,
      "node_modules/.vite/packages/",
      packageDirname,
    ),
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      dts({
        entryRoot: "src",
        tsconfigPath: join(packageDirPath, "tsconfig.lib.json"),
      }),
    ],
    build: {
      outDir: "./dist",
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      // target and ssr are common for node libraries in this workspace
      target: "node20",
      ssr: true,
      rolldownOptions: {
        external: [
          "inversify",
          "reflect-metadata",
          "@ci-dokumentor/cicd-github-actions",
          "@ci-dokumentor/cicd-gitlab-ci",
          "@ci-dokumentor/core",
          "@ci-dokumentor/repository-git",
          "@ci-dokumentor/repository-github",
          "@ci-dokumentor/repository-gitlab",
        ],
      },
    },
    test: {
      watch: false,
      globals: true,
      environment: "node",
      include: [
        "{src,__tests__}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      reporters: ["default"],
      coverage: {
        provider: "v8",
      },
    },
  };
}
