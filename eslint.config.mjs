import nx from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { importX } from 'eslint-plugin-import-x';
import tsParser from '@typescript-eslint/parser';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  eslintConfigPrettier,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    // Settings for eslint-plugin-import (and import-x) to resolve packages
    // using TypeScript's paths and Node resolution so workspace package names
    // like @ci-dokumentor/core and Docusaurus virtual aliases are resolved.
    settings: {
      'import/resolver': {
        typescript: {
          // Use the repository tsconfig which references packages so the
          // resolver can locate package projects and path mappings.
          project: ['./tsconfig.json', './tsconfig.base.json'],
          alwaysTryTypes: true,
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
          moduleDirectory: ['node_modules', 'packages'],
        },
      },
    },
    rules: {
      'import-x/order': 'error',
      'import-x/no-absolute-path': 'error',
      'import-x/no-relative-packages': 'error',
      'import-x/no-named-as-default-member': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/no-nodejs-modules': [
        'error',
        {
          allow: [
            'node:fs',
            'node:os',
            'node:path',
            'node:readline',
            'node:string_decoder',
            'node:url',
          ],
        },
      ],
    },
  },
  {
    files: ['**/eslint.config.mjs', '**/vite.config.ts'],
    rules: {
      'import-x/no-relative-packages': 'off',
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
