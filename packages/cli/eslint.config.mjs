import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: [
            "{projectRoot}/eslint.config.{js,cjs,mjs}",
            "{projectRoot}/vite.config.{js,ts,mjs,mts}",
          ],
          // Ignore workspace dependencies that are bundled for npm publishing
          ignoredDependencies: [
            "@ci-dokumentor/cicd-gitlab-ci",
            "@ci-dokumentor/cicd-github-actions",
            "@ci-dokumentor/core",
            "@ci-dokumentor/repository-git",
            "@ci-dokumentor/repository-gitlab",
            "@ci-dokumentor/repository-github",
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import("jsonc-eslint-parser"),
    },
  },
];
