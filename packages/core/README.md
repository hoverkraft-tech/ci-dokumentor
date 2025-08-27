# core

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build core` to build the library.

## Running unit tests

Run the repository test target which uses Vitest. The canonical command is managed by Nx and the workspace scripts; use the workspace-level test runner so all packages are tested consistently.

• Testing information and canonical commands live in the centralized developer testing guide: `../docs/content/developers/testing.md` (use `pnpm test`, `nx test core`, `pnpm test:ci` etc.).
• Run only the core package tests via Nx: `nx test core`.

Test files are located next to implementation files under `packages/core/src` and use the `.spec.ts` suffix (for example `packages/core/src/.../*.spec.ts`). Prefer referencing those spec files rather than duplicating test code in documentation.
