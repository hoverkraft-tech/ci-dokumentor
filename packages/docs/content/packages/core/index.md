---
title: Core Package
description: Fundamental building blocks and abstractions powering the CI Dokumentor ecosystem.
sidebar_position: 1
---

The `@ci-dokumentor/core` package contains the fundamental building blocks and abstractions that power the entire CI Dokumentor ecosystem.

## Overview

The core package provides:

- **Services** - Core business logic and orchestration
- **Adapters** - Interface implementations for various platforms
- **Interfaces** - Contracts for extensibility
- **Dependencies** - Dependency injection container setup

## Key Components

### Services

#### RepositoryService

Manages repository information and platform detection:

```typescript
class RepositoryService {
  getSupportedRepositoryPlatforms(): string[];
  autoDetectRepositoryPlatform(): Promise<string | null>;
  getRepository(): Promise<Repository>;
}
```

**Repository Model:**

```typescript
type Repository = {
  owner: string;
  name: string;
  url: string;
  fullName: string; // owner/name format
  logo?: string;
  license?: {
    name: string;
    spdxId: string | null;
    url: string | null;
  };
};
```

**Note**: The runtime `Repository` type in source also includes optional `contributing` metadata (a small object with a `url` field) used by some generator adapters.

#### GeneratorService

Manages CI/CD platform adapters and documentation generation

#### FormatterService

Handles content formatting and output adapters

### Interfaces

#### RepositoryProvider

Interface for repository platform providers:

```typescript
interface RepositoryProvider<
  Options extends RepositoryOptions = RepositoryOptions,
> {
  getPlatformName(): string;

  /**
   * Priority used during auto-detection. Higher values are checked first.
   */
  getPriority(): number;

  /**
   * Check whether this provider supports the current repository context
   */
  supports(): Promise<boolean>;

  /**
   * Return repository information
   */
  getRepository(): Promise<Repository>;

  /**
   * Optional: provide CLI option descriptors specific to this provider
   */
  getOptions(): RepositoryOptionsDescriptors<Options>;

  /**
   * Optional: apply runtime option values to the provider
   */
  setOptions(options: Partial<Options>): void;
}
```

#### GeneratorAdapter

Interface for CI/CD platform adapters:

```typescript
interface GeneratorAdapter {
  getPlatformName(): string;

  getSupportedSections(): string[];

  supportsSource(source: string): boolean;

  getDocumentationPath(source: string): string;

  generateDocumentation(args: {
    source: string;
    sections: GenerateSectionsOptions;
    rendererAdapter: RendererAdapter;
    repositoryProvider: RepositoryProvider;
  }): Promise<void>;
}
```

#### FormatterAdapter

Interface for content formatters:

```typescript
interface FormatterAdapter {
  supportsLanguage(language: FormatterLanguage): boolean;

  heading(input: ReadableContent, level?: number): ReadableContent;

  center(input: ReadableContent): ReadableContent;

  comment(input: ReadableContent): ReadableContent;

  paragraph(input: ReadableContent): ReadableContent;

  bold(input: ReadableContent): ReadableContent;

  italic(input: ReadableContent): ReadableContent;

  code(input: ReadableContent, language?: ReadableContent): ReadableContent;

  inlineCode(input: ReadableContent): ReadableContent;

  link(text: ReadableContent, url: ReadableContent): ReadableContent;

  image(
    url: ReadableContent,
    altText: ReadableContent,
    options?: { width?: string; align?: string },
  ): ReadableContent;

  table(headers: ReadableContent[], rows: ReadableContent[][]): ReadableContent;

  badge(
    label: ReadableContent,
    message: ReadableContent,
    color?: ReadableContent,
  ): ReadableContent;

  lineBreak(): ReadableContent;
}
```

##### MarkdownFormatterAdapter

Provides Markdown-specific formatting capabilities.

#### RendererAdapter

Interface for rendering/finalization adapters (used by generator adapters to produce output or diffs):

```typescript
interface RendererAdapter {
  initialize(
    destination: string,
    formatterAdapter: FormatterAdapter,
  ): Promise<void>;

  getFormatterAdapter(): FormatterAdapter;

  writeSection(sectionIdentifier: string, data: ReadableContent): Promise<void>;

  /**
   * Finalize rendering and return an optional string (for example a diff)
   */
  finalize(): Promise<string | undefined>;
}
```

##### FileRendererAdapter

Handles file system operations for documentation output.

##### DiffRendererAdapter

Generates diffs between existing and new documentation.

## Dependency Injection

The core package uses [InversifyJS](https://inversify.io/) for dependency injection. The container is set up in `container.ts` and provides bindings for all services and adapters.

## Usage

The core package is used by other packages in the CI Dokumentor ecosystem:

- **CLI Package** - Uses `RepositoryService` and `GeneratorService` for command execution
- **Repository Packages** - Implement `RepositoryProvider` interface
- **CI/CD Packages** - Implement `GeneratorAdapter` interface

## Building

```bash
# Build the core package
nx build core

# Run tests
nx test core

# Run linting
nx lint core
```

### Testing

Testing for the core package is covered by the centralized developer testing guide: `../developers/testing` (see `packages/docs/content/developers/testing.md`). For package-specific tests, open the spec files under `packages/core/src/**/*.spec.ts`.

## Related Packages

- [CLI Package](/packages/cli/) - Command-line interface built on core
- [Repository Git](/packages/repository/git/) - Git repository provider implementation
- [Repository GitHub](/packages/repository/github/) - GitHub-specific repository provider
- [CI/CD GitHub Actions](/packages/cicd/github-actions/) - GitHub Actions manifest parser and generator
