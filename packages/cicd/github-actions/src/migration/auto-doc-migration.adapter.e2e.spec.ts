import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { AutoDocMigrationAdapter } from './auto-doc-migration.adapter.js';
import { MarkdownFormatterAdapter, FileRendererAdapter, FileReaderAdapter } from '@ci-dokumentor/core';
import mockFs from 'mock-fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { initTestContainer } from '../container.js';

describe('AutoDocMigrationAdapter', () => {
  let adapter: AutoDocMigrationAdapter;
  let formatterAdapter: MarkdownFormatterAdapter;
  let rendererAdapter: FileRendererAdapter;
  let readerAdapter: FileReaderAdapter;

  beforeEach(() => {
    // Use real dependencies from the container for e2e testing
    const container = initTestContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);
    readerAdapter = container.get(FileReaderAdapter);
    adapter = container.get(AutoDocMigrationAdapter);
  });

  afterEach(() => {
    // Restore the real file system after each test
    mockFs.restore();
  });

  describe('getName', () => {
    it('returns the adapter name', () => {
      // Arrange
      // Act
      const name = adapter.getName();
      // Assert
      expect(name).toBe('auto-doc');
    });
  });

  describe('supportsDestination', () => {
    it('detects headers in files', () => {
      // Arrange
      const tmpPath = join(tmpdir(), `autodoc-support-${Date.now()}.md`);
      mockFs({ [tmpPath]: '## Inputs' });
      // Act
      const supported = adapter.supportsDestination(tmpPath);
      // Assert
      expect(supported).toBe(true);
    });

    it('returns false for missing files', () => {
      // Arrange
      // Act
      const supported = adapter.supportsDestination('NON_EXISTENT_FILE.md');
      // Assert
      expect(supported).toBe(false);
    });
  });

  describe('migrateDocumentation', () => {
    it('wraps markdown headers with ci-dokumentor markers (e2e test)', async () => {
      // Arrange: create a file with markdown headers that should be wrapped
      const source = `## Description

Some description here

## Inputs

| Name   | Description |
|--------|-------------|
| input1 | First input |

## Outputs

| Name    | Description  |
|---------|--------------|
| output1 | First output |

## Secrets

- SECRET_X
`;

      const tmpPath = join(tmpdir(), `autodoc-e2e - ${Date.now()}.md`);

      // Mock the file system with the source content
      mockFs({ [tmpPath]: source });

      // Initialize real renderer with real formatter
      await rendererAdapter.initialize(tmpPath, formatterAdapter);

      // Act: perform migration using real dependencies
      await adapter.migrateDocumentation({
        destination: tmpPath,
        rendererAdapter: rendererAdapter,
        readerAdapter: readerAdapter
      });

      // Finalize renderer
      await rendererAdapter.finalize();

      // Assert: read the actual file content and verify headers are wrapped with markers
      const actualContent = readFileSync(tmpPath, 'utf-8');
      const expectedContent = `<!-- overview:start -->

## Description

Some description here

<!-- overview:end -->
<!-- inputs:start -->

## Inputs

| Name   | Description |
|--------|-------------|
| input1 | First input |

<!-- inputs:end -->
<!-- outputs:start -->

## Outputs

| Name    | Description  |
|---------|--------------|
| output1 | First output |

<!-- outputs:end -->
<!-- secrets:start -->

## Secrets

- SECRET_X

<!-- secrets:end -->

<!-- header:start -->
<!-- header:end -->

<!-- badges:start -->
<!-- badges:end -->

<!-- usage:start -->
<!-- usage:end -->

<!-- examples:start -->
<!-- examples:end -->

<!-- contributing:start -->
<!-- contributing:end -->

<!-- security:start -->
<!-- security:end -->

<!-- license:start -->
<!-- license:end -->

<!-- generated:start -->
<!-- generated:end -->
`;

      expect(actualContent).toEqual(expectedContent);
    });
  });
});