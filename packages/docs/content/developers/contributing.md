---
sidebar_position: 1
---

# Contributing

Welcome to CI Dokumentor! We're excited that you're interested in contributing to this project.

## Quick Start

For complete contributing guidelines, please see our main [Contributing Guide](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CODE_OF_CONDUCT.md).

## Development Quick Setup

1. **Prerequisites**: Node.js 20+, pnpm
2. **Clone**: `git clone https://github.com/hoverkraft-tech/ci-dokumentor.git`
3. **Install**: `pnpm install`
4. **Build**: `pnpm build`
5. **Test**: See the centralized developer testing guide: `../developers/testing` (`packages/docs/content/developers/testing.md`).

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Run all CI checks
make ci
```

### Testing Your Changes

```bash
# Build and test the CLI
pnpm build
cd packages/cli
node dist/bin/ci-dokumentor.js --help

# Test with a sample action.yml
node dist/bin/ci-dokumentor.js generate --source action.yml
```

## Project Structure

CI Dokumentor follows clean architecture principles with these packages:

- `packages/core/` - Core abstractions and services
- `packages/cli/` - Command-line interface
- `packages/repository/git/` - Git repository provider
- `packages/repository/github/` - GitHub repository provider
- `packages/cicd/github-actions/` - GitHub Actions CI/CD provider

## Architecture Guidelines

- Use dependency injection with InversifyJS
- Follow SOLID principles
- Separate business logic from framework code
- Write comprehensive tests for new features
- Document public APIs

## Making Changes

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Make** your changes following the coding standards
4. **Add** tests for new functionality
5. **Run** the full test suite: See `packages/docs/content/developers/testing.md` for the canonical commands (`pnpm test`, `pnpm test:ci`, using `nx`, and debugging guidance).
6. **Commit** using conventional commits: `feat: add new feature`
7. **Push** to your fork and create a pull request

## Getting Help

- Check existing [issues](https://github.com/hoverkraft-tech/ci-dokumentor/issues)
- Read the [development setup guide](./setup.md)
- Review the [testing documentation](./testing.md)

For detailed guidelines, troubleshooting, and more information, see the main [CONTRIBUTING.md](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CONTRIBUTING.md) file.
