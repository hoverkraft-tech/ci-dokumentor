---
sidebar_position: 1
---

# Introduction

Welcome to **CI Dokumentor** - an automated documentation generator for CI/CD components.

## What is CI Dokumentor?

CI Dokumentor is a powerful TypeScript-based tool that automatically generates comprehensive, professional documentation for your CI/CD workflows, actions, and configurations.

### Key Features

- 📖 **Automated Generation** - Convert CI/CD configuration files into professional documentation
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
npm install -g @ci-dokumentor/cli
```

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
  generate --source /workspace/action.yml --output /workspace/docs

# Using NPX
npx ci-dokumentor generate --source action.yml --output docs

# Using CLI
ci-dokumentor generate --source action.yml --output docs
```

### Using a CI/CD platform

Integrate CI Dokumentor into your CI/CD pipeline:

- ✅ [**GitHub Actions**](./integrations/github-action.md) - Action files (`action.yml`) and workflow files (`.github/workflows/*.yml`)
- 🚧 [**GitLab CI**](./integrations/gitlab-ci.md) - GitLab CI configuration files (`.gitlab-ci.yml`)
- 🚧 [**Dagger.io**](./integrations/dagger.md) - Dagger.io configuration files (`dagger.yml`)

## CLI Usage

The main command is `generate` with these key options:

- `--source <file>` - Source manifest file path to handle (required)
- `--output <dir>` - Output directory (optional; destination is auto-detected by the CI/CD adapter when omitted)
- `--repository <platform>` - Repository platform (auto-detected)
- `--cicd <platform>` - CI/CD platform (auto-detected)

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
