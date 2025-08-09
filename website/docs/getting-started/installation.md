---
sidebar_position: 1
---

# Installation

CI Dokumentor can be installed and used in several ways depending on your needs and environment.

## Prerequisites

- **Node.js 20+** (for NPM/CLI usage)
- **Docker 20.10+** (for Docker usage)
- **Git** (for repository analysis)

## Installation Methods

### 1. Docker (Recommended)

The easiest way to get started is using the Docker image:

```bash
# Pull the latest image
docker pull ghcr.io/hoverkraft-tech/ci-dokumentor:latest

# Verify installation
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor:latest --help
```

**Advantages:**
- ✅ No local Node.js installation required
- ✅ Consistent environment across different systems
- ✅ Includes all dependencies
- ✅ Ready for CI/CD integration

### 2. NPX (Direct Usage)

For one-time usage without installation:

```bash
# Run directly with npx
npx ci-dokumentor --help

# Generate documentation
npx ci-dokumentor action.yml --output docs
```

**Advantages:**
- ✅ No installation required
- ✅ Always uses latest version
- ✅ Good for testing and evaluation

### 3. NPM Global Installation

Install globally for system-wide CLI access:

```bash
# Install globally
npm install -g @ci-dokumentor/cli

# Verify installation
ci-dokumentor --help
```

**Advantages:**
- ✅ Fast execution (no download each time)
- ✅ Offline usage after installation
- ✅ Integration with local development workflow

### 4. NPM Local Installation

Install as a project dependency:

```bash
# Install as dev dependency
npm install --save-dev @ci-dokumentor/cli

# Use via npm scripts
npm run ci-dokumentor -- action.yml --output docs
```

Add to your `package.json`:

```json
{
  "scripts": {
    "docs:generate": "ci-dokumentor action.yml --output docs"
  }
}
```

**Advantages:**
- ✅ Version pinning for consistent results
- ✅ Shared across team members
- ✅ Integrated with project dependencies

## Verification

After installation, verify CI Dokumentor is working:

### Test with Docker

```bash
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor:latest --version
```

### Test with CLI

```bash
ci-dokumentor --version
ci-dokumentor --help
```

### Test with NPX

```bash
npx ci-dokumentor --version
```

## Platform-Specific Notes

### Windows

For Windows users, use PowerShell or Command Prompt:

```powershell
# Docker
docker run --rm -v ${PWD}:/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest action.yml

# NPX
npx ci-dokumentor action.yml
```

### macOS

For macOS users with Apple Silicon (M1/M2):

```bash
# Docker will automatically use the arm64 image
docker run --rm -v $(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest action.yml
```

### Linux

For Linux users:

```bash
# Standard installation works out of the box
docker run --rm -v $(pwd):/workspace ghcr.io/hoverkraft-tech/ci-dokumentor:latest action.yml
```

## Troubleshooting

### Docker Issues

**Permission denied errors:**
```bash
# Fix permissions for output directory
chmod 755 ./docs
```

**Docker not found:**
```bash
# Install Docker following official instructions
curl -fsSL https://get.docker.com | sh
```

### Node.js Issues

**Node.js version too old:**
```bash
# Install Node.js 20+ from https://nodejs.org
# Or use Node Version Manager (nvm)
nvm install 20
nvm use 20
```

**NPM permission issues:**
```bash
# Use npm prefix to install globally without sudo
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Network Issues

**Behind corporate firewall:**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use Docker with proxy
docker run --rm -e HTTP_PROXY=http://proxy.company.com:8080 \
  ghcr.io/hoverkraft-tech/ci-dokumentor:latest --help
```

## Next Steps

After installation, learn how to use CI Dokumentor:

- 🚀 [Quick Start Guide](./quick-start) - Generate your first documentation
- 📖 [CLI Reference](../packages/cli) - Learn all available commands and options
- 🐳 [Docker Integration](../integrations/docker) - Advanced Docker usage