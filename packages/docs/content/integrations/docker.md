---
title: Docker Integration
description: Use CI Dokumentor Docker image for containerized environments and CI/CD pipelines
sidebar_position: 5
---

# Docker Integration

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
version: '3.8'
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

## Troubleshooting

### Common Issues

#### Permission Denied Errors

**Problem**: Generated files have wrong ownership or permissions

**Solution**: Use user mapping to match host user:

```bash
# Linux/macOS
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml

# Check file ownership after generation
ls -la README.md
```

#### File Not Found Errors

**Problem**: Source file cannot be found inside container

**Solutions**:

1. **Verify mount path**:

   ```bash
   # Check what's mounted
   docker run --rm -v $(pwd):/workspace \
     ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
     ls -la /workspace
   ```

2. **Use absolute paths inside container**:
   ```bash
   # Use /workspace/ prefix for all paths
   docker run --rm -v $(pwd):/workspace \
     ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
     generate --source /workspace/action.yml --destination /workspace/README.md
   ```

#### Platform Detection Failures

**Problem**: "Platform could not be detected" error

**Solution**: Specify platform explicitly:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/action.yml \
  --cicd github-actions --repository github
```

#### Memory Issues with Large Files

**Problem**: Container runs out of memory processing large manifests

**Solution**: Increase memory limits:

```bash
docker run --rm -v $(pwd):/workspace --memory=1g \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  generate --source /workspace/large-workflow.yml
```

#### Network Issues (GitHub API)

**Problem**: Cannot reach GitHub API for repository information

**Solutions**:

1. **Provide GitHub token**:

   ```bash
   docker run --rm -v $(pwd):/workspace \
     -e GITHUB_TOKEN="$GITHUB_TOKEN" \
     ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
     generate --source /workspace/action.yml
   ```

2. **Skip network-dependent features**:
   ```bash
   # Use offline mode (if available)
   docker run --rm -v $(pwd):/workspace \
     ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
     generate --source /workspace/action.yml --repository git
   ```

### Docker-Specific Issues

#### Image Pull Failures

**Problem**: Cannot pull the Docker image

**Solutions**:

1. **Check image exists**:

   ```bash
   docker pull ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
   ```

2. **Use specific version**:

   ```bash
   docker pull ghcr.io/hoverkraft-tech/ci-dokumentor/cli:v1.0.0
   ```

3. **Check container registry status**:
   - Visit [GitHub Container Registry](https://github.com/hoverkraft-tech/ci-dokumentor/pkgs/container/ci-dokumentor%2Fcli)

#### Volume Mount Issues on Windows

**Problem**: Volume mounts don't work correctly on Windows

**Solutions**:

1. **Use PowerShell with proper path**:

   ```powershell
   docker run --rm -v ${PWD}:/workspace `
     ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest `
     generate --source /workspace/action.yml
   ```

2. **Use WSL2 (recommended)**:

   ```bash
   # From WSL2 terminal
   docker run --rm -v $(pwd):/workspace \
     ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
     generate --source /workspace/action.yml
   ```

3. **Use absolute Windows paths**:
   ```cmd
   docker run --rm -v C:\your\project:/workspace ^
     ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest ^
     generate --source /workspace/action.yml
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
  --output-format json generate --source /workspace/action.yml
```

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**: Use JSON output format for detailed error information
2. **Verify prerequisites**: Ensure Docker is running and you have proper permissions
3. **Test with minimal example**: Try with a simple action.yml file first
4. **Open an issue**: [GitHub Issues](https://github.com/hoverkraft-tech/ci-dokumentor/issues) with:
   - Docker version (`docker --version`)
   - Operating system
   - Complete command used
   - Error output
   - Sample manifest file (if possible)

## Performance Tips

### Optimizing Docker Usage

1. **Use specific image tags** instead of `latest` for reproducible builds
2. **Mount only necessary directories** to reduce I/O overhead
3. **Use multi-stage builds** to minimize final image size when extending
4. **Cache image locally** if running frequently:
   ```bash
   docker pull ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest
   ```

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example with caching
- name: Generate Documentation
  run: |
    docker run --rm \
      -v ${{ github.workspace }}:/workspace \
      -e GITHUB_TOKEN="${{ secrets.GITHUB_TOKEN }}" \
      ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest \
      generate --source /workspace/action.yml
```

## Related Documentation

For detailed CLI options and platform support, see:

- **[CLI Package](../packages/cli)** - Complete command-line interface reference and all available options
- **[GitHub Action Integration](./github-action)** - Use as a GitHub Action instead of Docker
- **[Introduction](../intro)** - Quick start and other installation methods
