---
title: Architecture Overview
description: Comprehensive overview of CI Dokumentor's architecture and design patterns
sidebar_position: 3
---

This document describes the separation of concerns between repository platforms and CI/CD platforms in the ci-dokumentor project.

## Overview

The codebase has been refactored to separate:

- **Repository platforms**: Handle repository-specific functionality (GitHub, GitLab, Git)
- **CI/CD platforms**: Handle CI/CD manifest parsing and generation (GitHub Actions, GitLab CI, etc.)

## Package Structure

```text
packages/
├── core/                              # Core abstractions and base services
├── repository/
│   └── github/                        # GitHub repository platform
├── cicd/
│   └── github-actions/                # GitHub Actions CI/CD platform
└── cli/                               # CLI application
```

## Core Architecture Patterns

### ReaderAdapter Pattern

The core package uses the ReaderAdapter pattern to abstract file system operations:

- **ReaderAdapter Interface**: Defines methods for reading operations on resources and resource containers (files, directories...)
- **FileReaderAdapter**: Concrete implementation for file system reading with graceful error handling

This pattern separates reading concerns from rendering logic and enables easy mocking in tests.

## Repository Platforms

Located in `packages/repository/`, these packages handle:

- Repository information extraction
- Platform-specific metadata (logos, descriptions, etc.)
- Repository URL parsing and validation

### GitHub Repository Platform (`packages/repository/github/`)

- **GitHubRepositoryService**: Extends the core RepositoryService with GitHub-specific features
- **GitHubRepository**: Type extending Repository with GitHub-specific properties (logo)

## CI/CD Platforms

Located in `packages/cicd/`, these packages handle:

- CI/CD manifest parsing (action.yml, workflow files)
- Documentation generation for CI/CD workflows
- Platform-specific section generators

### GitHub Actions CI/CD Platform (`packages/cicd/github-actions/`)

- **GitHubActionsParser**: Parses GitHub Actions and workflow files
- **GitHubActionsGeneratorAdapter**: Generates documentation for GitHub Actions
- **Section Generators**: Various section generators for different parts of documentation

## Dependency Management

The packages have a hierarchical dependency structure:

1. **Core** - Base abstractions
2. **Repository Platforms** - Depend on Core
3. **CI/CD Platforms** - Depend on Core and Repository Platforms
4. **Wrapper Packages** - Combine multiple platforms for convenience

## Container Initialization

Each package provides its own container initialization:

```typescript
// Repository platform
import { initContainer } from '@ci-dokumentor/repository-github';

// CI/CD platform (includes repository platform dependencies)
import { initContainer } from '@ci-dokumentor/cicd-github-actions';
```

## Benefits

This separation enables:

1. **Modularity**: Each platform can be developed and tested independently
2. **Extensibility**: New platforms can be added without affecting existing ones
3. **Maintainability**: Clear separation of concerns
4. **Reusability**: Repository platforms can be shared across different CI/CD platforms

## Future Extensions

This architecture supports adding:

- **Repository Platforms**: GitLab, Bitbucket, Azure DevOps
- **CI/CD Platforms**: GitLab CI, Jenkins, Azure Pipelines, Dagger.io

Each new platform would follow the same pattern and integrate seamlessly with the existing architecture.
