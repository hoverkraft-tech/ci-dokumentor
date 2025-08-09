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

## Contributing

👍 If you wish to contribute to CI Dokumentor, PRs are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file.

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
# Run CI Dokumentor on a specific file
docker run --rm -v $(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest /workspace/path/to/ci-cd/component.yml

# Run with custom output directory
docker run --rm -v $(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest /workspace/.github/workflows/ci.yml --output /workspace/docs

# See all available options
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor:latest --help
```

#### Advanced Usage

```bash
# Interactive mode with shell access
docker run --rm -it -v $(pwd):/workspace --entrypoint /bin/sh ghcr.io/hoverkraft-tech/ci-dokumentor:latest
```

#### Docker Compose

```yaml
version: '3.8'
services:
  ci-dokumentor:
    image: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
    volumes:
      - .:/workspace
    command: ["/workspace/.github/workflows/ci.yml", "--output", "/workspace/docs"]
```

#### CI/CD Integration

```yaml
- name: Generate CI Documentation
  uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
  with:
    args: '.github/workflows/ci.yml --output docs/ci'
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
