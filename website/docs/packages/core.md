---
sidebar_position: 1
---

# Core Package

The `@ci-dokumentor/core` package contains the fundamental building blocks and abstractions that power the entire CI Dokumentor ecosystem.

## Overview

The core package follows clean architecture principles, providing:

- **Interfaces and Abstractions** - Core contracts for extensibility
- **Base Services** - Common functionality shared across packages  
- **Domain Models** - Core business logic and entities
- **Utilities** - Helper functions and formatters

## Key Components

### Interfaces

#### IRepositoryProvider
Defines the contract for repository information providers:

```typescript
interface IRepositoryProvider {
  getRepository(url: string): Promise<Repository>;
  supportsUrl(url: string): boolean;
}
```

#### IManifestParser
Defines the contract for CI/CD manifest parsers:

```typescript
interface IManifestParser {
  parse(filePath: string): Promise<Manifest>;
  supportsFile(filePath: string): boolean;
}
```

#### IDocumentationGenerator
Defines the contract for documentation generators:

```typescript
interface IDocumentationGenerator {
  generate(manifest: Manifest, repository: Repository): Promise<string>;
}
```

### Core Services

#### RepositoryService
Manages repository information and metadata:

```typescript
class RepositoryService {
  async getRepositoryInfo(url: string): Promise<Repository>
  async getLicenseInfo(repository: Repository): Promise<License>
  async getOwnerInfo(repository: Repository): Promise<Owner>
}
```

**Features:**
- Repository URL parsing and validation
- License detection and information extraction
- Owner/organization information retrieval
- Platform-agnostic repository operations

#### FormatterService
Handles content formatting and templating:

```typescript
class FormatterService {
  format(template: string, data: object): string
  formatMarkdown(content: string): string
  formatTable(headers: string[], rows: string[][]): string
}
```

**Features:**
- Template-based content generation
- Markdown formatting utilities
- Table generation and formatting
- Content sanitization

### Adapters

#### MarkdownFormatterAdapter
Provides Markdown-specific formatting:

```typescript
class MarkdownFormatterAdapter implements IFormatter {
  formatHeading(text: string, level: number): string
  formatCode(code: string, language?: string): string
  formatTable(headers: string[], rows: string[][]): string
  formatList(items: string[], ordered?: boolean): string
}
```

#### FileOutputAdapter
Handles file system operations:

```typescript
class FileOutputAdapter implements IOutputAdapter {
  writeFile(path: string, content: string): Promise<void>
  ensureDirectory(path: string): Promise<void>
  exists(path: string): Promise<boolean>
}
```

### Domain Models

#### Repository
Core repository information model:

```typescript
interface Repository {
  name: string;
  description?: string;
  url: string;
  owner: string;
  defaultBranch: string;
  license?: License;
  topics?: string[];
  language?: string;
}
```

#### Manifest
CI/CD manifest representation:

```typescript
interface Manifest {
  name: string;
  description?: string;
  author?: string;
  type: ManifestType;
  inputs?: Input[];
  outputs?: Output[];
  runs?: RunsConfig;
  metadata?: Record<string, any>;
}
```

#### License
License information model:

```typescript
interface License {
  name: string;
  spdxId?: string;
  url?: string;
  content?: string;
}
```

## Dependency Injection

The core package uses [InversifyJS](https://inversify.io/) for dependency injection:

### Container Setup

```typescript
import { Container } from 'inversify';
import { TYPES } from './types';

const container = new Container();

// Bind services
container.bind<IRepositoryProvider>(TYPES.RepositoryProvider)
  .to(GitRepositoryProvider);

container.bind<IFormatterService>(TYPES.FormatterService)
  .to(FormatterService);

export { container };
```

### Service Types

```typescript
export const TYPES = {
  // Services
  RepositoryService: Symbol.for('RepositoryService'),
  FormatterService: Symbol.for('FormatterService'),
  
  // Providers
  RepositoryProvider: Symbol.for('RepositoryProvider'),
  ManifestParser: Symbol.for('ManifestParser'),
  
  // Adapters
  OutputAdapter: Symbol.for('OutputAdapter'),
  FormatterAdapter: Symbol.for('FormatterAdapter'),
} as const;
```

## Usage Examples

### Basic Service Usage

```typescript
import { container } from '@ci-dokumentor/core';
import { TYPES } from '@ci-dokumentor/core';

// Get repository information
const repositoryService = container.get<RepositoryService>(TYPES.RepositoryService);
const repository = await repositoryService.getRepositoryInfo('https://github.com/user/repo');

// Format content
const formatter = container.get<FormatterService>(TYPES.FormatterService);
const formattedContent = formatter.format('Hello {{name}}!', { name: 'World' });
```

### Extending with Custom Providers

```typescript
// Custom repository provider
class MyRepositoryProvider implements IRepositoryProvider {
  async getRepository(url: string): Promise<Repository> {
    // Custom implementation
  }
  
  supportsUrl(url: string): boolean {
    return url.includes('my-platform.com');
  }
}

// Register custom provider
container.bind<IRepositoryProvider>(TYPES.RepositoryProvider)
  .to(MyRepositoryProvider)
  .whenTargetNamed('my-platform');
```

## Error Handling

The core package provides standardized error types:

```typescript
// Base error class
class CiDokumentorError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

// Specific error types
class RepositoryNotFoundError extends CiDokumentorError {
  constructor(url: string) {
    super(`Repository not found: ${url}`, 'REPOSITORY_NOT_FOUND');
  }
}

class ManifestParseError extends CiDokumentorError {
  constructor(path: string, cause: Error) {
    super(`Failed to parse manifest: ${path}`, 'MANIFEST_PARSE_ERROR');
  }
}
```

## Testing

The core package includes comprehensive test utilities:

### Test Builders

```typescript
// Repository builder for tests
const testRepository = new RepositoryBuilder()
  .withName('test-repo')
  .withOwner('test-owner')
  .withDescription('Test repository')
  .build();

// Manifest builder for tests  
const testManifest = new ManifestBuilder()
  .withName('test-action')
  .withType(ManifestType.GitHubAction)
  .withInput('input1', 'Test input', true)
  .build();
```

### Mock Services

```typescript
// Mock repository provider
const mockRepositoryProvider = mock<IRepositoryProvider>();
when(mockRepositoryProvider.getRepository(anything()))
  .thenResolve(testRepository);

// Use in tests
container.rebind<IRepositoryProvider>(TYPES.RepositoryProvider)
  .toConstantValue(instance(mockRepositoryProvider));
```

## Building

```bash
# Build the core package
nx build core

# Run tests
nx test core

# Run linting
nx lint core
```

## API Reference

For complete API documentation, see the TypeScript definitions in the package source code.

## Related Packages

- [CLI Package](./cli) - Command-line interface built on core
- [Repository Git](./repository-git) - Git repository provider implementation
- [Repository GitHub](./repository-github) - GitHub-specific repository provider
- [CI/CD GitHub Actions](./cicd-github-actions) - GitHub Actions manifest parser and generator