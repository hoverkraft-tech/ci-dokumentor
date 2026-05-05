import nx from "@nx/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import {
  createTypeScriptImportResolver,
  defaultConditionNames,
} from "eslint-import-resolver-typescript";
import tsParser from "@typescript-eslint/parser";

const resolverConditionNames = ["development", ...defaultConditionNames];

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  eslintConfigPrettier,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    ignores: [
      "**/dist",
      "**/out-tsc",
      "**/vite.config.*.timestamp*",
      "**/vitest.config.*.timestamp*",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?js$"],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs",
    ],
    // Override or add rules here
    rules: {},
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    // Resolve workspace packages through package exports and the repository's
    // NodeNext project references, including the custom `development` condition
    // used throughout the monorepo for source-first local resolution.
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          conditionNames: resolverConditionNames,
          project: ["./tsconfig.json"],
        }),
        createNodeResolver({
          conditionNames: ["development", "import", "require", "default"],
          extensions: [
            ".mjs",
            ".cjs",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json",
            ".node",
          ],
          mainFields: ["types", "module", "main"],
        }),
      ],
    },
    rules: {
      "import-x/order": "error",
      "import-x/no-absolute-path": "error",
      "import-x/no-relative-packages": "error",
      "import-x/no-named-as-default-member": "error",
      "import-x/no-duplicates": "error",
      "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import-x/no-nodejs-modules": [
        "error",
        {
          allow: [
            "node:fs",
            "node:os",
            "node:path",
            "node:readline",
            "node:string_decoder",
            "node:url",
          ],
        },
      ],
    },
  },
  {
    files: ["**/eslint.config.mjs", "**/vite.config.ts"],
    rules: {
      "import-x/no-relative-packages": "off",
      "@nx/enforce-module-boundaries": "off",
    },
  },
];
