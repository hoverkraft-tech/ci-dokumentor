import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { ActionDocsMigrationAdapter } from './action-docs-migration.adapter.js';
import mockFs from 'mock-fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { MarkdownFormatterAdapter, FileRendererAdapter } from '@ci-dokumentor/core';
import { initTestContainer } from '../container.js';

describe('ActionDocsMigrationAdapter', () => {
  let formatterAdapter: MarkdownFormatterAdapter;
  let rendererAdapter: FileRendererAdapter;
  let adapter: ActionDocsMigrationAdapter;

  beforeEach(() => {
    // Use real dependencies from the container for e2e testing
    const container = initTestContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);
    adapter = container.get(ActionDocsMigrationAdapter);
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
      expect(name).toBe('action-docs');
    });
  });

  describe('supportsDestination', () => {
    it('detects markers in files', async () => {
      // Arrange
      const tmpPath = join(tmpdir(), `actiondocs-support-${Date.now()}.md`);
      mockFs({ [tmpPath]: '<!-- action-docs-inputs source="action.yml" -->' });
      // Act
      const supported = await adapter.supportsDestination(tmpPath);
      // Assert
      expect(supported).toBe(true);
    });

    it('returns false for missing files', async () => {
      // Arrange
      // Act
      const supported = await adapter.supportsDestination('NON_EXISTENT_FILE.md');
      // Assert
      expect(supported).toBe(false);
    });
  });

  describe('migrateDocumentation', () => {
    it('migrates action-docs markers to ci-dokumentor format (e2e test)', async () => {
      // Arrange: create a file with action-docs markers
      const source = `<!-- action-docs-header source="action.yml" -->
Header here
<!-- action-docs-header source="action.yml" -->
<!-- action-docs-description source="action.yml" -->
Desc here
<!-- action-docs-description source="action.yml" -->
<!-- action-docs-inputs source="action.yml" -->
Input details here
<!-- action-docs-inputs source="action.yml" -->
<!-- action-docs-outputs source="action.yml" -->
Output details here
<!-- action-docs-outputs source="action.yml" -->
<!-- action-docs-runs source="action.yml" -->
Usage details here
<!-- action-docs-runs source="action.yml" -->
`;

      const tmpPath = join(tmpdir(), `actiondocs-e2e-${Date.now()}.md`);

      // Mock the file system with the source content
      mockFs({ [tmpPath]: source });

      // Initialize real renderer with real formatter
      await rendererAdapter.initialize(tmpPath, formatterAdapter);

      // Act: perform migration using real dependencies
      await adapter.migrateDocumentation({
        destination: tmpPath,
        rendererAdapter: rendererAdapter
      });

      // Finalize renderer
      await rendererAdapter.finalize();

      // Assert: read the actual file content and verify complete migration
      const actualContent = readFileSync(tmpPath, 'utf-8');
      const expectedContent = `<!-- header:start -->

Header here

<!-- header:end -->

<!-- badges:start -->
<!-- badges:end -->

<!-- overview:start -->

Desc here

<!-- overview:end -->

<!-- inputs:start -->

Input details here

<!-- inputs:end -->

<!-- outputs:start -->

Output details here

<!-- outputs:end -->

<!-- usage:start -->

Usage details here

<!-- usage:end -->

<!-- secrets:start -->
<!-- secrets:end -->

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