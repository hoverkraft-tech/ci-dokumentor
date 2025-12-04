import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
          ],
          ignoredDependencies: ['@docusaurus/core', 'react-dom'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // Disable some import-x rules in this package because Docusaurus provides
    // virtual path aliases like @theme, @docusaurus and @site that aren't
    // resolvable by the eslint import resolver in the monorepo environment.
    // We keep these rules enabled elsewhere but turn them off for source files
    // inside the docs package.
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'import-x/no-unresolved': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },
  {
    ignores: ['**/build', '**/.docusaurus'],
  },
];
