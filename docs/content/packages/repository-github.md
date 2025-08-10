---
sidebar_position: 4
---

# Repository GitHub Package

The `@ci-dokumentor/repository-github` package provides GitHub-specific repository information and features, extending the base Git repository functionality.

## Overview

This package provides:

- **GitHub Repository Detection** - Determines if a repository is hosted on GitHub
- **GraphQL API Integration** - Fetches repository metadata using GitHub's GraphQL API
- **License Information** - Retrieves license details from GitHub
- **Repository Metadata** - Basic repository information like name, description, URL

## Installation

```bash
# Usually installed as a dependency of other packages
npm install @ci-dokumentor/repository-github
```

## Key Components

### GitHubRepositoryProvider

The main service for GitHub repository operations:

```typescript
import { GitHubRepositoryProvider } from '@ci-dokumentor/repository-github';

class GitHubRepositoryProvider implements RepositoryProvider {
  getPlatformName(): string; // Returns 'github'
  supports(): Promise<boolean>; // Checks if repository is hosted on GitHub
  getRepository(): Promise<Repository>; // Gets repository information
}
```

## Features

### Platform Detection

The provider automatically detects GitHub repositories by checking remote URLs:

```typescript
// Checks if current repository is hosted on GitHub
const isGitHub = await provider.supports();
```

### Repository Information

Fetches comprehensive repository data:

- Repository name and description
- Owner information
- License details
- Repository URL and metadata

### GraphQL Integration

Uses GitHub's GraphQL API for efficient data fetching with proper error handling and authentication support.

## Container Setup

The package provides dependency injection setup:

```typescript
import { initContainer } from '@ci-dokumentor/repository-github';

// Initialize container with GitHub repository provider
const container = initContainer();
```

## Dependencies

- `@ci-dokumentor/core` - Core abstractions and services
- `@ci-dokumentor/repository-git` - Base Git repository functionality
- `@octokit/graphql` - GitHub GraphQL API client
- `inversify` - Dependency injection container

## Related Packages

- [Core Package](./core) - Base abstractions and services
- [Repository Git](./repository-git) - Base Git repository functionality
- [CI/CD GitHub Actions](./cicd-github-actions) - GitHub Actions integration
- [CLI Package](./cli) - Command-line interface
