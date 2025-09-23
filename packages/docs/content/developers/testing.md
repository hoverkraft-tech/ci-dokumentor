---
title: Testing Guide
description: Comprehensive testing strategies and tools for CI Dokumentor development
sidebar_position: 6
---

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
- **[Mock-fs](https://github.com/tschaub/mock-fs)** - File system mocking for end-to-end tests
- **[InversifyJS Testing](https://inversify.io/)** - Dependency injection mocking and testing patterns
- **[@vitest/coverage-v8](https://vitest.dev/guide/coverage)** - Code coverage reporting

### Test Types

#### Unit Tests

Fast, isolated tests focusing on individual components:

```bash
# Run all unit tests
pnpm test

# Run tests for specific package
pnpm nx test core
pnpm nx test cli
pnpm nx test repository-github

# Run tests for specific file
pnpm nx test core src/formatter/markdown/markdown-formatter.adapter.spec.ts
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
pnpm nx test core --watch
```

### Package-Specific Commands

```bash
# Core package tests
pnpm nx test core

# CLI package tests
pnpm nx test cli

# GitHub Actions package tests
pnpm nx test cicd-github-actions

# Repository providers
pnpm nx test repository-git
pnpm nx test repository-github
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

Use mock-fs for **End-to-end** file system operations tests **only**:

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
pnpm nx test core --testNamePattern="specific test name"

# Run with verbose output
pnpm nx test core --verbose
```

## Related Documentation

- [Setup Guide](./setup.md) - Development environment setup
- [Architecture](./architecture.md) - Understanding the codebase structure
- [Contributing](./contributing.md) - Contribution guidelines
