# CI Dokumentor

**⚠️ Work in Progress!**

<p align="center">
  <a href="https://github.com/hoverkraft-tech/ci-dokumentor" target="_blank"><img src="https://repository-images.githubusercontent.com/967387766/275872f7-f4bc-40f8-b3d2-4a39496728bc" width="600" alt="CI Dokumentor - Automated documentation generator for CI/CD components" /></a>
</p>

[![Continuous Integration](https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml/badge.svg)](https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml)
[![Coverage Status](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor/branch/main/graph/badge.svg)](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor)
[![Latest Stable Version](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/v/stable)](https://packagist.org/packages/hoverkraft-tech/ci-dokumentor)
[![Total Downloads](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/downloads)](https://npm.org/packages/hoverkraft-tech/ci-dokumentor)
[![License](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/license)](https://packagist.org/packages/hoverkraft-tech/ci-dokumentor)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

📢 **CI Dokumentor** is an automated documentation generator for CI/CD components

## 📖 Documentation

**Complete documentation is available at: [hoverkraft-tech.github.io/ci-dokumentor](https://hoverkraft-tech.github.io/ci-dokumentor)**

### Quick Links

- 🚀 [Getting Started](./docs/content/getting-started/installation.md) - Installation and quick start
- 📦 [Packages](./docs/content/packages/core.md) - Package documentation
- 🐳 [Docker](./docs/content/integrations/docker.md) - Docker integration guide
- 🔧 [GitHub Action](./docs/content/integrations/github-action.md) - GitHub Actions integration
- 👨‍💻 [Contributing](./docs/content/developers/contributing.md) - How to contribute

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
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest --help

# Generate documentation from CI/CD file
docker run --rm -v $(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
generate --source /workspace/.github/workflows/ci.yml
```

#### GitHub Actions Integration

Using the GitHub Action:

```yaml
- name: Generate CI Documentation
  uses: hoverkraft-tech/ci-dokumentor@main
  with:
    args: 'generate .github/workflows/ci.yml --output docs'
```

Or using the Docker image directly:

```yaml
- name: Generate CI Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
  with:
    args: 'generate --source .github/workflows/ci.yml'
```

#### GitLab CI Integration

```yaml
generate-docs:
  stage: docs
  image: ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
  script:
    - ci-dokumentor generate --source templates/my-component/template.yml
  artifacts:
    paths:
      - templates/my-component/docs.md
```

#### Dagger.io Integration

```go
func (m *MyModule) GenerateDocs(ctx context.Context, source *dagger.Directory) *dagger.Directory {
    return dag.Container().
  From("ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest").
        WithMountedDirectory("/workspace", source).
        WithWorkdir("/workspace").
        WithExec([]string{"ci-dokumentor", ".github/workflows/ci.yml", "--output", "docs"}).
        Directory("docs")
}
```

> **📖 Full Documentation**: See [docker/README.md](docker/README.md) for complete Docker usage guide, troubleshooting, and advanced configurations.

### GitHub Action

## 👨‍💻 Contributing

👍 If you wish to contribute to CI Dokumentor, PRs are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for detailed instructions on:

- Setting up the development environment
- Running tests and linting
- Submitting pull requests
- Code conventions and architecture

## Author

👤 **[Hoverkraft](https://hoverkraft.cloud)**

- Site: <https://hoverkraft.cloud>
- GitHub: [@hoverkraft-tech](https://github.com/hoverkraft-tech)

## 📝 License

Copyright © 2020 [Hoverkraft](https://hoverkraft.cloud).<br />
This project is [MIT](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/LICENSE) licensed.
