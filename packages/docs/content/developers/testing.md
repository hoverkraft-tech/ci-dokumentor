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
- **[@vitest/ui](https://vitest.dev/guide/ui.html)** - Browser-based test UI
- **[jsdom](https://github.com/jsdom/jsdom)** - DOM implementation for testing

### Testing Utilities

- **[ts-mockito](https://github.com/NagRock/ts-mockito)** - TypeScript-friendly mocking
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

Test individual components in isolation:

```typescript title="packages/core/src/services/repository.service.spec.ts"
import { describe, it, expect, beforeEach } from 'vitest';
import { mock, instance, when, anything } from 'ts-mockito';
import { RepositoryService } from './repository.service';
import { IRepositoryProvider } from '../interfaces/repository-provider.interface';

describe('RepositoryService', () => {
  let service: RepositoryService;
  let mockProvider: IRepositoryProvider;

  beforeEach(() => {
    mockProvider = mock<IRepositoryProvider>();
    service = new RepositoryService(instance(mockProvider));
  });

  describe('getRepositoryInfo', () => {
    it('should return repository information for valid URL', async () => {
      // Arrange
      const url = 'https://github.com/user/repo';
      const expectedRepo = {
        name: 'repo',
        owner: 'user',
        url,
        defaultBranch: 'main',
      };

      when(mockProvider.getRepository(url)).thenResolve(expectedRepo);

      // Act
      const result = await service.getRepositoryInfo(url);

      // Assert
      expect(result).toEqual(expectedRepo);
    });

    it('should throw error for invalid URL', async () => {
      // Arrange
      const invalidUrl = 'not-a-url';
      when(mockProvider.getRepository(invalidUrl)).thenReject(
        new Error('Invalid URL'),
      );

      // Act & Assert
      await expect(service.getRepositoryInfo(invalidUrl)).rejects.toThrow(
        'Invalid URL',
      );
    });
  });
});
```

#### 2. Integration Tests

Test component interactions:

```typescript title="packages/cicd/github-actions/src/github-actions-generator.integration.spec.ts"
import { describe, it, expect, beforeAll } from 'vitest';
import { GitHubActionsGeneratorAdapter } from './github-actions-generator.adapter';
import { GitHubActionsParser } from './github-actions-parser';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';

describe('GitHubActionsGenerator Integration', () => {
  let generator: GitHubActionsGeneratorAdapter;
  let parser: GitHubActionsParser;
  let repositoryProvider: GitRepositoryProvider;

  beforeAll(() => {
    generator = new GitHubActionsGeneratorAdapter();
    parser = new GitHubActionsParser();
    repositoryProvider = new GitRepositoryProvider();
  });

  it('should generate complete documentation for real action', async () => {
    // Arrange
    const actionPath = './test-data/action.yml';
    const repositoryUrl = 'https://github.com/test/action';

    // Act
    const manifest = await parser.parse(actionPath);
    const repository = await repositoryProvider.getRepository(repositoryUrl);
    const documentation = await generator.generate(manifest, repository);

    // Assert
    expect(documentation).toContain('# Test Action');
    expect(documentation).toContain('## Inputs');
    expect(documentation).toContain('## Outputs');
    expect(documentation).toContain('## Usage');
  });
});
```

#### 3. End-to-End Tests

Test complete user workflows:

```typescript title="packages/cli/src/e2e/cli.e2e.spec.ts"
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI E2E Tests', () => {
  const testDir = path.join(__dirname, 'temp-test');
  const actionFile = path.join(testDir, 'action.yml');
  const outputDir = path.join(testDir, 'docs');

  beforeEach(() => {
    // Create test directory and action file
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(
      actionFile,
      `
name: 'Test Action'
description: 'A test action'
inputs:
  test-input:
    description: 'Test input'
    required: true
outputs:
  test-output:
    description: 'Test output'
runs:
  using: 'node20'
  main: 'index.js'
    `,
    );
  });

  afterEach(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should generate documentation via CLI', () => {
    // Act
    const result = execSync(
      `node dist/bin/ci-dokumentor.js "${actionFile}" --output "${outputDir}"`,
      { encoding: 'utf8', cwd: path.join(__dirname, '../../') },
    );

    // Assert
    expect(result).toContain('Documentation generated successfully');
    expect(fs.existsSync(path.join(outputDir, 'README.md'))).toBe(true);

    const generatedContent = fs.readFileSync(
      path.join(outputDir, 'README.md'),
      'utf8',
    );
    expect(generatedContent).toContain('# Test Action');
    expect(generatedContent).toContain('## Inputs');
  });
});
```

## Test Configuration

### Vitest Configuration

Each package has its own `vitest.config.ts`:

```typescript title="packages/core/vitest.config.ts"
/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/test-data/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

### Global Test Setup

```typescript title="packages/core/src/test-setup.ts"
import { beforeEach } from 'vitest';
import 'reflect-metadata'; // Required for dependency injection

// Global test setup
beforeEach(() => {
  // Reset any global state
  jest.clearAllMocks?.();
});

// Custom matchers
expect.extend({
  toBeValidMarkdown(received: string) {
    const hasHeaders = /^#+\s/.test(received);
    const pass = hasHeaders && received.length > 0;

    return {
      message: () =>
        pass
          ? `Expected ${received} not to be valid markdown`
          : `Expected ${received} to be valid markdown`,
      pass,
    };
  },
});

declare global {
  namespace Vi {
    interface Assertion {
      toBeValidMarkdown(): void;
    }
  }
}
```

## Test Data Management

### Test Data Organization

```text
test-data/
├── actions/
│   ├── basic-action.yml
│   ├── composite-action.yml
│   └── docker-action.yml
├── workflows/
│   ├── ci-workflow.yml
│   └── deploy-workflow.yml
├── repositories/
│   ├── github-repo.json
│   └── git-repo.json
└── expected-outputs/
    ├── basic-action-output.md
    └── ci-workflow-output.md
```

### Test Data Builders

Create reusable test data builders:

```typescript title="packages/core/src/test-utils/repository.builder.ts"
export class RepositoryBuilder {
  private repository: Partial<Repository> = {};

  withName(name: string): this {
    this.repository.name = name;
    return this;
  }

  withOwner(owner: string): this {
    this.repository.owner = owner;
    return this;
  }

  withUrl(url: string): this {
    this.repository.url = url;
    return this;
  }

  withDefaultBranch(branch: string): this {
    this.repository.defaultBranch = branch;
    return this;
  }

  build(): Repository {
    return {
      name: this.repository.name || 'test-repo',
      owner: this.repository.owner || 'test-owner',
      url: this.repository.url || 'https://github.com/test-owner/test-repo',
      defaultBranch: this.repository.defaultBranch || 'main',
      ...this.repository,
    } as Repository;
  }
}

// Usage in tests
const testRepo = new RepositoryBuilder()
  .withName('my-action')
  .withOwner('my-org')
  .withDefaultBranch('develop')
  .build();
```

### Mock Data Factories

```typescript title="packages/test-utils/src/mock-data.factory.ts"
export class MockDataFactory {
  static createGitHubAction(
    overrides: Partial<GitHubAction> = {},
  ): GitHubAction {
    return {
      name: 'Test Action',
      description: 'A test action for unit testing',
      author: 'Test Author',
      inputs: {
        'test-input': {
          description: 'A test input',
          required: true,
          default: 'test-value',
        },
      },
      outputs: {
        'test-output': {
          description: 'A test output',
        },
      },
      runs: {
        using: 'node20',
        main: 'index.js',
      },
      branding: {
        icon: 'star',
        color: 'blue',
      },
      ...overrides,
    };
  }

  static createRepository(overrides: Partial<Repository> = {}): Repository {
    return {
      name: 'test-repo',
      owner: 'test-owner',
      url: 'https://github.com/test-owner/test-repo',
      defaultBranch: 'main',
      description: 'A test repository',
      ...overrides,
    };
  }
}
```

## Mocking Strategies

### File System Mocking

```typescript title="packages/core/src/adapters/file-output.adapter.spec.ts"
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { FileOutputAdapter } from './file-output.adapter';

describe('FileOutputAdapter', () => {
  let adapter: FileOutputAdapter;

  beforeEach(() => {
    adapter = new FileOutputAdapter();

    // Mock file system
    mockFs({
      '/test': {
        'existing-file.txt': 'existing content',
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('should write file to specified path', async () => {
    // Act
    await adapter.writeFile('/test/new-file.txt', 'test content');

    // Assert
    const content = require('fs').readFileSync('/test/new-file.txt', 'utf8');
    expect(content).toBe('test content');
  });
});
```

### HTTP Mocking

```typescript title="packages/repository/github/src/github-api.spec.ts"
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubApiClient } from './github-api.client';

// Mock fetch globally
global.fetch = vi.fn();

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;

  beforeEach(() => {
    client = new GitHubApiClient('fake-token');
    vi.clearAllMocks();
  });

  it('should fetch repository information', async () => {
    // Arrange
    const mockResponse = {
      name: 'test-repo',
      owner: { login: 'test-owner' },
      default_branch: 'main',
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // Act
    const result = await client.getRepository('test-owner', 'test-repo');

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/test-owner/test-repo',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token fake-token',
        }),
      }),
    );
    expect(result.name).toBe('test-repo');
  });
});
```

### Dependency Injection Mocking

```typescript title="packages/cli/src/commands/generate.command.spec.ts"
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { mock, instance, when } from 'ts-mockito';
import { GenerateCommand } from './generate.command';
import { IDocumentationService } from '../interfaces';

describe('GenerateCommand', () => {
  let command: GenerateCommand;
  let container: Container;
  let mockDocumentationService: IDocumentationService;

  beforeEach(() => {
    container = new Container();
    mockDocumentationService = mock<IDocumentationService>();

    container
      .bind<IDocumentationService>('DocumentationService')
      .toConstantValue(instance(mockDocumentationService));

    command = container.get<GenerateCommand>(GenerateCommand);
  });

  it('should generate documentation', async () => {
    // Arrange
    when(mockDocumentationService.generate('action.yml')).thenResolve(
      '# Generated Documentation',
    );

    // Act
    await command.execute(['action.yml']);

    // Assert
    verify(mockDocumentationService.generate('action.yml')).once();
  });
});
```

## Snapshot Testing

### HTML/Markdown Snapshots

```typescript title="packages/cicd/github-actions/src/section-generators/usage.spec.ts"
import { describe, it, expect } from 'vitest';
import { UsageSectionGenerator } from './usage-section-generator';

describe('UsageSectionGenerator', () => {
  it('should generate usage section', () => {
    // Arrange
    const generator = new UsageSectionGenerator();
    const action = MockDataFactory.createGitHubAction({
      name: 'Test Action',
      inputs: {
        'api-key': {
          description: 'API key for authentication',
          required: true,
        },
      },
    });

    // Act
    const result = generator.generate(action);

    // Assert
    expect(result.toString()).toMatchSnapshot('usage-section');
  });
});
```

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

### Coverage Thresholds

Each package has coverage thresholds defined in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Excluding from Coverage

```typescript
// Exclude specific lines
/* c8 ignore next 3 */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}

// Exclude entire function
/* c8 ignore start */
function debugFunction() {
  console.log('This is only for debugging');
}
/* c8 ignore stop */
```

## Performance Testing

### Benchmark Tests

```typescript title="packages/core/src/performance/formatter.bench.ts"
import { describe, bench } from 'vitest';
import { MarkdownFormatterAdapter } from '../adapters/markdown-formatter.adapter';

describe('MarkdownFormatterAdapter Performance', () => {
  const formatter = new MarkdownFormatterAdapter();
  const largeContent = 'x'.repeat(10000);

  bench('format large content', () => {
    formatter.format(largeContent);
  });

  bench('format table with many rows', () => {
    const headers = ['Col1', 'Col2', 'Col3'];
    const rows = Array(1000).fill(['Value1', 'Value2', 'Value3']);
    formatter.formatTable(headers, rows);
  });
});
```

### Memory Usage Tests

```typescript title="packages/cli/src/performance/memory.spec.ts"
describe('Memory Usage Tests', () => {
  it('should not leak memory during large document generation', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Generate many documents
    for (let i = 0; i < 100; i++) {
      await generator.generate(largeAction, repository);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory should not increase significantly
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

## Continuous Integration Testing

### GitHub Actions Test Workflow

```yaml title=".github/workflows/test.yml"
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: latest

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Local CI Simulation

```bash
# Simulate CI environment locally
export CI=true
export NODE_ENV=test

# Run full CI test suite
pnpm test:ci

# Run linting like CI
pnpm lint --max-warnings 0

# Run build like CI
pnpm build
```

## Test Maintenance

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

### Test Documentation

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
