import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { GitHubActionReadmeGeneratorMigrationAdapter } from './github-action-readme-generator-migration.adapter.js';
import { FileRendererAdapter, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import mockFs from 'mock-fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

describe('GitHubActionReadmeGeneratorMigrationAdapter', () => {
  let adapter: GitHubActionReadmeGeneratorMigrationAdapter;
  let formatterAdapter: MarkdownFormatterAdapter;
  let rendererAdapter: FileRendererAdapter;

  beforeEach(() => {
    // Use real dependencies for e2e testing
    formatterAdapter = new MarkdownFormatterAdapter();
    rendererAdapter = new FileRendererAdapter();
    adapter = new GitHubActionReadmeGeneratorMigrationAdapter();
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
      expect(name).toBe('github-action-readme-generator');
    });
  });

  describe('supportsDestination', () => {
    it('detects start/end markers in files', () => {
      // Arrange
      const tmpPath = join(tmpdir(), `gharg-support-${Date.now()}.md`);
      mockFs({ [tmpPath]: '<!-- start inputs -->' });
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
    it('migrates github-action-readme-generator markers to ci-dokumentor format (e2e test)', async () => {
      // Arrange: create a file with github-action-readme-generator markers
      const source = [
        '<!-- start branding -->',
        'Brand stuff',
        '<!-- end branding -->',
        '<!-- start title -->',
        'Header here',
        '<!-- end title -->',
        '<!-- start badges -->',
        'BadgeA',
        '<!-- end badges -->',
        '<!-- start description -->',
        'A description',
        '<!-- end description -->',
        '<!-- start contents -->',
        'Contents here',
        '<!-- end contents -->',
        '<!-- start usage -->',
        'Usage details',
        '<!-- end usage -->',
        '<!-- start inputs -->',
        'Input details',
        '<!-- end inputs -->',
        '<!-- start outputs -->',
        'Output details',
        '<!-- end outputs -->',
        '<!-- START [.github/GHADOCS/EXAMPLES/] -->',
        'ExampleX',
        '<!-- end [.github/ghadocs/examples/] -->'
      ].join('\n');

      const tmpPath = join(tmpdir(), `gharg-e2e-${Date.now()}.md`);

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
        '<!-- badges:start -->',
        '',
        'Brand stuff',
        '<!-- badges:end -->',
        '',
        '<!-- header:start -->',
        '',
        'Header here',
        '<!-- header:end -->',
        '',
        '<!-- badges:start -->',
        '',
        'BadgeA',
        '<!-- badges:end -->',
        '',
        '<!-- overview:start -->',
        '',
        'A description',
        '<!-- overview:end -->',
        '',
        '<!-- start contents -->',
        'Contents here',
        '<!-- end contents -->',
        '<!-- usage:start -->',
        '',
        'Usage details',
        '<!-- usage:end -->',
        '',
        '<!-- inputs:start -->',
        '',
        'Input details',
        '<!-- inputs:end -->',
        '',
        '<!-- outputs:start -->',
        '',
        'Output details',
        '<!-- outputs:end -->',
        '',
        '<!-- examples:start -->',
        '',
        'ExampleX',
        '<!-- examples:end -->',
        ''
      ].join('\n');

      expect(actualContent).toEqual(expectedContent);
    });
  });
});