# AGENTS.md — agent instructions and operational contract

This file is written for automated coding agents (for example: Copilot coding agents). It exists to provide a concise operational contract and guardrails for agents working in this repository. It is not the canonical source for design or style rules. Those live in the developer documentation linked below.

## Canonical docs

- Primary source-of-truth (human + machine readable): [packages/docs/content/developers/](./packages/docs/content/developers/)

## Instructional docs

- Architecture overview: [packages/docs/content/developers/architecture.md](./packages/docs/content/developers/architecture.md)
- CI/CD rules: [packages/docs/content/developers/ci-cd.md](./packages/docs/content/developers/ci-cd.md)
- Contributing guidelines: [packages/docs/content/developers/contributing.md](./packages/docs/content/developers/contributing.md)
- Setup instructions: [packages/docs/content/developers/setup.md](./packages/docs/content/developers/setup.md)
- Testing guidelines: [packages/docs/content/developers/testing.md](./packages/docs/content/developers/testing.md)

## High-level rules (mandatory)

- Always consult the relevant pages under the canonical developer docs before performing any non-trivial change. The developer docs contain the authoritative coding standards, architecture, and CI rules.
- Do not add agent-only policies to the developer docs. The developer docs must remain readable and authoritative for humans and agents alike.
- Prefer making small, well-tested changes. Big or invasive changes must be reviewed by human maintainers.
- Never commit secrets, credentials, or personal data. If a secret is required for a workflow, create or update CI secrets via repository maintainers — do NOT write them into code or config.

## Agent operational contract (when modifying code)

Before creating a branch or PR:

- Read the package-level readme and `packages/docs/content/developers/` pages that cover the affected area.
- Run local validation: build, lint, typecheck, and unit tests for only the packages you change.
- Add or update unit tests for new behavior (happy path + 1-2 edge cases).
- Keep commits small and self-contained. Use conventional commit messages.

When opening a PR:

- Target a feature branch and include a clear title and description describing intent, changed files, and the minimal test plan.
- Include which pages in `packages/docs/content/developers/` you followed and any relevant rule citations.
- Ensure CI passes (lint, build, tests) before requesting review.

## Quality gates (required)

- Build: TypeScript compiles without errors in the modified packages.
- Lint: ESLint/Prettier rules pass for modified files.
- Tests: Vitest unit tests for modified packages pass; new code is covered by tests.

## Allowed agent actions (examples)

- Create small PRs that add or fix tests, documentation, type annotations, and small bugfixes.
- Refactor code in small, well-tested increments that preserve behavior.

## Disallowed actions (must not do)

- Do not push secrets, credentials, or publish tokens to the repository.
- Do not make large, architectural changes without explicit human guidance and a maintainer review.
- Do not add hidden agent-only files that affect behavior; any automation affecting humans must be discoverable in the repository and developer docs.

## Guidance summary (quick checklist)

1. Find relevant pages under [packages/docs/content/developers/](./packages/docs/content/developers/).
2. Run build + lint + tests locally for the affected packages.
3. Make small commits with tests and documentation updates as needed.
4. Open a PR with references to the developer docs and a short test plan.

## If uncertain

If you're unsure about a rule or a required change, open an issue or a draft PR and ask maintainers for clarification. Link to the specific developer docs page you consulted.

## Related

- Developer docs: [packages/docs/content/developers/](./packages/docs/content/developers/)
