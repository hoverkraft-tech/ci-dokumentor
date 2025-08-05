# Repository Platforms vs CI/CD Platforms Architecture

This document describes the separation of concerns between repository platforms and CI/CD platforms in the ci-dokumentor project.

## Overview

The codebase has been refactored to separate:
- **Repository platforms**: Handle repository-specific functionality (GitHub, GitLab, Git)
- **CI/CD platforms**: Handle CI/CD manifest parsing and generation (GitHub Actions, GitLab CI, etc.)

## Package Structure

```
packages/
├── core/                              # Core abstractions and base services
├── repository-platforms/
│   └── github/                        # GitHub repository platform
├── cicd-platforms/
│   └── github-actions/                # GitHub Actions CI/CD platform
├── github-actions/                    # Convenience wrapper package
└── cli/                               # CLI application
```

## Repository Platforms

Located in `packages/repository-platforms/`, these packages handle:
- Repository information extraction
- Platform-specific metadata (logos, descriptions, etc.)
- Repository URL parsing and validation

### GitHub Repository Platform (`packages/repository-platforms/github/`)

- **GitHubRepositoryService**: Extends the core RepositoryService with GitHub-specific features
- **GitHubRepository**: Type extending Repository with GitHub-specific properties (logo)

## CI/CD Platforms

Located in `packages/cicd-platforms/`, these packages handle:
- CI/CD manifest parsing (action.yml, workflow files)
- Documentation generation for CI/CD workflows
- Platform-specific section generators

### GitHub Actions CI/CD Platform (`packages/cicd-platforms/github-actions/`)

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
import { initContainer } from '@ci-dokumentor/repository-platforms-github';

// CI/CD platform (includes repository platform)
import { initContainer } from '@ci-dokumentor/cicd-platforms-github-actions';

// Combined convenience package
import { initGitHubActionsContainer } from '@ci-dokumentor/github-actions';
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