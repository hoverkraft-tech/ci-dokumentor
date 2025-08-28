---
sidebar_position: 5
---

# CI/CD GitHub Actions Package

The `@ci-dokumentor/cicd-github-actions` package provides GitHub Actions-specific CI/CD manifest parsing and documentation generation capabilities.

## Overview

This package provides:

- **GitHub Actions Parser** - Parses `action.yml` and workflow files
- **Documentation Generator** - Generates comprehensive documentation for GitHub Actions
- **Section Generators** - Modular documentation section generators
- **Workflow Support** - Handles both actions and workflows

## Installation

```bash
# Usually installed as a dependency of other packages
npm install @ci-dokumentor/cicd-github-actions
```

## Key Components

### GitHubActionsGeneratorAdapter

The main generator adapter for GitHub Actions:

```typescript
import { GitHubActionsGeneratorAdapter } from '@ci-dokumentor/cicd-github-actions';

class GitHubActionsGeneratorAdapter implements GeneratorAdapter {
  getPlatformName(): string; // Returns 'github-actions'
  supportsSource(source: string): boolean; // Checks if file is supported
  // Generates documentation for the provided source using the provided
  // FormatterAdapter and OutputAdapter. The adapter writes files via the
  // OutputAdapter and does not return the destination path. The higher-level
  // GeneratorService determines the destination (using the adapter's
  // `getDocumentationPath`) and returns it to callers.
  generateDocumentation(
    source: string,
    formatterAdapter: FormatterAdapter,
    outputAdapter: OutputAdapter,
  ): Promise<void>;
}
```

### GitHubActionsParser

Parses GitHub Actions and workflow files:

```typescript
import { GitHubActionsParser } from '@ci-dokumentor/cicd-github-actions';

// Parses action.yml files into GitHubAction objects
// Parses workflow files into GitHubWorkflow objects
```

## Section Generators

The package includes the following section generators:

### Core Sections

- **HeaderSectionGenerator** - Action/workflow title and description
- **OverviewSectionGenerator** - General information and summary
- **BadgesSectionGenerator** - Status badges and shields
- **ContentsTable** - Table of contents for navigation

### Action-Specific Sections

- **InputsSectionGenerator** - Input parameters documentation
- **OutputsSectionGenerator** - Output values documentation
- **UsageSectionGenerator** - Usage examples and code snippets
- **ExamplesSectionGenerator** - Detailed usage examples

### Workflow-Specific Sections

- **JobsSectionGenerator** - Job definitions and descriptions
- **SecretsSectionGenerator** - Required secrets documentation

### Additional Sections

- **SecuritySectionGenerator** - Security considerations
- **LicenseSectionGenerator** - License information
- **ContributingSectionGenerator** - Contributing guidelines

## Features

### File Support

Supports parsing of:

- `action.yml` and `action.yaml` files
- GitHub workflow files in `.github/workflows/`
- Composite actions
- Docker-based actions
- JavaScript/TypeScript actions

### Documentation Generation

Generates:

- Comprehensive README.md files
- Usage examples with proper YAML syntax
- Input/output parameter tables
- Security considerations
- Contributing guidelines

## Container Setup

The package provides dependency injection setup:

```typescript
import { initContainer } from '@ci-dokumentor/cicd-github-actions';

// Initialize container with GitHub Actions support
const container = initContainer();
```

## Dependencies

- `@ci-dokumentor/core` - Core abstractions and services
- `@ci-dokumentor/repository-git` - Git repository functionality
- `@ci-dokumentor/repository-github` - GitHub repository features
- `js-yaml` - YAML parsing
- `inversify` - Dependency injection

## Related Packages

- [Core Package](./core) - Base abstractions and services
- [Repository Git](./repository-git) - Git repository functionality
- [Repository GitHub](./repository-github) - GitHub-specific features
- [CLI Package](./cli) - Command-line interface
