---
title: Repository - GitLab Package
description: A GitLab repository provider for CI Dokumentor, integrating with GitLab's API for enhanced repository data.
sidebar_position: 4
---

The `@ci-dokumentor/repository-gitlab` package provides GitLab-specific repository information and features, extending the base Git repository functionality.

## Features

- **GitLab API Integration** - Uses @gitbeaker/rest for comprehensive GitLab API access
- **Multi-Instance Support** - Works with GitLab.com and self-hosted GitLab instances
- **Enhanced Metadata** - Fetches project avatar, license information, and more
- **Authentication** - Optional token-based authentication for private repositories
- **Auto-Detection** - Automatically detects GitLab repositories

## Installation

```bash
npm install @ci-dokumentor/repository-gitlab
```

## Configuration

### Environment Variables

- `GITLAB_TOKEN` - Optional GitLab personal access token
- `GITLAB_URL` - GitLab instance URL (defaults to `https://gitlab.com`)

### CLI Options

- `--gitlab-token <token>` - GitLab personal access token
- `--gitlab-url <url>` - GitLab instance URL for self-hosted instances

## Usage

The GitLab repository provider is automatically registered and will be used for GitLab repositories when the package is imported.

```typescript
import "@ci-dokumentor/repository-gitlab";
```

## Authentication

For private repositories or to avoid rate limits, provide a GitLab personal access token:

```bash
# Via environment variable
export GITLAB_TOKEN=your_gitlab_token

# Via CLI option
ci-dokumentor generate --gitlab-token your_gitlab_token
```

## Self-Hosted GitLab

For self-hosted GitLab instances:

```bash
# Via environment variable
export GITLAB_URL=https://gitlab.yourcompany.com

# Via CLI option
ci-dokumentor generate --gitlab-url https://gitlab.yourcompany.com
```

## Features Provided

- **Project Information** - Owner, name, description, URL
- **Project Avatar** - Automatically fetches project avatar/logo
- **License Detection** - Reads license information from GitLab API
- **Contributing Guidelines** - Links to CONTRIBUTING.md files
- **Security Policy** - Links to SECURITY.md files
- **Version Detection** - Git tag and branch information
