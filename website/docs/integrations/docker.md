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
  /workspace/action.yml --output /workspace/docs
```

## Docker Image Features

### 🔒 Security & Best Practices

- ✅ **Multi-stage build**: Separates build and runtime environments
- ✅ **Alpine Linux base**: Minimal attack surface (~50MB final image)
- ✅ **Non-root user**: Runs as `ci-dokumentor` user (UID 1001)
- ✅ **Production optimized**: Only includes runtime dependencies
- ✅ **Health checks**: Validates container structure
- ✅ **Proper signal handling**: Clean shutdown support

### 🏗️ Architecture Support

- ✅ **linux/amd64** - Standard x86_64 architecture
- ✅ **linux/arm64** - ARM64 architecture (Apple Silicon, ARM servers)

### 📦 Image Tags

```bash
# Latest stable release
ghcr.io/hoverkraft-tech/ci-dokumentor:latest

# Specific version
ghcr.io/hoverkraft-tech/ci-dokumentor:v1.0.0

# Development builds
ghcr.io/hoverkraft-tech/ci-dokumentor:main
ghcr.io/hoverkraft-tech/ci-dokumentor:develop
```

## Basic Usage

### Command Structure

```bash
docker run [DOCKER_OPTIONS] ghcr.io/hoverkraft-tech/ci-dokumentor:latest [CI_DOKUMENTOR_OPTIONS]
```

### Essential Examples

#### Document a GitHub Action

```bash
# Basic usage
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml

# With custom output directory
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /workspace/docs

# Include repository information
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --include-repo-info
```

#### Document a GitHub Workflow

```bash
# Document CI workflow
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/.github/workflows/ci.yml --output /workspace/docs

# Document all workflows
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/.github/workflows/*.yml --output /workspace/docs
```

#### Multiple Files

```bash
# Document both action and workflows
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml /workspace/.github/workflows/*.yml \
  --output /workspace/docs
```

## Volume Mounting

### Recommended Mount Points

- **`/workspace`** - Mount your project directory here
- **`/output`** - Alternative mount point for output only

### Mount Examples

#### Full Project Mount

```bash
# Mount entire project
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /workspace/docs
```

#### Separate Input/Output Mounts

```bash
# Separate source and output volumes
docker run --rm \
  -v $(pwd)/ci:/workspace \
  -v $(pwd)/docs:/output \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /output
```

#### Read-Only Source Mount

```bash
# Mount source as read-only for security
docker run --rm \
  -v $(pwd):/workspace:ro \
  -v $(pwd)/docs:/output \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /output
```

## Platform-Specific Usage

### Windows PowerShell

```powershell
# PowerShell syntax
docker run --rm -v ${PWD}:/workspace `
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest `
  /workspace/action.yml --output /workspace/docs
```

### Windows Command Prompt

```cmd
# Command Prompt syntax
docker run --rm -v %cd%:/workspace ^
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest ^
  /workspace/action.yml --output /workspace/docs
```

### macOS with Apple Silicon

```bash
# Automatically uses ARM64 image on Apple Silicon
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /workspace/docs
```

## CI/CD Integration

### GitHub Actions

#### Simple Integration

```yaml
name: Generate Documentation

on:
  push:
    paths:
      - 'action.yml'
      - '.github/workflows/*.yml'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs'
          
      - name: Upload Documentation
        uses: actions/upload-artifact@v4
        with:
          name: documentation
          path: docs/
```

#### Advanced Integration with Auto-Commit

```yaml
name: Generate and Commit Documentation

on:
  push:
    paths:
      - 'action.yml'
      - '.github/workflows/*.yml'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Generate Documentation
        uses: docker://ghcr.io/hoverkraft-tech/ci-dokumentor:latest
        with:
          args: 'action.yml --output docs --include-repo-info'
          
      - name: Check for Changes
        id: verify-changed-files
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi
          
      - name: Commit Documentation
        if: steps.verify-changed-files.outputs.changed == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git commit -m "docs: update generated documentation [skip ci]"
          git push
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
        /workspace/action.yml --output /workspace/docs
  artifacts:
    paths:
      - docs/
    expire_in: 1 week
  rules:
    - changes:
        - action.yml
        - .gitlab-ci.yml
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Generate Documentation') {
            when {
                anyOf {
                    changeset 'action.yml'
                    changeset '.github/workflows/*.yml'
                }
            }
            steps {
                script {
                    docker.image('ghcr.io/hoverkraft-tech/ci-dokumentor:latest').inside('-v $WORKSPACE:/workspace') {
                        sh 'ci-dokumentor /workspace/action.yml --output /workspace/docs'
                    }
                }
                archiveArtifacts artifacts: 'docs/**', fingerprint: true
            }
        }
    }
}
```

### Azure DevOps

```yaml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - action.yml
      - .github/workflows/*

jobs:
- job: GenerateDocumentation
  displayName: 'Generate Documentation'
  pool:
    vmImage: 'ubuntu-latest'
  steps:
  - task: Docker@2
    displayName: 'Generate Documentation'
    inputs:
      command: 'run'
      image: 'ghcr.io/hoverkraft-tech/ci-dokumentor:latest'
      arguments: '--rm -v $(Build.SourcesDirectory):/workspace'
      runInBackground: false
      
  - task: PublishBuildArtifacts@1
    displayName: 'Publish Documentation'
    inputs:
      pathToPublish: 'docs'
      artifactName: 'documentation'
```

## Environment Variables

### Configuration

```bash
# GitHub token for enhanced repository information
docker run --rm \
  -v $(pwd):/workspace \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --include-repo-info

# Custom author and license
docker run --rm \
  -v $(pwd):/workspace \
  -e CI_DOKUMENTOR_AUTHOR="My Team" \
  -e CI_DOKUMENTOR_LICENSE="MIT" \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml

# Verbose logging
docker run --rm \
  -v $(pwd):/workspace \
  -e CI_DOKUMENTOR_VERBOSE=true \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml
```

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub personal access token | None |
| `CI_DOKUMENTOR_AUTHOR` | Override author information | From manifest |
| `CI_DOKUMENTOR_LICENSE` | Override license information | From repository |
| `CI_DOKUMENTOR_VERBOSE` | Enable verbose logging | `false` |
| `NODE_ENV` | Node.js environment | `production` |

## Docker Compose

### Simple Setup

```yaml title="docker-compose.yml"
version: '3.8'

services:
  ci-dokumentor:
    image: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
    volumes:
      - .:/workspace
    command: /workspace/action.yml --output /workspace/docs
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
```

### Development Setup

```yaml title="docker-compose.dev.yml"
version: '3.8'

services:
  ci-dokumentor:
    image: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
    volumes:
      - .:/workspace
      - ./docs:/output
    command: /workspace/action.yml --output /output --verbose
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - CI_DOKUMENTOR_VERBOSE=true
    profiles: ["docs"]

  # Watch for changes and regenerate
  docs-watch:
    image: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
    volumes:
      - .:/workspace
      - ./docs:/output
    command: >
      sh -c "while inotifywait -e modify /workspace/action.yml; do
        ci-dokumentor /workspace/action.yml --output /output --verbose
      done"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    profiles: ["watch"]
```

Usage:

```bash
# Generate documentation once
docker-compose --profile docs up ci-dokumentor

# Watch for changes
docker-compose --profile watch up docs-watch
```

## Advanced Usage

### Custom Entrypoint

```bash
# Use shell for debugging
docker run --rm -it \
  -v $(pwd):/workspace \
  --entrypoint /bin/sh \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest

# Run with bash for scripting
docker run --rm -it \
  -v $(pwd):/workspace \
  --entrypoint /bin/bash \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  -c "ci-dokumentor /workspace/action.yml && echo 'Documentation generated!'"
```

### Health Checks

```bash
# Run health check
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  node /app/docker/validate-structure.js

# Docker Compose with health check
version: '3.8'
services:
  ci-dokumentor:
    image: ghcr.io/hoverkraft-tech/ci-dokumentor:latest
    healthcheck:
      test: ["CMD", "node", "/app/docker/validate-structure.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Resource Limits

```bash
# Memory and CPU limits
docker run --rm \
  -v $(pwd):/workspace \
  --memory="512m" \
  --cpus="1.0" \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /workspace/docs
```

### Security Hardening

```bash
# Run with security options
docker run --rm \
  -v $(pwd):/workspace:ro \
  -v $(pwd)/docs:/output \
  --read-only \
  --tmpfs /tmp \
  --user 1001:1001 \
  --cap-drop ALL \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /output
```

## Troubleshooting

### Common Issues

#### Permission Denied

**Problem**: Output files are created with wrong permissions

**Solution**:
```bash
# Fix permissions for output directory
chmod 755 ./docs

# Or run with user mapping
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml --output /workspace/docs
```

#### File Not Found

**Problem**: Cannot find input file

**Solution**:
```bash
# Check file exists
ls -la action.yml

# Use absolute paths
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml

# Check mount point
docker run --rm -v $(pwd):/workspace \
  --entrypoint ls \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  -la /workspace
```

#### Container Won't Start

**Problem**: Container exits immediately

**Solution**:
```bash
# Check container logs
docker logs <container-id>

# Run validation
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  node /app/docker/validate-structure.js

# Debug with shell
docker run --rm -it \
  --entrypoint /bin/sh \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest
```

### Performance Issues

#### Slow Documentation Generation

**Problem**: Documentation generation is slow

**Solution**:
```bash
# Use local cache
docker run --rm \
  -v $(pwd):/workspace \
  -v ci-dokumentor-cache:/app/.cache \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml

# Increase memory limit
docker run --rm \
  -v $(pwd):/workspace \
  --memory="1g" \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml
```

### Network Issues

#### Behind Corporate Firewall

**Problem**: Cannot pull Docker image

**Solution**:
```bash
# Configure proxy
docker run --rm \
  -v $(pwd):/workspace \
  -e HTTP_PROXY=http://proxy.company.com:8080 \
  -e HTTPS_PROXY=http://proxy.company.com:8080 \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  /workspace/action.yml
```

## Building Custom Images

### Extending the Base Image

```dockerfile title="Dockerfile.custom"
FROM ghcr.io/hoverkraft-tech/ci-dokumentor:latest

# Add custom tools
USER root
RUN apk add --no-cache git curl jq

# Add custom scripts
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# Switch back to ci-dokumentor user
USER ci-dokumentor

# Custom entrypoint
COPY custom-entrypoint.sh /app/
ENTRYPOINT ["/app/custom-entrypoint.sh"]
```

### Build and Use Custom Image

```bash
# Build custom image
docker build -f Dockerfile.custom -t my-ci-dokumentor .

# Use custom image
docker run --rm -v $(pwd):/workspace \
  my-ci-dokumentor /workspace/action.yml
```

## Integration Examples

### Makefile Integration

```makefile title="Makefile"
.PHONY: docs docs-clean docs-serve

DOCKER_IMAGE := ghcr.io/hoverkraft-tech/ci-dokumentor:latest

docs:
	docker run --rm -v $(PWD):/workspace \
		$(DOCKER_IMAGE) \
		/workspace/action.yml --output /workspace/docs

docs-clean:
	rm -rf docs/

docs-serve: docs
	cd docs && python -m http.server 8000

docs-watch:
	while inotifywait -e modify action.yml; do \
		make docs; \
	done
```

### NPM Scripts Integration

```json title="package.json"
{
  "scripts": {
    "docs:generate": "docker run --rm -v $(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest /workspace/action.yml --output /workspace/docs",
    "docs:clean": "rm -rf docs/",
    "docs:serve": "cd docs && python -m http.server 8000",
    "docs:watch": "watch 'npm run docs:generate' action.yml"
  }
}
```

## Related Documentation

- [CLI Package](../packages/cli) - Command-line interface options
- [GitHub Action Integration](./github-action) - Use as a GitHub Action
- [Getting Started](../getting-started/installation) - Installation methods
- [Core Package](../packages/core) - Understanding the architecture