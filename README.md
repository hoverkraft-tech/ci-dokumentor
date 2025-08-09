**⚠️ Work in Progress!**

<p align="center">
  <a href="https://github.com/hoverkraft-tech/ci-dokumentor" target="_blank"><img src="https://repository-images.githubusercontent.com/967387766/5e390ed2-ba9b-447d-bfe9-eb68f6f6a314" width="600" /></a>
</p>

[![Continuous integration](https://github.com/hoverkraft-tech/ci-dokumentor/workflows/Continuous%20integration/badge.svg)](https://github.com/hoverkraft-tech/ci-dokumentor/actions?query=workflow%3A%22Continuous+integration%22)
[![Coverage Status](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor/branch/main/graph/badge.svg)](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor)
[![Latest Stable Version](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/v/stable)](https://packagist.org/packages/hoverkraft-tech/ci-dokumentor)
[![Total Downloads](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/downloads)](https://npm.org/packages/hoverkraft-tech/ci-dokumentor)
[![License](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/license)](https://packagist.org/packages/hoverkraft-tech/ci-dokumentor)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

# CI Dokumentor

📢 **CI Dokumentor** is an automated documentation generator for CI/CD components

## 📖 Documentation

**Complete documentation is available at: [hoverkraft-tech.github.io/ci-dokumentor](https://hoverkraft-tech.github.io/ci-dokumentor)**

### Quick Links

- 🚀 [Getting Started](https://hoverkraft-tech.github.io/ci-dokumentor/docs/getting-started/installation) - Installation and quick start
- 📦 [Packages](https://hoverkraft-tech.github.io/ci-dokumentor/docs/packages/core) - Package documentation
- 🐳 [Docker](https://hoverkraft-tech.github.io/ci-dokumentor/docs/integrations/docker) - Docker integration guide
- 🔧 [GitHub Action](https://hoverkraft-tech.github.io/ci-dokumentor/docs/integrations/github-action) - GitHub Actions integration
- 👨‍💻 [Contributing](https://hoverkraft-tech.github.io/ci-dokumentor/docs/developers/contributing) - How to contribute

## Overview

CI Dokumentor helps you generate comprehensive, professional documentation for your CI/CD workflows, actions, and configurations automatically.

### What is CI Dokumentor?

CI Dokumentor is a powerful TypeScript-based tool that:

- 📖 **Generates documentation** from CI/CD configuration files (GitHub Actions, workflows, etc.)
- 🏗️ **Clean Architecture** - Built with SOLID principles and clean architecture patterns  
- 🔧 **Extensible** - Easy to add support for new CI/CD platforms
- 🐳 **Docker Ready** - Available as a Docker image for easy integration
- 🚀 **GitHub Action** - Can be used directly in GitHub workflows
- 📋 **CLI Tool** - Command-line interface for local usage

### Supported Platforms

#### CI/CD Platforms
- ✅ **GitHub Actions** - Action files (`action.yml`) and workflow files (`.github/workflows/*.yml`)
- 🔄 **More platforms coming** - GitLab CI, Jenkins, Azure Pipelines planned

#### Repository Platforms  
- ✅ **GitHub** - Repository information and metadata
- ✅ **Git** - Basic repository information
- 🔄 **More platforms coming** - GitLab, Bitbucket planned

## Quick Start

Choose your preferred method to get started:

### Using Docker (Recommended)

```bash
# Generate documentation for a GitHub Action
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /workspace/docs
```

### Using NPX

```bash
# Install and run CI Dokumentor
npx ci-dokumentor action.yml --output docs
```

### In GitHub Actions

```yaml
- name: Generate CI Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: 'action.yml --output docs'
```

**📖 For detailed installation instructions and usage examples, visit our [complete documentation](https://hoverkraft-tech.github.io/ci-dokumentor).**

## Usage

### Writing

### Linting

## Supported CI/CD components

### GitHub Actions

#### Actions

#### Workflows

## Integrations

### Npm package

```bash
npx ci-dokumentor /path/to/ci-cd/component.yml
```

### Docker

CI Dokumentor is available as a Docker image that provides a lightweight, containerized way to generate documentation for your CI/CD components.

#### Quick Start

```bash
# Show available options
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor:latest --help

# Generate documentation from CI/CD file
docker run --rm -v $(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/.github/workflows/ci.yml --output /workspace/docs
```

#### GitHub Actions Integration

```yaml
- name: Generate CI Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: '.github/workflows/ci.yml --output docs'
```

#### GitLab CI Integration

```yaml
generate-docs:
  stage: docs
  image: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  script:
    - ci-dokumentor .gitlab-ci.yml --output docs
  artifacts:
    paths:
      - docs/
```

#### Dagger.io Integration

```go
func (m *MyModule) GenerateDocs(ctx context.Context, source *dagger.Directory) *dagger.Directory {
    return dag.Container().
        From("ghcr.io/hoverkraft-tech/ci-dokumentor:latest").
        WithMountedDirectory("/workspace", source).
        WithWorkdir("/workspace").
        WithExec([]string{"ci-dokumentor", ".github/workflows/ci.yml", "--output", "docs"}).
        Directory("docs")
}
```

> **📖 Full Documentation**: See [docker/README.md](docker/README.md) for complete Docker usage guide, troubleshooting, and advanced configurations.

### GitHub Action

## Author

👤 **[Hoverkraft](https://hoverkraft.cloud)**

- Site: <https://hoverkraft.cloud>
- GitHub: [@escemi-tech](https://github.com/hoverkraft-tech)

## 📝 License

Copyright © 2020 [Hoverkraft](https://hoverkraft.cloud).<br />
This project is [MIT](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/LICENSE) licensed.
