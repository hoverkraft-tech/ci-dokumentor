---
sidebar_position: 1
---

# Introduction

Welcome to **CI Dokumentor** - an automated documentation generator for CI/CD components.

## What is CI Dokumentor?

CI Dokumentor is a powerful TypeScript-based tool that automatically generates comprehensive, professional documentation for your CI/CD manifests (workflows, actions, components, configurations...). It supports multiple CI/CD platforms and repository providers, making it easy to maintain up-to-date documentation for your DevOps processes.

### Key Features

- 📖 **Automated Generation** - Convert CI/CD manifest files into professional documentation
- 🔧 **Extensible Design** - Easy to add support for new CI/CD platforms
- 🐳 **Docker Ready** - Available as a Docker image for easy integration
- 🚀 **GitHub Action** - Can be used directly in GitHub workflows
- 📋 **Command-line tool** - Command-line interface for local usage

## Quick Start

### Run Locally

#### Installation

Choose your preferred installation method:

**Docker (Recommended):**

```bash
docker pull ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
```

**NPX (No Installation):**

```bash
npx ci-dokumentor --help
```

**NPM Global:**

```bash
# Using npm
npm install -g @ci-dokumentor/cli

# or using pnpm (global install)
pnpm add -g @ci-dokumentor/cli
```

Note: For end users we recommend Docker or NPX for quick, reproducible runs. For contributors working in this repository prefer pnpm workspace commands and building the CLI locally.

#### Generate Your First Documentation

Create a simple GitHub Action file and generate its documentation:

```yaml title="action.yml"
name: 'Hello World Action'
description: 'A simple action that greets the world'
inputs:
  who-to-greet:
    description: 'Who to greet'
    required: true
    default: 'World'
outputs:
  time:
    description: 'The time we greeted you'
runs:
  using: 'node20'
  main: 'index.js'
```

**Generate documentation:**

```bash
# Using Docker
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml

# Using NPX
npx ci-dokumentor generate --source action.yml

# Using CLI
ci-dokumentor generate --source action.yml
```

### Using a CI/CD platform

Integrate CI Dokumentor into your CI/CD pipeline:

- ✅ [**GitHub Actions**](./integrations/github-action.md) - GitHub Action files (`action.yml`) and workflow files (`.github/workflows/*.yml`)
- 🚧 [**GitLab CI**](./integrations/gitlab-ci.md) - GitLab CI Component files (`templates/my-component.yml`)
- 🚧 [**Dagger.io**](./integrations/dagger.md) - Dagger.io Module files (`dagger.json`)

## CLI Usage

The main command is `generate` with these key options:

- `--source <file>` - Source manifest file path to handle (required)
- `--destination <file>` - Destination file path for generated documentation (auto-detected if not specified)
- `--repository <platform>` - Repository platform (auto-detected)
- `--cicd <platform>` - CI/CD platform (auto-detected)
- `--output-format <format>` - Output format: `text`, `json`, `github-action` (Optional; default: `text`)

> **📖 Full Documentation**: For more details on CLI usage, see our [CLI documentation](./packages/cli).

## Supported Repository Platforms

- ✅ **Git** - Basic repository information
- ✅ **GitHub** - GitHub Repository information and metadata
- 🚧 **GitLab** - GitLab Repository information and metadata

## Next Steps

For detailed information, explore these guides:

- 🐳 [Docker Integration](./integrations/docker) - Advanced Docker usage patterns
- 🐙 [GitHub Actions](./integrations/github-action) - GitHub Actions integration guide
- 🦊 [GitLab CI](./integrations/gitlab-ci) - GitLab CI integration guide
- 🗡️ [Dagger.io](./integrations/dagger) - Dagger.io integration guide
- 💻 [CLI Package](./packages/cli) - Complete command-line reference
- 📦 [Core Architecture](./packages/core) - Learn about the internal architecture
- 👨‍💻 [Developer Guide](./developers/contributing) - Contribute to the project
