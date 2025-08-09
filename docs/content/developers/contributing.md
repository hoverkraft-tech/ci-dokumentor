---
sidebar_position: 1
---

# Contributing

Welcome to CI Dokumentor! We're excited that you're interested in contributing to this project. This guide will help you get started with contributing to the codebase.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](https://github.com/hoverkraft-tech/ci-dokumentor/blob/main/CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** - [Download Node.js](https://nodejs.org/)
- **pnpm** - Package manager (`npm install -g pnpm`)
- **Git** - Version control
- **Docker** (optional) - For testing Docker integration

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

```bash
git clone https://github.com/YOUR_USERNAME/ci-dokumentor.git
cd ci-dokumentor
```

3. **Add the upstream remote**:

```bash
git remote add upstream https://github.com/hoverkraft-tech/ci-dokumentor.git
```

### Initial Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests to ensure everything works
pnpm test

# Run linting
pnpm lint
```

## Development Process

### Branch Strategy

We use a feature branch workflow:

1. **Create a feature branch** from `main`:
```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

2. **Make your changes** in the feature branch
3. **Keep your branch up to date** with main:
```bash
git fetch upstream
git rebase upstream/main
```

### Making Changes

#### Architecture Guidelines

CI Dokumentor follows clean architecture principles:

- **Core Package** - Domain logic and abstractions
- **Repository Packages** - Platform-specific repository implementations
- **CI/CD Packages** - Platform-specific CI/CD manifest parsers
- **CLI Package** - User interface and application orchestration

#### Package Structure

```
packages/
├── core/                    # Core abstractions and services
├── repository/
│   ├── git/                # Git repository provider
│   └── github/             # GitHub repository provider
├── cicd/
│   └── github-actions/     # GitHub Actions parser and generator
└── cli/                    # Command-line interface
```

#### Adding New Features

When adding new features:

1. **Start with interfaces** in the core package
2. **Implement in the appropriate package** (repository, cicd, or cli)
3. **Add comprehensive tests**
4. **Update documentation**

### Example: Adding a New CI/CD Platform

1. **Create the package structure**:
```bash
mkdir -p packages/cicd/gitlab-ci
cd packages/cicd/gitlab-ci
```

2. **Define the interfaces** (in core if needed):
```typescript
interface GitLabCIManifest extends Manifest {
  stages?: string[];
  variables?: Record<string, string>;
  // ... GitLab CI specific properties
}
```

3. **Implement the parser**:
```typescript
export class GitLabCIParser implements IManifestParser {
  async parse(filePath: string): Promise<GitLabCIManifest> {
    // Implementation
  }
  
  supportsFile(filePath: string): boolean {
    return filePath.endsWith('.gitlab-ci.yml');
  }
}
```

4. **Implement the generator**:
```typescript
export class GitLabCIGeneratorAdapter implements IDocumentationGenerator {
  async generate(manifest: GitLabCIManifest, repository: Repository): Promise<string> {
    // Implementation
  }
}
```

5. **Add dependency injection setup**:
```typescript
export function initContainer(): Container {
  const container = new Container();
  
  container.bind<IManifestParser>(TYPES.ManifestParser)
    .to(GitLabCIParser)
    .whenTargetNamed('gitlab-ci');
    
  container.bind<IDocumentationGenerator>(TYPES.DocumentationGenerator)
    .to(GitLabCIGeneratorAdapter)
    .whenTargetNamed('gitlab-ci');
    
  return container;
}
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**:
```bash
pnpm test
```

2. **Run linting and fix issues**:
```bash
pnpm lint --fix
```

3. **Build all packages**:
```bash
pnpm build
```

4. **Update documentation** if needed

5. **Add/update tests** for your changes

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat(core): add new repository provider interface
fix(cli): resolve file path resolution issue
docs(packages): update CLI documentation
test(cicd): add tests for GitHub Actions parser
```

### Pull Request Guidelines

1. **Create a descriptive title** following conventional commit format
2. **Fill out the PR template** completely
3. **Link related issues** using keywords (e.g., "Fixes #123")
4. **Add screenshots** for UI changes
5. **Ensure CI passes** before requesting review

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Documentation
- [ ] Documentation updated
- [ ] API documentation updated
- [ ] Examples updated

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] No breaking changes (or properly documented)
```

## Coding Standards

### TypeScript Guidelines

1. **Use strict TypeScript configuration**
2. **Prefer interfaces over types** for object shapes
3. **Always specify return types** for public methods
4. **Use generics** for reusable components
5. **Avoid `any`** - use `unknown` for dynamic content

```typescript
// ✅ Good
interface Repository {
  name: string;
  owner: string;
  url: string;
}

class RepositoryService {
  async getRepository(url: string): Promise<Repository> {
    // Implementation
  }
}

// ❌ Avoid
class RepositoryService {
  async getRepository(url: any): any {
    // Implementation
  }
}
```

### Clean Code Principles

1. **Single Responsibility** - Each class should have one reason to change
2. **Open/Closed** - Open for extension, closed for modification
3. **Dependency Inversion** - Depend on abstractions, not concretions
4. **Descriptive Names** - Use intention-revealing names
5. **Small Functions** - Keep functions focused and small

### Error Handling

1. **Use typed errors**:
```typescript
class RepositoryNotFoundError extends CiDokumentorError {
  constructor(url: string) {
    super(`Repository not found: ${url}`, 'REPOSITORY_NOT_FOUND');
  }
}
```

2. **Provide helpful error messages**
3. **Handle errors gracefully** at appropriate levels
4. **Use Result/Option types** for operations that may fail

### Dependency Injection

1. **Use interfaces** for dependency injection
2. **Register dependencies** in container setup
3. **Avoid circular dependencies**
4. **Use factory pattern** for complex object creation

```typescript
// ✅ Good
container.bind<IRepositoryProvider>(TYPES.RepositoryProvider)
  .to(GitHubRepositoryProvider)
  .whenTargetNamed('github');

// ❌ Avoid
const provider = new GitHubRepositoryProvider();
```

## Testing Guidelines

### Test Structure

Use the AAA pattern (Arrange, Act, Assert):

```typescript
describe('RepositoryService', () => {
  it('should return repository information for valid URL', async () => {
    // Arrange
    const mockProvider = mock<IRepositoryProvider>();
    const service = new RepositoryService(instance(mockProvider));
    const expectedRepo = { name: 'test', owner: 'user' };
    
    when(mockProvider.getRepository('https://github.com/user/test'))
      .thenResolve(expectedRepo);
    
    // Act
    const result = await service.getRepositoryInfo('https://github.com/user/test');
    
    // Assert
    expect(result).toEqual(expectedRepo);
  });
});
```

### Test Categories

1. **Unit Tests** - Test individual components in isolation
2. **Integration Tests** - Test component interactions
3. **End-to-End Tests** - Test complete user scenarios

### Test Guidelines

1. **Write tests first** when possible (TDD)
2. **Use descriptive test names** that explain the scenario
3. **Mock external dependencies**
4. **Test both happy path and error cases**
5. **Maintain high test coverage** (aim for >80%)

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter @ci-dokumentor/core

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Documentation

### Code Documentation

1. **Use JSDoc** for public APIs:
```typescript
/**
 * Retrieves repository information from a URL
 * @param url - The repository URL
 * @returns Promise resolving to repository information
 * @throws {RepositoryNotFoundError} When repository is not found
 */
async getRepository(url: string): Promise<Repository> {
  // Implementation
}
```

2. **Document complex algorithms** and business logic
3. **Keep comments up-to-date** with code changes

### Documentation Updates

When making changes that affect documentation:

1. **Update README files** in affected packages
2. **Update API documentation** for public interfaces
3. **Add examples** for new features
4. **Update migration guides** for breaking changes

### Documentation Structure

```
docs/
├── getting-started/         # Installation and quick start
├── packages/               # Package-specific documentation  
├── integrations/           # Integration guides
└── developers/             # Developer guides
```

## Development Tools

### Recommended VSCode Extensions

- **TypeScript Hero** - Import management
- **ESLint** - Linting
- **Prettier** - Code formatting
- **GitLens** - Git integration
- **Thunder Client** - API testing

### IDE Configuration

VSCode settings (`.vscode/settings.json`):

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

## Release Process

### Version Management

We use semantic versioning (SemVer):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes

### Release Checklist

1. **Update version numbers** in package.json files
2. **Update CHANGELOG.md** with release notes
3. **Create release PR** and get approval
4. **Merge to main** branch
5. **Create GitHub release** with tag
6. **Publish packages** to npm registry

## Community

### Getting Help

- **GitHub Discussions** - For questions and general discussion
- **GitHub Issues** - For bug reports and feature requests

### Communication Guidelines

1. **Be respectful** and inclusive
2. **Search existing issues** before creating new ones
3. **Provide detailed information** when reporting bugs
4. **Use clear, descriptive titles**
5. **Follow up** on your issues and PRs

### Issue Templates

When reporting bugs, include:

- **Environment information** (OS, Node.js version, package versions)
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Error messages** or logs
- **Code samples** or screenshots

### Feature Requests

When requesting features:

- **Describe the problem** you're trying to solve
- **Explain the proposed solution**
- **Consider alternatives**
- **Provide use cases** and examples

## Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md** file
- **GitHub contributors** section
- **Release notes** for significant contributions
- **Special mentions** in blog posts or announcements

Thank you for contributing to CI Dokumentor! 🚀

## Quick Links

- [Setup Guide](./setup) - Detailed development environment setup
- [Testing Guide](./testing) - Comprehensive testing information
- [CI/CD Guide](./ci-cd) - Understanding our CI/CD pipeline
- [Architecture Documentation](../architecture) - Project architecture details