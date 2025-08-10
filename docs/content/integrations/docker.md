---
sidebar_position: 1
---

# Docker Integration

CI Dokumentor provides a production-ready Docker image for easy integration with containerized environments and CI/CD pipelines.

## Quick Start

```bash
# Generate documentation for a GitHub Action
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace/action.yml --output /workspace/docs
```

## Docker Image

The official Docker image is available on GitHub Container Registry:

- **Image**: `ghcr.io/hoverkraft-tech/ci-dokumentor:latest`
- **Base**: Alpine Linux (minimal footprint)
- **Tags**: `latest`, version-specific tags (e.g., `1.0.0`)

## Basic Usage

### Volume Mounting

Mount your project directory to `/workspace` for both input and output:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs
```

### File Permissions

For correct file ownership on Linux/macOS:

```bash
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs
```

## Platform-Specific Examples

### Linux/macOS (Bash)

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace/action.yml --output /workspace/docs
```

### Windows PowerShell

```powershell
docker run --rm -v ${PWD}:/workspace `
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest `
  generate --source /workspace/action.yml --output /workspace/docs
```

### Windows Command Prompt

```cmd
docker run --rm -v %cd%:/workspace ^
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest ^
  generate --source /workspace/action.yml --output /workspace/docs
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Generate Documentation

on:
  push:
    paths:
      - 'action.yml'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'generate --source . --output docs'
          
      - name: Upload Documentation
        uses: actions/upload-artifact@v4
        with:
          name: documentation
          path: docs/
```

### GitLab CI

```yaml
generate-docs:
  stage: docs
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker run --rm -v $PWD:/workspace 
        ghcr.io/hoverkraft-tech/ci-dokumentor:latest 
        generate --source /workspace --output /workspace/docs
  artifacts:
    paths:
      - docs/
    expire_in: 1 week
  rules:
    - changes:
        - action.yml
```

## Volume Configuration

### Recommended Mount Points

- **`/workspace`** - Primary mount point for project files
- **`/workspace/docs`** - Default output directory (can be customized)

### Mount Examples

#### Single Directory (Read/Write)

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs
```

#### Separate Input/Output Mounts

```bash
docker run --rm \
  -v $(pwd):/workspace:ro \
  -v $(pwd)/output:/output \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /output
```

## Troubleshooting

### Common Issues

#### Permission Denied
```bash
# Solution: Run with user mapping
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs
```

#### Platform Detection Failed
```bash
# Solution: Specify platform explicitly
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs \
  --cicd github-actions
```

#### Invalid File Paths
- Ensure source files exist in mounted directory
- Use absolute paths within the container (`/workspace/...`)
- Check file permissions and ownership

## Docker Compose

For consistent development environments:

```yaml
# docker-compose.yml
version: '3.8'
services:
  ci-dokumentor:
    image: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
    volumes:
      - .:/workspace
    command: generate --source /workspace --output /workspace/docs
```

```bash
# Run documentation generation
docker-compose run --rm ci-dokumentor
```

## Related Documentation

For detailed CLI options and platform support, see:

- **[CLI Package](../packages/cli)** - Complete command-line interface reference and all available options
- **[GitHub Action Integration](./github-action)** - Use as a GitHub Action instead of Docker
- **[Introduction](../intro)** - Quick start and other installation methods