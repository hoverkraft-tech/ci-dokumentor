---
title: CI/CD - GitHub Actions Package
description: GitHub Actions-specific CI/CD manifest parsing and documentation generation capabilities.
sidebar_position: 5
---

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
import { GitHubActionsGeneratorAdapter } from "@ci-dokumentor/cicd-github-actions";

class GitHubActionsGeneratorAdapter implements GeneratorAdapter {
  getPlatformName(): string; // Returns 'github-actions'
  supportsSource(source: string): boolean; // Checks if file is supported
  // Generates documentation for the provided source using the provided
  // FormatterAdapter and OutputAdapter. The adapter writes files via the
  // OutputAdapter and does not return the destination path. The higher-level
  // GeneratorService determines the destination (using the adapter's
  // `getDocumentationPath`) and returns it to callers.
  generateDocumentation(args: {
    source: string;
    sections: GenerateSectionsOptions;
    formatterAdapter: FormatterAdapter;
    outputAdapter: OutputAdapter;
    repositoryProvider: RepositoryProvider;
  }): Promise<void>;
}
```

### GitHubActionsParser

Parses GitHub Actions and workflow files:

```typescript
import { GitHubActionsParser } from "@ci-dokumentor/cicd-github-actions";

// Parses action.yml files into GitHubAction objects
// Parses workflow files into GitHubWorkflow objects
// Extracts descriptions from YAML comments at the beginning of files
// For actions: Combines the description field with top comments for extended descriptions
// For workflows: Uses top comments as the description (no description field in manifest)
```

## Section Generators

The package includes the following section generators:

### Core Sections

- **HeaderSectionGenerator** - Action/workflow title and description
- **BadgesSectionGenerator** - Status badges and shields (supports custom badges via `--extra-badges`)
- **OverviewSectionGenerator** - General information and summary

### Action-Specific Sections

- **UsageSectionGenerator** - Usage examples and code snippets
- **InputsSectionGenerator** - Input parameters documentation
- **OutputsSectionGenerator** - Output values documentation

### Workflow-Specific Sections

- **SecretsSectionGenerator** - Required secrets documentation

### Additional Sections

- **ExamplesSectionGenerator** - Detailed usage examples
- **ContributingSectionGenerator** - Contributing guidelines
- **SecuritySectionGenerator** - Security considerations
- **LicenseSectionGenerator** - License information
- **GeneratedSectionGenerator** - CI Dokumentor attribution

## Features

### File Support

Supports parsing of:

- `action.yml` and `action.yaml` files
- GitHub workflow files in `.github/workflows/`
- Action descriptions from both the `description` field and top YAML comments (combined for extended descriptions)
- Workflow descriptions from top YAML comments
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
- Configurable badge sections with support for custom badges

### Badge Generation

The `BadgesSectionGenerator` automatically creates badges for:

- **GitHub Actions Marketplace** - Links to the marketplace page
- **Release badges** - Latest release version from GitHub
- **License badges** - Repository license information
- **Social badges** - GitHub stars count
- **Custom badges** - User-defined badges via CLI options

Custom badges can be added using the `--extra-badges` CLI option, supporting various badge services and custom URLs.

## Container Setup

The package provides dependency injection setup:

```typescript
import { initContainer } from "@ci-dokumentor/cicd-github-actions";

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

[Core Package](/packages/core/) - Base abstractions and services
[Repository Git](/packages/repository/git/) - Git repository functionality
[Repository GitHub](/packages/repository/github/) - GitHub-specific features
[CLI Package](/packages/cli/) - Command-line interface
