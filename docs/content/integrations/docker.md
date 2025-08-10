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

## Available Commands

Based on the CLI package, the following commands and options are available:

### Generate Command

```bash
ci-dokumentor generate [options]
# or
ci-dokumentor gen [options]
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--source <dir>` | `-s` | Source directory containing CI/CD files | `.` |
| `--output <dir>` | `-o` | Output directory for generated documentation | `./docs` |
| `--repository <platform>` | `-r` | Repository platform (`github`, `git`) | Auto-detected |
| `--cicd <platform>` | `-c` | CI/CD platform (`github-actions`) | Auto-detected |
| `--include-sections <sections>` | | Comma-separated list of sections to include | All sections |
| `--exclude-sections <sections>` | | Comma-separated list of sections to exclude | None |

## Docker Usage Examples

### Basic GitHub Action Documentation

```bash
# Generate documentation for action.yml
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs
```

### Specify Platforms Explicitly

```bash
# Generate with explicit platform specification
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs \
  --repository github --cicd github-actions
```

### Include/Exclude Specific Sections

```bash
# Include only specific sections
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs \
  --include-sections "header,usage,inputs"

# Exclude specific sections
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs \
  --exclude-sections "license,badges"
```

## Platform Support

CI Dokumentor supports the following platforms:

### Repository Platforms
- **`github`** - GitHub repositories with enhanced features
- **`git`** - Generic Git repositories

### CI/CD Platforms
- **`github-actions`** - GitHub Actions workflows and composite actions

### Available Sections

When using GitHub Actions, the following sections can be generated:
- Header section with title and description
- Usage examples and syntax
- Inputs and outputs documentation
- License information
- Badges and status indicators

## Volume Mounting

### Recommended Mount Points

- **`/workspace`** - Mount your project directory here for both input and output

### Mount Examples

#### Single Directory Mount

```bash
# Mount project directory containing action.yml
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs
```

#### Read-Only Source Mount

```bash
# Mount source as read-only for security
docker run --rm \
  -v $(pwd):/workspace:ro \
  -v $(pwd)/docs:/output \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /output
```

## CI/CD Integration

### GitHub Actions

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
        - .github/workflows/*.yml
```

## Platform-Specific Usage

### Windows PowerShell

```powershell
# PowerShell syntax
docker run --rm -v ${PWD}:/workspace `
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest `
  generate --source /workspace --output /workspace/docs
```

### Windows Command Prompt

```cmd
# Command Prompt syntax
docker run --rm -v %cd%:/workspace ^
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest ^
  generate --source /workspace --output /workspace/docs
```

## Troubleshooting

### Common Issues

#### Permission Denied

**Problem**: Output files are created with wrong permissions

**Solution**:
```bash
# Run with user mapping
docker run --rm -v $(pwd):/workspace -u $(id -u):$(id -g) \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs
```

#### Platform Auto-Detection Failed

**Problem**: CI/CD platform cannot be auto-detected

**Solution**:
```bash
# Specify platform explicitly
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace --output /workspace/docs \
  --cicd github-actions
```

#### Invalid Section Names

**Problem**: Unknown section names in include/exclude options

**Solution**: Use only the supported section names for GitHub Actions:
- `header`
- `usage` 
- `inputs`
- `outputs`
- `license`
- `badges`

## Related Documentation

- [CLI Package](../packages/cli) - Complete command-line interface reference
- [GitHub Action Integration](./github-action) - Use as a GitHub Action
- [Introduction](../intro) - Quick start and installation methods