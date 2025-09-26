---
title: Docker Integration
description: Use CI Dokumentor Docker image for containerized environments and CI/CD pipelines
sidebar_position: 5
---

CI Dokumentor provides a production-ready Docker image for easy integration with containerized environments and CI/CD pipelines.

## Quick Start

> Generate documentation for a CI/CD manifest file (required)
> Pass a manifest file path inside the container, for example `/workspace/action.yml`

```bash
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml
```

Note: the Docker image uses `/workspace` as the default working directory. The `ci-dokumentor` CLI is installed at `/usr/local/bin/ci-dokumentor` and is available on the container PATH (so you can invoke it as `/usr/local/bin/ci-dokumentor` or simply `ci-dokumentor`).

## Docker Image

The official Docker image is available on GitHub Container Registry:

- **Image**: `ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest`
- **Base**: Alpine Linux (minimal footprint)
- **Tags**: `latest`, version-specific tags (e.g., `1.0.0`)

## Basic Usage

### Volume Mounting

Mount your project directory to `/workspace` for both input (and output if different):

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml
```

### File Permissions

For correct file ownership on Linux/macOS:

```bash
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml
```

### Provides GitHub Token

```bash
# Using gh cli
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml \
  --github-token $(gh auth token)
```

## Platform-Specific Examples

### Linux/macOS (Bash)

```bash
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml
```

### Windows PowerShell

```powershell
docker run --rm -v ${PWD}:/workspace `
  -u $(id -u):$(id -g) `
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest `
  generate --source /workspace/action.yml
```

### Windows Command Prompt

```cmd
docker run --rm -v %cd%:/workspace ^
  -u %USERPROFILE%:$(id -g) ^
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest ^
  generate --source /workspace/action.yml
```

## Volume Configuration

### Recommended Mount Points

- **`/workspace`** - Primary mount point for project files

Note: `/workspace` is the image's default working directory. When you mount your project there, commands executed inside the container will run with `/workspace` as the current working directory.

### Mount Examples

#### Single Directory (Read/Write)

```bash
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml
```

#### Separate Source/Destination Mounts

```bash
docker run --rm \
  -v $(pwd):/workspace:ro \
  -v $(pwd)/destination:/destination \
  -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml --destination /destination/README.md
```

```bash
docker run --rm \
  -v $(pwd):/workspace:ro \
  -v $(pwd)/destination:/destination \
  -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml --destination /destination/README.md
```

## Troubleshooting

### Common Issues

#### Permission Denied

> Solution: Run with user mapping

```bash
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml
```

#### Platform Detection Failed

> Solution: Specify platform explicitly

```bash
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml \
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
version: "3.8"
services:
  ci-dokumentor:
    image: ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
    volumes:
      - .:/workspace
  command: generate --source /workspace/action.yml
```

> Run documentation generation

```bash
docker-compose run --rm ci-dokumentor
```

## Advanced Usage

### Multi-Stage Build Integration

For integrating into your own Docker builds:

```dockerfile
# Use CI Dokumentor in multi-stage build
FROM ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest as docs-generator

# Copy your manifest files
COPY action.yml /workspace/action.yml

# Generate documentation
RUN ci-dokumentor generate --source /workspace/action.yml --destination /workspace/README.md

# Copy generated docs to final stage
FROM alpine:latest
COPY --from=docs-generator /workspace/README.md /app/README.md
```

### Custom Entrypoint Scripts

Create wrapper scripts for complex workflows:

```bash
#!/bin/bash
# generate-docs.sh

set -e

# Generate docs for multiple files
for manifest in action.yml .github/workflows/*.yml; do
    if [ -f "$manifest" ]; then
        echo "Generating docs for $manifest..."
        ci-dokumentor generate --source "$manifest"
    fi
done

echo "Documentation generation complete!"
```

```bash
# Make executable and use
chmod +x generate-docs.sh
docker run --rm -v $(pwd):/workspace -v $(pwd)/generate-docs.sh:/usr/local/bin/generate-docs.sh \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate-docs.sh
```

### Environment Variables

Pass configuration via environment variables:

```bash
docker run --rm \
  -v $(pwd):/workspace \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  -e CI_DOKUMENTOR_OUTPUT_FORMAT="json" \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml
```
