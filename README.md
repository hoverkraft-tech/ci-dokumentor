# CI Dokumentor

**⚠️ Work in Progress!**

<p align="center">
  <a href="https://github.com/hoverkraft-tech/ci-dokumentor" target="_blank"><img src="https://repository-images.githubusercontent.com/967387766/275872f7-f4bc-40f8-b3d2-4a39496728bc" width="600" alt="CI Dokumentor - Automated documentation generator for CI/CD components" /></a>
</p>

[![Continuous Integration](https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml/badge.svg)](https://github.com/hoverkraft-tech/ci-dokumentor/actions/workflows/main-ci.yml)
[![Coverage Status](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor/branch/main/graph/badge.svg)](https://codecov.io/gh/hoverkraft-tech/ci-dokumentor)
[![Latest Stable Version](https://img.shields.io/npm/v/@ci-dokumentor/cli)](https://www.npmjs.com/package/@ci-dokumentor/cli)
[![Total Downloads](https://img.shields.io/npm/dm/@ci-dokumentor/cli)](https://www.npmjs.com/package/@ci-dokumentor/cli)
[![License](https://img.shields.io/npm/l/@ci-dokumentor/cli)](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

📢 **CI Dokumentor** is an automated documentation generator for CI/CD components

## 📖 Documentation

**Complete documentation is available at: [hoverkraft-tech.github.io/ci-dokumentor](https://hoverkraft-tech.github.io/ci-dokumentor)**

### Quick Links

- 🚀 [Getting Started](./docs/content/getting-started/installation.md) - Installation and quick start
- 🐳 [Docker](./docs/content/integrations/docker.md) - Docker integration guide
- 🔧 [GitHub Action](./docs/content/integrations/github-action.md) - GitHub Actions integration
- 👨‍💻 [Contributing](./docs/content/developers/contributing.md) - How to contribute

## Integrations

### Npm package

```bash
# Install globally
npm install -g @ci-dokumentor/cli

# Use the CLI
ci-dokumentor generate --source action.yml

# Or use directly with npx
npx @ci-dokumentor/cli generate --source action.yml
```

### Docker

CI Dokumentor is available as a Docker image that provides a lightweight, containerized way to generate documentation for your CI/CD components.

```bash
# Show available options
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest --help

# Generate documentation from CI/CD file
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest generate --source /workspace/action.yml
```

> **📖 Full Documentation**: See [docker/README.md](docker/README.md) for complete Docker usage guide, troubleshooting, and advanced configurations.

### GitHub Actions

```yaml
- name: Generate CI Documentation
  uses: hoverkraft-tech/ci-dokumentor@main
  with:
    source: 'action.yml'
```

> **📖 Full Documentation**: For more details on GitHub Actions integration, see our [GitHub Action documentation](./packages/docs/content/integrations/github-action.md).

### GitLab CI

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

> **📖 Full Documentation**: For more details on GitLab CI integration, see our [GitLab CI documentation](./packages/docs/content/integrations/gitlab-ci.md).

### Dagger.io

```go
func (m *MyModule) GenerateDocs(ctx context.Context, source *dagger.Directory) *dagger.Directory {
    return dag.Container().
  From("ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest").
        WithMountedDirectory("/workspace", source).
        WithWorkdir("/workspace").
        WithExec([]string{"ci-dokumentor", "generate", "--source", "action.yml"}).
        Directory("docs")
}
```

> **📖 Full Documentation**: For more details on Dagger.io integration, see our [Dagger.io documentation](./packages/docs/content/integrations/dagger.md).

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
