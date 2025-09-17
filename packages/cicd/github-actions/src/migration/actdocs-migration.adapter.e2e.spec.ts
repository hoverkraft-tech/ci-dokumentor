import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { ActdocsMigrationAdapter } from './actdocs-migration.adapter.js';
import { MarkdownFormatterAdapter, FileRendererAdapter } from '@ci-dokumentor/core';
import mockFs from 'mock-fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { initTestContainer } from '../container.js';

describe('ActdocsMigrationAdapter', () => {
  let formatterAdapter: MarkdownFormatterAdapter;
  let rendererAdapter: FileRendererAdapter;
  let adapter: ActdocsMigrationAdapter;

  beforeEach(() => {
    // Use real dependencies from the container for e2e testing
    const container = initTestContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);
    adapter = container.get(ActdocsMigrationAdapter);
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('getName', () => {
    it('returns the adapter name', () => {
      // Arrange
      // Act
      const name = adapter.getName();
      // Assert
      expect(name).toBe('actdocs');
    });
  });

  describe('supportsDestination', () => {
    it('returns true when a file contains actdocs markers', () => {
      // Arrange
      const tmpPath = join(tmpdir(), `actdocs-support-${Date.now()}.md`);
      mockFs({ [tmpPath]: '<!-- actdocs inputs start -->\nInput\n<!-- actdocs inputs end -->' });
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
    it('migrates actdocs markers to ci-dokumentor format (e2e test)', async () => {
      // Arrange: create a file with actdocs markers
      const source = [
        '<!-- actdocs description start -->',
        'Description here',
        '<!-- actdocs description end -->',
        '<!-- actdocs inputs start -->',
        'Input details here',
        '<!-- actdocs inputs end -->',
        '<!-- actdocs secrets start -->',
        'Secret stuff',
        '<!-- actdocs secrets end -->',
        '<!-- actdocs outputs start -->',
        'Output stuff',
        '<!-- actdocs outputs end -->',
        '<!-- actdocs permissions start -->',
        'Perm stuff',
        '<!-- actdocs permissions end -->'
      ].join('\n');

      const tmpPath = join(tmpdir(), `actdocs-e2e-${Date.now()}.md`);

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
      const expectedContent = [
        '<!-- overview:start -->',
        '',
        'Description here',
        '<!-- overview:end -->',
        '',
        '<!-- inputs:start -->',
        '',
        'Input details here',
        '<!-- inputs:end -->',
        '',
        '<!-- secrets:start -->',
        '',
        'Secret stuff',
        '<!-- secrets:end -->',
        '',
        '<!-- outputs:start -->',
        '',
        'Output stuff',
        '<!-- outputs:end -->',
        '',
        '<!-- security:start -->',
        '',
        'Perm stuff',
        '<!-- security:end -->',
        ''
      ].join('\n');

      expect(actualContent).toEqual(expectedContent);
    });

    it('handles files with no actdocs markers (e2e test)', async () => {
      // Arrange: create a file with no actdocs markers
      const source = 'No markers here';
      const tmpPath = join(tmpdir(), `actdocs-no-markers-${Date.now()}.md`);

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

      // Assert: read the actual file content and verify it remains unchanged
      const actualContent = readFileSync(tmpPath, 'utf-8');
      expect(actualContent).toEqual('No markers here');
    });
  });
});