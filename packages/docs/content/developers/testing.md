---
title: Testing Guide
description: Comprehensive testing strategies and tools for CI Dokumentor development
sidebar_position: 6
---

# Testing

Comprehensive testing is crucial for maintaining the quality and reliability of CI Dokumentor. This guide covers all aspects of testing in the project.

## Testing Philosophy

CI Dokumentor follows these testing principles:

1. **Test-Driven Development** - Write tests before or alongside implementation
2. **Clean Test Code** - Tests should be as clean and maintainable as production code
3. **Fast Feedback** - Tests should run quickly to enable rapid development
4. **Comprehensive Coverage** - Aim for high test coverage across all packages
5. **Real-World Scenarios** - Tests should reflect actual usage patterns

## Test Stack

CI Dokumentor uses a modern testing stack:

- **[Vitest](https://vitest.dev/)** - Fast unit testing framework with native TypeScript support
- **[Mock-fs](https://github.com/tschaub/mock-fs)** - File system mocking for integration tests
- **[InversifyJS Testing](https://inversify.io/)** - Dependency injection mocking and testing patterns
- **[@vitest/coverage-v8](https://vitest.dev/guide/coverage)** - Code coverage reporting

### Test Types

#### Unit Tests

Fast, isolated tests focusing on individual components:

```bash
# Run all unit tests
pnpm test

# Run tests for specific package
nx test core
nx test cli
nx test repository-github
```

#### Integration Tests

Tests that verify component interactions and realistic usage patterns:

- End-to-end CLI testing (`.e2e.spec.ts`)
- Generator adapter integration tests
- Migration adapter integration tests

#### Mock Testing

Comprehensive mocking strategies using dependency injection:

```typescript
// Example: Mocking repository providers
beforeEach(() => {
  container
    .rebind(TYPES.RepositoryProvider)
    .toConstantValue(mockRepositoryProvider);
});
```

## Running Tests

### Workspace Commands

```bash
# Run all tests across all packages
pnpm test

# Run tests with coverage
pnpm test:ci

# Run tests in watch mode (development)
nx test core --watch
```

### Package-Specific Commands

```bash
# Core package tests
nx test core

# CLI package tests
nx test cli

# GitHub Actions package tests
nx test cicd-github-actions

# Repository providers
nx test repository-git
nx test repository-github
```

### Coverage Reports

```bash
# Generate coverage reports
pnpm test:ci

# View coverage in browser (after running coverage)
open coverage/index.html
```

## Testing Guidelines

### Writing Good Tests

#### Test Structure (AAA Pattern)

```typescript
describe('Component', () => {
  it('should behavior when condition', () => {
    // Arrange - Setup test data and mocks
    const input = 'test-input';
    const expectedOutput = 'expected-result';

    // Act - Execute the code under test
    const result = systemUnderTest.method(input);

    // Assert - Verify the results
    expect(result).toBe(expectedOutput);
  });
});
```

#### Descriptive Test Names

Use clear, descriptive test names that explain the behavior:

```typescript
// ✅ Good: describes behavior and context
it('should throw error when source file does not exist');

// ❌ Bad: vague and unclear
it('should work');
it('test error case');
```

#### Test Dependencies and Mocking

Use dependency injection for clean, testable code:

```typescript
// Example from core package
beforeEach(() => {
  container = new Container();
  container.bind(TYPES.FormatterAdapter).to(MockFormatterAdapter);
});
```

### File System Testing

Use mock-fs for file system operations:

```typescript
import mockFs from 'mock-fs';

beforeEach(() => {
  mockFs({
    '/test': {
      'action.yml': 'name: Test Action',
      'README.md': '# Test',
    },
  });
});

afterEach(() => {
  mockFs.restore();
});
```

### CI/CD Testing Patterns

#### Generator Adapter Testing

Test documentation generation with real manifest files:

```typescript
it('should generate complete documentation', async () => {
  // Arrange: Real action.yml content
  const actionContent = `
name: My Action
description: Test action
inputs:
  test-input:
    description: Test input
`;

  // Act: Generate documentation
  await generator.generateDocumentation({
    source: '/test/action.yml',
    // ... other parameters
  });

  // Assert: Verify generated content
  const result = readFileSync('/test/README.md', 'utf-8');
  expect(result).toContain('## Inputs');
});
```

#### Migration Testing

Test migration adapters with before/after scenarios:

```typescript
it('should migrate action-docs markers', async () => {
  const before = `
<!-- action-docs-inputs source="action.yml" -->
<!-- action-docs-outputs source="action.yml" -->
`;

  const expected = `
<!-- inputs:start -->
<!-- inputs:end -->
<!-- outputs:start -->
<!-- outputs:end -->
`;

  const result = await migrationAdapter.migrate(before);
  expect(result).toBe(expected);
});
```

## Common Testing Patterns

### Repository Provider Testing

```typescript
describe('GitHubRepositoryProvider', () => {
  it('should support GitHub repositories', async () => {
    // Mock Git remote URL
    mockGitRemote('https://github.com/owner/repo.git');

    const supports = await provider.supports();
    expect(supports).toBe(true);
  });
});
```

### CLI Testing

```typescript
describe('CLI', () => {
  it('should generate documentation with valid options', async () => {
    const result = await cli.run([
      'generate',
      '--source',
      '/test/action.yml',
      '--dry-run',
    ]);

    expect(result.exitCode).toBe(0);
  });
});
```

## Performance Testing

### Benchmarking

For performance-critical operations:

```typescript
it('should parse large action files efficiently', () => {
  const start = performance.now();

  parser.parse(largeActionContent);

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100); // ms
});
```

## Troubleshooting Tests

### Common Issues

#### File System Permissions

```typescript
// Ensure mock-fs is properly restored
afterEach(() => {
  mockFs.restore();
});
```

#### Dependency Injection

```typescript
// Verify container bindings
beforeEach(() => {
  container.isBound(TYPES.SomeService)
    ? container.rebind(TYPES.SomeService)
    : container.bind(TYPES.SomeService);
});
```

#### Async Operations

```typescript
// Always await async operations in tests
await expect(async () => {
  await service.methodThatThrows();
}).rejects.toThrow('Expected error');
```

### Debug Tests

```bash
# Run single test file with debug output
nx test core --testNamePattern="specific test name"

# Run with verbose output
nx test core --verbose
```

## Related Documentation

- [Setup Guide](./setup.md) - Development environment setup
- [Architecture](./architecture.md) - Understanding the codebase structure
- [Contributing](./contributing.md) - Contribution guidelines

### Core Testing Framework

- **[Vitest](https://vitest.dev/)** - Fast, modern test runner with Vite integration

### Testing Utilities

- **[mock-fs](https://github.com/tschaub/mock-fs)** - File system mocking

## Test Structure

### Test Organization

```text
packages/
├── core/
│   ├── src/
│   │   ├── services/
│   │   │   ├── repository.service.ts
│   │   │   └── repository.service.spec.ts
│   │   └── adapters/
│   │       ├── markdown-formatter.adapter.ts
│   │       └── markdown-formatter.adapter.spec.ts
│   └── vitest.config.ts
└── cli/
    ├── src/
    │   ├── commands/
    │   │   ├── generate.command.ts
    │   │   └── generate.command.spec.ts
    │   └── integration/
    │       └── cli.integration.spec.ts
    └── vitest.config.ts
```

### Test Types

#### 1. Unit Tests

Test individual components in isolation.

#### 2. End-to-End Tests

Test complete user workflows

## Test Configuration

### Vitest Configuration

Each package has its own `vitest.config.ts`.

## Mocking Strategies

### Mock Data Factories

Use mock data factories to create consistent and controlled test data.
See `packages/cicd/github-actions/__tests__/github-action-mock.factory.ts` for examples.

### File System Mocking

Use `mock-fs` to mock file system operations in tests.
See `packages/core/src/services/repository.service.spec.ts` for an example.

### Dependency Injection Mocking

See `packages/cli/src/commands/generate.command.spec.ts` for a concrete DI-based test example used in the project.

## Snapshot Testing

### HTML/Markdown Snapshots

See `packages/cicd/github-actions/src/section-generators/usage.spec.ts` for an example of HTML/Markdown snapshot testing.

### Updating Snapshots

```bash
# Update all snapshots
pnpm test -- --update-snapshots

# Update snapshots for specific package
pnpm nx run @ci-dokumentor/cli:test --update-snapshots

# Update specific snapshot
pnpm test --update-snapshots --grep "usage section"
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm nx run @ci-dokumentor/cli:test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test:ci

# Run specific test file
pnpm nx run @ci-dokumentor/core:test packages/core/src/services/repository.service.spec.ts
```

### Advanced Test Commands

```bash
# Run tests matching pattern
pnpm test -- --grep "RepositoryService"

# Run tests with different timeout
pnpm test -- --timeout 10000

# Run tests with custom reporter
pnpm test -- --reporter=verbose

# Run tests in parallel
pnpm test -- --threads

# Run tests with debugging
pnpm test -- --inspect-brk
```

### NX Test Commands

```bash
# Run affected tests only
nx affected:test

# Run tests for all packages
nx run-many --target=test --all

# Run tests with caching
nx run-many --target=test --all --cache

# Run tests in parallel
nx run-many --target=test --all --parallel
```

## Coverage Reports

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:ci

# Open HTML coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Coverage and thresholds

Coverage thresholds and per-package configuration live in each package's test configuration (typically `packages/*/vitest.config.ts`). Open the package's config and the `package.json` scripts to see the exact thresholds used by that package.

### CI test workflow

The repository CI runs tests via the workflow at `.github/workflows/test.yml` and uses the workspace test runner (`pnpm`, `nx`) to execute Vitest and upload coverage. See the workflow file for the exact CI steps and matrix.

### Local CI simulation

Simulate the CI locally by setting `CI=true` and running the workspace CI commands used in the workflow, for example:

```bash
export CI=true
export NODE_ENV=test
pnpm test:ci
pnpm lint --max-warnings 0
pnpm build
```

## Test maintenance

Follow standard practices: mock external services, keep tests deterministic, parallelize where safe, and clean up state in hooks. For concrete examples, open the spec files and **tests** under `packages/*/__tests__`.

### Keeping Tests Fast

1. **Use mocks** instead of real external services
2. **Parallelize tests** where possible
3. **Use test.concurrent** for independent tests
4. **Cache test dependencies**
5. **Clean up resources** in afterEach hooks

### Flaky Test Prevention

1. **Avoid timing dependencies**
2. **Clean up state** between tests
3. **Use deterministic test data**
4. **Mock external dependencies**
5. **Test in isolation**

## Test documentation

```typescript
describe('Component', () => {
  describe('when condition A', () => {
    it('should behave in way X', () => {
      // Test implementation
    });

    it('should not behave in way Y', () => {
      // Test implementation
    });
  });

  describe('when condition B', () => {
    it('should behave in way Z', () => {
      // Test implementation
    });
  });
});
```

## Related Documentation

- [Development Setup](./setup) - Setting up your development environment
- [Contributing](./contributing) - How to contribute to the project
- [CI/CD Guide](./ci-cd) - Understanding our build pipeline
- [Architecture](./architecture) - System architecture overview
