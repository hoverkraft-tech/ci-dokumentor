---
sidebar_position: 1
---

# Core Package

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

#### GeneratorService

Manages CI/CD platform adapters and documentation generation:

```typescript
class GeneratorService {
  getSupportedCicdPlatforms(): string[];
  getGeneratorAdapterByPlatform(platform: string): GeneratorAdapter | undefined;
  getSupportedSectionsForPlatform(platform: string): string[];
  autoDetectCicdPlatform(source: string): string | null;
  autoDetectCicdAdapter(source: string): GeneratorAdapter | null;
  generateDocumentationForPlatform(
    adapter: GeneratorAdapter,
    source: string,
    output?: string,
  ): Promise<string>;
}
```

#### FormatterService

Handles content formatting and output adapters:

```typescript
class FormatterService {
  getFormatterAdapterForFile(filePath: string): FormatterAdapter;
  // Additional formatting utilities
}
```

### Interfaces

#### RepositoryProvider

Interface for repository platform providers:

```typescript
interface RepositoryProvider {
  getPlatformName(): string;
  supports(): Promise<boolean>;
  getRepository(): Promise<Repository>;
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
  generateDocumentation(
    source: string,
    formatterAdapter: FormatterAdapter,
    outputAdapter: OutputAdapter,
  ): Promise<void>;
}
```

#### FormatterAdapter

Interface for content formatters:

```typescript
interface FormatterAdapter {
  // Formatting methods for different content types
}
```

#### OutputAdapter

Interface for output handling:

```typescript
interface OutputAdapter {
  // Output methods for writing generated content
}
```

### Adapters

#### MarkdownFormatterAdapter

Provides Markdown-specific formatting capabilities.

#### FileOutputAdapter

Handles file system operations for documentation output.

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

- [CLI Package](./cli) - Command-line interface built on core
- [Repository Git](./repository-git) - Git repository provider implementation
- [Repository GitHub](./repository-github) - GitHub-specific repository provider
- [CI/CD GitHub Actions](./cicd-github-actions) - GitHub Actions manifest parser and generator
