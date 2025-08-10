---
sidebar_position: 2
---

# Development Setup

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

We use pnpm for faster, more efficient package management:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

#### Git

```bash
# Check if Git is installed
git --version

# Install Git if needed
# macOS: git comes with Xcode Command Line Tools
xcode-select --install

# Ubuntu/Debian
sudo apt update && sudo apt install git

# Windows: Download from https://git-scm.com/
```

#### Docker (Optional)

For testing Docker integration and running containerized workflows:

```bash
# Install Docker Desktop
# macOS/Windows: https://www.docker.com/products/docker-desktop
# Linux: Follow distribution-specific instructions

# Verify installation
docker --version
docker-compose --version
```

### Optional Tools

#### IDE/Editor

**Visual Studio Code** (recommended):

- Download: [code.visualstudio.com](https://code.visualstudio.com/)
- Extensions (install after cloning):
  ```bash
  # Install recommended extensions
  code --install-extension ms-vscode.vscode-typescript-next
  code --install-extension esbenp.prettier-vscode
  code --install-extension ms-vscode.vscode-eslint
  code --install-extension eamodio.gitlens
  ```

**Alternative editors**:

- **WebStorm** - Full TypeScript/Node.js support
- **Vim/Neovim** - With TypeScript language server
- **Emacs** - With tide-mode or lsp-mode

#### Terminal Enhancements

```bash
# Oh My Zsh (macOS/Linux)
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Windows Terminal (Windows)
# Available in Microsoft Store
```

## Repository Setup

### 1. Fork and Clone

#### Fork the Repository

1. Visit [hoverkraft-tech/ci-dokumentor](https://github.com/hoverkraft-tech/ci-dokumentor)
2. Click the "Fork" button in the top-right corner
3. Wait for the fork to complete

#### Clone Your Fork

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ci-dokumentor.git
cd ci-dokumentor

# Add upstream remote for staying in sync
git remote add upstream https://github.com/hoverkraft-tech/ci-dokumentor.git

# Verify remotes
git remote -v
# Should show:
# origin    https://github.com/YOUR_USERNAME/ci-dokumentor.git (fetch)
# origin    https://github.com/YOUR_USERNAME/ci-dokumentor.git (push)
# upstream  https://github.com/hoverkraft-tech/ci-dokumentor.git (fetch)
# upstream  https://github.com/hoverkraft-tech/ci-dokumentor.git (push)
```

### 2. Install Dependencies

```bash
# Install all dependencies for the monorepo
pnpm install

# This will install dependencies for:
# - Root workspace
# - All packages in packages/
# - Development tools and utilities
```

Expected output:

```text
Scope: all 6 workspace projects
Lockfile is up to date, resolution step is skipped
Progress: resolved 659, reused 659, downloaded 0, added 659, done
```

### 3. Initial Build

```bash
# Build all packages
pnpm build

# This builds packages in dependency order:
# 1. @ci-dokumentor/core
# 2. @ci-dokumentor/repository-git
# 3. @ci-dokumentor/repository-github
# 4. @ci-dokumentor/cicd-github-actions
# 5. @ci-dokumentor/cli
```

Expected output:

```text
NX   Running target build for 5 projects:
- @ci-dokumentor/cicd-github-actions
- @ci-dokumentor/repository-github
- @ci-dokumentor/repository-git
- @ci-dokumentor/core
- @ci-dokumentor/cli

✅ Successfully ran target build for 5 projects
```

### 4. Verify Installation

```bash
# Run tests to ensure everything works
pnpm test

# Run linting
pnpm lint

# Check CLI functionality
cd packages/cli
npm link
ci-dokumentor --help
```

## Development Environment

### Workspace Structure

```text
ci-dokumentor/
├── .github/                 # GitHub workflows and templates
├── docs/                   # Architecture documentation
├── docker/                 # Docker configuration
├── packages/               # Monorepo packages
│   ├── core/              # Core abstractions
│   ├── cli/               # Command-line interface
│   ├── repository/        # Repository providers
│   │   ├── git/          # Git provider
│   │   └── github/       # GitHub provider
│   └── cicd/             # CI/CD platform support
│       └── github-actions/ # GitHub Actions support
├── website/               # Docusaurus documentation site
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── nx.json               # NX workspace configuration
└── tsconfig.base.json    # Base TypeScript configuration
```

### Package Dependencies

Understanding the dependency graph:

```mermaid
graph TD
    A[core] --> B[repository-git]
    A --> C[repository-github]
    A --> D[cicd-github-actions]
    B --> C
    B --> D
    C --> D
    A --> E[cli]
    B --> E
    C --> E
    D --> E
```

This means:

- **Core** has no dependencies (pure domain logic)
- **Repository packages** depend on core
- **CI/CD packages** depend on core and repository packages
- **CLI** depends on all other packages

### IDE Configuration

#### Visual Studio Code

The repository includes VS Code configuration in `.vscode/`:

```json title=".vscode/settings.json"
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.nx": true
  },
  "search.exclude": {
    "**/dist": true,
    "**/node_modules": true
  }
}
```

```json title=".vscode/extensions.json"
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "eamodio.gitlens",
    "nrwl.angular-console"
  ]
}
```

#### Install Recommended Extensions

```bash
# Install all recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension eamodio.gitlens
code --install-extension nrwl.angular-console
```

### Environment Variables

Create a `.env` file in the root directory for development:

```bash title=".env"
# GitHub token for enhanced repository information (optional)
GITHUB_TOKEN=ghp_your_token_here

# Development settings
NODE_ENV=development
CI_DOKUMENTOR_VERBOSE=true

# Docker settings (if using Docker)
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1
```

**Note**: Never commit the `.env` file! It's already in `.gitignore`.

### Git Configuration

#### Set up Git hooks

```bash
# Install Git hooks (optional)
npm install -g husky
npx husky install

# This will run linting and tests before commits
```

#### Configure Git for the project

```bash
# Set your Git identity (if not already done globally)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Optional: Use different identity for this project
git config --local user.name "Your Name"
git config --local user.email "your.email@example.com"
```

## Development Workflow

### Day-to-Day Development

#### 1. Start Development Session

```bash
# Switch to main branch and get latest changes
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name

# Install any new dependencies (if package.json changed)
pnpm install

# Build packages
pnpm build
```

#### 2. Development Loop

```bash
# Make your changes...

# Build affected packages
pnpm build

# Run tests for affected packages
pnpm test

# Run linting
pnpm lint --fix

# Test CLI functionality
cd packages/cli
npm link
ci-dokumentor --help
```

#### 3. Testing Changes

```bash
# Test your changes with a real action.yml file
cd /path/to/test/project
ci-dokumentor action.yml --output docs --verbose

# Test with Docker
docker build -f docker/Dockerfile -t ci-dokumentor:dev .
docker run --rm -v $(pwd):/workspace ci-dokumentor:dev /workspace/action.yml
```

### Working with NX

CI Dokumentor uses NX for monorepo management:

```bash
# Build specific package
nx build core
nx build cli

# Test specific package
nx test core
nx test cli

# Lint specific package
nx lint core

# Run command for all packages
nx run-many --target=build --all
nx run-many --target=test --all

# See dependency graph
nx graph
```

### Package-Specific Development

#### Core Package

```bash
cd packages/core

# Run tests in watch mode
npm run test -- --watch

# Build and watch for changes
npm run build -- --watch
```

#### CLI Package

```bash
cd packages/cli

# Link for global usage
npm link

# Test CLI commands
ci-dokumentor --help
ci-dokumentor action.yml --output docs

# Debug CLI
node --inspect-brk dist/bin/ci-dokumentor.js action.yml
```

#### Repository Packages

```bash
cd packages/repository/github

# Test with real GitHub repositories
npm run test -- --grep "integration"

# Test with GitHub token
GITHUB_TOKEN=your_token npm test
```

## Debugging

### CLI Debugging

#### Node.js Debugger

```bash
# Debug CLI with Node.js inspector
cd packages/cli
node --inspect-brk dist/bin/ci-dokumentor.js action.yml --verbose

# Open Chrome DevTools: chrome://inspect
```

#### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CLI",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/cli/dist/bin/ci-dokumentor.js",
      "args": ["action.yml", "--output", "docs", "--verbose"],
      "cwd": "${workspaceFolder}/test-data",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Test Debugging

```bash
# Debug specific test
cd packages/core
npm run test -- --grep "specific test name" --inspect-brk

# Run single test file
npm run test src/specific-test.spec.ts
```

### Docker Debugging

```bash
# Build debug image
docker build -f docker/Dockerfile --target development -t ci-dokumentor:debug .

# Run with shell access
docker run --rm -it -v $(pwd):/workspace --entrypoint /bin/sh ci-dokumentor:debug

# Inside container:
# node dist/bin/ci-dokumentor.js --help
```

## Troubleshooting

### Common Issues

#### Node.js Version Issues

**Problem**: Build fails with Node.js version errors

**Solution**:

```bash
# Check Node.js version
node --version

# Use nvm to switch versions
nvm install 20
nvm use 20

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript Compilation Errors

**Problem**: TypeScript errors in IDE or build

**Solution**:

```bash
# Clean TypeScript cache
rm -rf packages/*/dist
rm -rf packages/*/.tsbuildinfo

# Rebuild all packages
pnpm build

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

#### pnpm Installation Issues

**Problem**: pnpm install fails or is slow

**Solution**:

```bash
# Clear pnpm cache
pnpm store prune

# Delete lock file and reinstall
rm pnpm-lock.yaml
pnpm install

# Use different registry if needed
pnpm install --registry https://registry.npmjs.org/
```

#### Git Permission Issues

**Problem**: Cannot push to repository

**Solution**:

```bash
# Check remote URLs
git remote -v

# Make sure you're pushing to your fork
git remote set-url origin https://github.com/YOUR_USERNAME/ci-dokumentor.git

# Or use SSH
git remote set-url origin git@github.com:YOUR_USERNAME/ci-dokumentor.git
```

#### Docker Issues

**Problem**: Docker build fails

**Solution**:

```bash
# Check Docker is running
docker info

# Build with no cache
docker build --no-cache -f docker/Dockerfile .

# Check Docker permissions (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

### Performance Issues

#### Slow Builds

```bash
# Use NX caching
export NX_CACHE_DIRECTORY=.nx/cache

# Build only affected packages
nx affected:build

# Use parallel builds
nx run-many --target=build --all --parallel
```

#### Slow Tests

```bash
# Run tests in parallel
nx run-many --target=test --all --parallel

# Run only affected tests
nx affected:test

# Use test caching
nx run-many --target=test --all --parallel --cache
```

### Getting Help

If you encounter issues not covered here:

1. **Check existing issues** - [GitHub Issues](https://github.com/hoverkraft-tech/ci-dokumentor/issues)
2. **Ask questions** - [GitHub Discussions](https://github.com/hoverkraft-tech/ci-dokumentor/discussions)
3. **Join the community** - Discord (coming soon)

## Next Steps

Now that your development environment is set up:

1. **Explore the codebase** - Start with `packages/core/src/`
2. **Run the examples** - Try generating documentation for real projects
3. **Read the architecture docs** - Understand the design patterns
4. **Pick an issue** - Find "good first issue" labels on GitHub
5. **Write tests** - Add tests for any changes you make

Happy coding! 🚀

## Related Guides

- [Contributing Guidelines](./contributing) - How to contribute effectively
- [Testing Guide](./testing) - Comprehensive testing information
- [CI/CD Guide](./ci-cd) - Understanding our build pipeline
- [Architecture Documentation](./architecture) - System design
