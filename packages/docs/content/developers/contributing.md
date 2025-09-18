---
title: Contributing Guide
description: Guidelines for contributing to CI Dokumentor project
sidebar_position: 5
---

# Contributing

Welcome to CI Dokumentor! We're excited that you're interested in contributing to this project.

## Quick Start

For complete contributing guidelines, please see our main [Contributing Guide](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CODE_OF_CONDUCT.md).

## Developer docs

- [Setup & environment](./setup.md): installation, Node/pnpm, Docker, and IDE tips
- [Testing](./testing.md): vitest usage, coverage, and test patterns
- [Architecture](./architecture.md): package layout and design rationale
- [CI/CD overview](./ci-cd.md): workflows and release pipeline
- [Developer index](./index.md): table of contents for developer docs

## Coding standards

These coding standards are the canonical rules contributors and automated agents must follow. They are intentionally brief; refer to package-level docs for implementation details.

- Naming conventions: use camelCase for variables and functions, and PascalCase for classes and interfaces.
- TypeScript: enable and use strict TypeScript settings; prefer explicit return types for public APIs.
- Apply strict typing and avoid `any` unless absolutely necessary even in tests.
- Types: prefer `interface` for public object shapes, use union types and discriminated unions for variants, and prefer `unknown` over `any` for dynamic inputs.
- Exports: use barrel exports (`index.ts`) to define a package's public API surface.
- Dependencies: prefer `peerDependencies` for shared libraries where appropriate and keep critical runtime versions pinned.
- Error handling: use typed error classes and consider Result/Option types for operations that may fail; provide meaningful error messages and contexts.
- Comments & docs: limit inline comments, explain the "why" not just the "what", and use JSDoc for public APIs.

## Documentation & package readmes

- Each package MUST include a concise `README.md` at the package root. The readme should contain a one-line description, basic usage, and a link to the canonical developer documentation page under `packages/docs/content/` for deeper guidance.
- Keep examples short and focused; prefer linking to the developer docs for full examples and design rationale.
- Use JSDoc for public APIs and explain "why" not just "what" in non-trivial code comments.

## Making Changes

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Make** your changes following the coding standards
4. **Add** tests for new functionality
5. **Run** the full test suite: See [testing.md](./testing.md) for the canonical commands (`pnpm test`, `pnpm test:ci`, using `nx`, and debugging guidance).
6. **Commit** using conventional commits: `feat: add new feature`
7. **Push** to your fork and create a pull request

## Change proposal checklist

Use this short checklist when preparing a change (add it to the PR description):

- List the specific developer docs pages you consulted (for example: [`./testing.md`](./testing.md), [`./ci-cd.md`](./ci-cd.md), [`./architecture.md`](./architecture.md)).
- Run local validation for affected packages: build, lint/typecheck, and unit tests.
- Add or update unit tests for new behavior (happy path + 1-2 edge cases) and update snapshots intentionally.
- Keep commits small and focused; use conventional commits for clear intent.
- Update package `README.md` or `packages/docs/content/` pages when public behavior or APIs change.
- Ensure CI passes; if unsure, open a draft PR or an issue and ask maintainers for clarification.

## Getting Help

- Check existing [issues](https://github.com/hoverkraft-tech/ci-dokumentor/issues)
- Read the [development setup guide](./setup.md)
- Review the [testing documentation](./testing.md)
