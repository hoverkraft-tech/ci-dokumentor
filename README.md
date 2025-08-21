# CI Dokumentor

**⚠️ Work in Progress!**

<p align="center">
  <a href="https://github.com/hoverkraft-tech/ci-dokumentor" target="_blank"><img src="https://repository-images.githubusercontent.com/967387766/5e390ed2-ba9b-447d-bfe9-eb68f6f6a314" width="600" alt="CI Dokumentor - Automated documentation generator for CI/CD components" /></a>
</p>

[![Continuous integration](https://github.com/hoverkraft-tech/ci-dokumentor/workflows/Continuous%20integration/badge.svg)](https://github.com/hoverkraft-tech/ci-dokumentor/actions?query=workflow%3A%22Continuous+integration%22)
[![Coverage Status](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor/branch/main/graph/badge.svg)](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor)
[![Latest Stable Version](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/v/stable)](https://packagist.org/packages/hoverkraft-tech/ci-dokumentor)
[![Total Downloads](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/downloads)](https://npm.org/packages/hoverkraft-tech/ci-dokumentor)
[![License](https://poser.pugx.org/hoverkraft-tech/ci-dokumentor/license)](https://packagist.org/packages/hoverkraft-tech/ci-dokumentor)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

📢 **CI Dokumentor** is an automated documentation generator for CI/CD components

## 📖 Documentation

**Complete documentation is available at: [hoverkraft-tech.github.io/ci-dokumentor](https://hoverkraft-tech.github.io/ci-dokumentor)**

### Quick Links

- 🚀 [Getting Started](./docs/docs/getting-started/installation.md) - Installation and quick start
- 📦 [Packages](./docs/docs/packages/core.md) - Package documentation
- 🐳 [Docker](./docs/docs/integrations/docker.md) - Docker integration guide
- 🔧 [GitHub Action](./docs/docs/integrations/github-action.md) - GitHub Actions integration
- 👨‍💻 [Contributing](./docs/docs/developers/contributing.md) - How to contribute

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
