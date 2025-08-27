---
sidebar_position: 3
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

### Core Testing Framework

- **[Vitest](https://vitest.dev/)** - Fast, modern test runner with Vite integration

### Testing Utilities

- **[mock-fs](https://github.com/tschaub/mock-fs)** - File system mocking
- **[jest-serializer-html](https://github.com/rayrutjes/jest-serializer-html)** - HTML snapshot testing

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
See `packages/cicd/github-actions/src/test-utils/github-action-mock.factory.ts` for examples.

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
pnpm test --filter @ci-dokumentor/core -- --update-snapshots

# Update specific snapshot
pnpm test -- --update-snapshots --grep "usage section"
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter @ci-dokumentor/core

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test:ci

# Run specific test file
pnpm test packages/core/src/services/repository.service.spec.ts
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

Follow standard practices: mock external services, keep tests deterministic, parallelize where safe, and clean up state in hooks. For concrete examples, open the spec files and test-utils under `packages/*/src/test-utils`.

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
