---
sidebar_position: 1
---

# Introduction

Welcome to **CI Dokumentor** - an automated documentation generator for CI/CD components.

## What is CI Dokumentor?

CI Dokumentor is a powerful TypeScript-based tool that automatically generates comprehensive, professional documentation for your CI/CD workflows, actions, and configurations.

### Key Features

- 📖 **Automated Generation** - Convert CI/CD configuration files into professional documentation
- 🔧 **Extensible Design** - Easy to add support for new CI/CD platforms
- 🐳 **Docker Ready** - Available as a Docker image for easy integration
- 🚀 **GitHub Action** - Can be used directly in GitHub workflows
- 📋 **CLI Tool** - Command-line interface for local usage

## Quick Start

### Installation

Choose your preferred installation method:

**Docker (Recommended):**
```bash
docker pull ghcr.io/hoverkraft-tech/ci-dokumentor:latest
```

**NPX (No Installation):**
```bash
npx ci-dokumentor --help
```

**NPM Global:**
```bash
npm install -g @ci-dokumentor/cli
```

### Generate Your First Documentation

Create a simple GitHub Action file and generate its documentation:

```yaml title="action.yml"
name: 'Hello World Action'
description: 'A simple action that greets the world'
inputs:
  who-to-greet:
    description: 'Who to greet'
    required: true
    default: 'World'
outputs:
  time:
    description: 'The time we greeted you'
runs:
  using: 'node20'
  main: 'index.js'
```

**Generate documentation:**

```bash
# Using Docker
docker run --rm -v $(pwd):/workspace \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest \
  generate --source /workspace/action.yml --output /workspace/docs

# Using NPX
npx ci-dokumentor generate --source action.yml --output docs

# Using CLI
ci-dokumentor generate --source action.yml --output docs
```

### CLI Usage

The main command is `generate` with these key options:

- `--source <dir>` - Source directory (default: current directory)
- `--output <dir>` - Output directory (default: `./docs`)
- `--repository <platform>` - Repository platform (auto-detected)
- `--cicd <platform>` - CI/CD platform (auto-detected)

## Supported Platforms

### CI/CD Platforms
- ✅ **GitHub Actions** - Action files (`action.yml`) and workflow files (`.github/workflows/*.yml`)

### Repository Platforms  
- ✅ **GitHub** - Repository information and metadata
- ✅ **Git** - Basic repository information

## Next Steps

For detailed information, explore these guides:

- 🔧 [CLI Package](./packages/cli) - Complete command-line reference
- 📦 [Core Architecture](./packages/core) - Learn about the internal architecture
- 🐳 [Docker Integration](./integrations/docker) - Advanced Docker usage patterns
- 👨‍💻 [Developer Guide](./developers/contributing) - Contribute to the project
