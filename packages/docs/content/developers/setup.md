---
title: Development Setup
description: Complete development environment setup guide for CI Dokumentor contributors
sidebar_position: 2
---

This guide walks you through setting up a complete development environment for CI Dokumentor, from initial installation to running your first successful build.

## Prerequisites

### Required Software

#### Node.js 20+

CI Dokumentor requires Node.js 20 or higher for development:

```bash
# Check your current Node.js version
node --version

# Should output v20.x.x or higher
```

**Installation options:**

1. **Official installer**: [nodejs.org](https://nodejs.org/)
2. **Node Version Manager (nvm)** (recommended):

   ```bash
   # Install nvm (macOS/Linux)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

   # Install and use Node.js 20
   nvm install 20
   nvm use 20
   ```

3. **Package managers**:

   ```bash
   # macOS with Homebrew
   brew install node@20

   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

#### pnpm Package Manager

CI Dokumentor uses pnpm for workspace management and dependency installation:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
# Should output v9.0.0 or higher
```

**Why pnpm?**

- **Disk efficiency** - Shares packages across workspaces
- **Strict dependency resolution** - Prevents phantom dependencies
- **Fast installs** - Leverages hard links and content-addressing
- **Workspace support** - Excellent monorepo management

#### Git

```bash
# Verify Git installation
git --version
# Should output 2.30+ for best compatibility
```

### Optional Tools

#### Docker (Optional)

For testing containerized workflows:

```bash
# Verify Docker installation
docker --version

# Test CI Dokumentor Docker image
docker run --rm ghcr.io/hoverkraft-tech/ci-dokumentor/cli:latest --version
```

#### GitHub CLI (Optional)

For enhanced GitHub integration during development:

```bash
# Install gh CLI
# macOS: brew install gh
# Other platforms: https://cli.github.com/

# Authenticate
gh auth login
```

## Repository Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/hoverkraft-tech/ci-dokumentor.git
cd ci-dokumentor

# Verify you're in the right place
ls -la
# Should show package.json, pnpm-workspace.yaml, etc.
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This installs dependencies for all packages in the monorepo
# Output should show packages being linked
```

### 3. Build Project

```bash
# Build all packages
pnpm build

# This builds packages in the correct dependency order
# Should complete without errors
```

### 4. Verify Installation

Run the verification steps from the canonical testing guide. For full testing and coverage commands see [testing dedicated documentation](./testing.md).

```bash
# Run tests to verify setup
pnpm test

# Check linting
pnpm lint
```

## Development Workflow

### Daily Workflow

```bash
# 1. Start of day - sync with main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and test
pnpm build
pnpm test
pnpm lint

# 4. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### Package-Specific Development

```bash
# Work on specific packages
nx build core              # Build core package
nx test cli --watch        # Test CLI in watch mode
nx lint repository-github  # Lint specific package
```

### Documentation Development

```bash
# Start documentation server
pnpm docs:start
# Opens http://localhost:3000/ci-dokumentor/

# Build documentation for production
nx build docs
```

## Workspace Structure

```text
ci-dokumentor/
├── packages/
│   ├── core/                   # Core abstractions and services
│   ├── cli/                    # Command-line interface
│   ├── repository/
│   │   ├── git/               # Git repository provider
│   │   └── github/            # GitHub repository provider
│   ├── cicd/
│   │   └── github-actions/    # GitHub Actions CI/CD support
│   └── docs/                  # Documentation (Docusaurus)
├── .github/                   # GitHub workflows and templates
├── docker/                    # Docker configurations
└── README.md                  # Project readme
```

## IDE Setup

### Visual Studio Code (Recommended)

Install recommended extensions (see `.vscode/extensions.json`):

- **TypeScript** - Language support
- **ESLint** - Linting integration
- **Prettier** - Code formatting
- **Vitest** - Test runner integration
- **GitLens** - Git integration

Settings are preconfigured in `.vscode/settings.json`.

### Other IDEs

For IntelliJ IDEA, WebStorm, or other IDEs:

1. **Import as TypeScript project**
2. **Enable ESLint integration**
3. **Configure Prettier for formatting**
4. **Set up Vitest test runner**

## Environment Variables

### Optional Configuration

```bash
# GitHub token for enhanced GitHub integration
export GITHUB_TOKEN=your_personal_access_token

# Set development environment
export NODE_ENV=development
```

### Repository-Specific Settings

```bash
# For testing GitHub Actions locally
export GITHUB_REPOSITORY=owner/repo
export GITHUB_SHA=commit-sha
export GITHUB_REF=refs/heads/main
```

## Troubleshooting

### Common Setup Issues

#### Node.js Version Mismatch

```bash
# Check Node version
node --version

# If wrong version, use nvm
nvm install 20
nvm use 20
```

#### pnpm Installation Issues

```bash
# Clean pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### Build Failures

```bash
# Clean builds
nx reset

# Rebuild from scratch
pnpm build
```

#### Permission Issues (macOS/Linux)

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm
```

### Getting Help

- **Documentation** - Check other pages in this developer guide
- **Issues** - [GitHub Issues](https://github.com/hoverkraft-tech/ci-dokumentor/issues)
- **Discussions** - [GitHub Discussions](https://github.com/hoverkraft-tech/ci-dokumentor/discussions)

## Next Steps

After completing setup:

1. **Read the [Architecture Guide](./architecture.md)** - Understand the codebase structure
2. **Review [Testing Guide](./testing.md)** - Learn testing patterns and tools
3. **Check [Contributing Guide](./contributing.md)** - Understand contribution workflow
4. **Browse [CI/CD Guide](./ci-cd.md)** - Learn about our automation

## Quick Reference

Essential setup and build commands are listed here; for testing variations and coverage commands use, see [testing dedicated documentation](./testing.md).

```bash
# Essential commands
pnpm install           # Install dependencies
pnpm build            # Build all packages
pnpm docs:start       # Start documentation server

# Package-specific commands
nx build <package>    # Build specific package
nx test <package>     # Test specific package
nx lint <package>     # Lint specific package
```
