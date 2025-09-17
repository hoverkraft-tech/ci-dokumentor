---
title: Repository - Git Package
description: A minimal, local Git-backed repository provider for CI Dokumentor.
sidebar_position: 3
---

The `@ci-dokumentor/repository-git` package provides a minimal, local Git-backed repository provider used by CI Dokumentor's repository discovery. It exposes a single concrete provider, `GitRepositoryProvider`, and a small DI container module used to register the provider.

This document describes the exact behavior implemented in the package (no extra features are assumed).

## Quick facts

- Package entry: `packages/repository/git/src/index.ts`
- Main provider: `GitRepositoryProvider` (`packages/repository/git/src/git-repository-provider.ts`)
- Container helpers: `initContainer(baseContainer?)` and `resetContainer()` (`packages/repository/git/src/container.ts`)
- Runtime dependencies: `simple-git` (reads local Git state) and `git-url-parse` (parses remote URLs)

## What this provider does

The provider is a small adapter that inspects the local Git repository (via `simple-git`) and extracts canonical repository identity information from the repository's `origin` remote. It does not call remote hosting provider APIs (GitHub/GitLab) and it does not perform network requests beyond what `simple-git` may do when Git itself does.

Behaviour summary:

- getPlatformName(): returns the string `git`.
- getOptions(): returns an empty options descriptor (the provider has no runtime options).
- setOptions(...): no-op (kept for interface compatibility).
- getPriority(): returns `0` (default, low priority for auto-detection).
- supports(): resolves `true` when an `origin` remote with a fetch URL is present; otherwise `false`.
- getRepository(): reads the repository's `origin` fetch URL, parses it with `git-url-parse`, and returns a minimal `Repository` object with the following shape: `{ owner, name, url, fullName }`.
- getRemoteParsedUrl(): public helper that returns the parsed remote URL object from `git-url-parse` for the repository's `origin` remote.

Important implementation details:

- The provider locates remotes using `simple-git().getRemotes(true)` and selects the remote whose `name === 'origin'`.
- If no `origin` remote is found, the internal helper throws an Error with message `No remote "origin" found`. `supports()` catches errors and returns `false` in that case.
- `getRepository()` constructs the returned `url` by calling the parsed URLs `toString('https')` representation and strips a trailing `.git` suffix if present.
- `fullName` is taken from `parsedUrl.full_name` when available; otherwise it is constructed as `${owner}/${name}`.

## Returned Repository shape

The provider returns a minimal repository identity object (the `Repository` type used across the project). The object contains at least:

- owner: string
- name: string
- URL: string (HTTPS form, with any trailing `.git` removed)
- fullName: string (either parsed full_name or `${owner}/${name}`)

The provider intentionally does not populate fields such as description, language, default branch, or commit history. Those belong to higher-level or platform-specific providers.

## Error modes and edge cases

- Missing origin remote: the private helper throws `Error('No remote "origin" found')`. `supports()` returns `false` in that case. Callers of `getRepository()` should expect an exception if the local repository has no origin remote.
- Malformed/unsupported remote URL: `git-url-parse` may throw or return a parsed object missing expected fields; `getRepository()` relies on `parsedUrl.owner` and `parsedUrl.name` and will produce a best-effort `fullName` if `full_name` is absent.
- Non-git directories: `simple-git` calls will surface Git errors; the provider does not try to recover or fallback to network lookups.

## Dependency & integration notes

- This package depends on `simple-git` to query the local repository state (remotes). That means the runtime environment must have Git available and the working directory should be a Git repository for `getRepository()` to succeed.
- `git-url-parse` is used to normalize many Git URL formats (HTTPS, SSH, git://, scp-like) into a canonical parsed object.
- The package exports a tiny container initializer (`initContainer`) that binds `GitRepositoryProvider` and registers it under the repository-provider identifier used by the core container. If a base container is provided to `initContainer`, it uses that container instead of creating a new one. `resetContainer()` resets the package singleton container.

## Usage notes (concise)

- Typical use is to resolve `GitRepositoryProvider` from the DI container or instantiate it and call `getRepository()` to obtain the repository identity for the current working copy. The provider reads the local `origin` remote; it does not take a repository URL as an input to `getRepository()` in the package implementation.

- Example (pseudocode):
  - Resolve a `GitRepositoryProvider` from the container or construct it directly.
  - Call `await provider.getRepository()` to obtain `{ owner, name, url, fullName }` for the local repository's `origin` remote.

## Files to inspect for implementation details

- package entry: `packages/repository/git/src/index.ts` (exports)
- provider implementation: `packages/repository/git/src/git-repository-provider.ts`
- DI helpers: `packages/repository/git/src/container.ts`
- package readme (short): `packages/repository/git/README.md`

## Tests and development

- Tests for the provider live alongside the implementation: `packages/repository/git/src/git-repository-provider.spec.ts`.
- Common development tasks (build/test/lint) follow repository-wide conventions (nx). Use `nx test repository-git` to run the package tests in the monorepo.

## Requirements coverage

- Document the actual implemented behavior of the package: Done
- Avoid duplicating source code snippets verbatim: Done — examples are described at a high level rather than copying implementation
- Ensure correctness and relevance to the repository files: Done — file-by-file mapping provided

---

If you'd like, I can also add a short example that shows how to resolve the provider from the project's IoC container (using the existing core container bindings) — tell me whether you prefer a minimal pseudocode snippet or a concrete code example wired into the repo's container helpers.

```typescript
// Analyze multiple repositories
const repositories = [
  'https://github.com/user/repo1.git',
  'https://github.com/user/repo2.git',
  'https://github.com/user/repo3.git',
];

const repoInfos = await Promise.all(
  repositories.map((url) => provider.getRepository(url)),
);

repoInfos.forEach((repo) => {
  console.log(`${repo.name}: ${repo.description}`);
});
```

## Related Packages

[Core Package](/packages/core/) - Base abstractions and services
[Repository GitHub](/packages/repository/github/) - GitHub-specific repository provider
[CLI Package](/packages/cli/) - Command-line interface
[CI/CD GitHub Actions](/packages/cicd/github-actions/) - GitHub Actions integration

## Contributing

When contributing to the repository-git package:

1. **Test with Various Git Configurations** - Test with different Git setups
2. **Handle Edge Cases** - Empty repositories, shallow clones, etc.
3. **Performance** - Ensure Git operations are efficient
4. **Error Handling** - Provide clear error messages for Git failures
5. **Platform Compatibility** - Test on Windows, macOS, and Linux
