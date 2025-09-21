import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { GitHubActionReadmeGeneratorMigrationAdapter } from './github-action-readme-generator-migration.adapter.js';
import { FileRendererAdapter, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import mockFs from 'mock-fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { initTestContainer } from '../container.js';

describe('GitHubActionReadmeGeneratorMigrationAdapter', () => {
  let adapter: GitHubActionReadmeGeneratorMigrationAdapter;
  let formatterAdapter: MarkdownFormatterAdapter;
  let rendererAdapter: FileRendererAdapter;

  beforeEach(() => {
    vi.resetAllMocks();

    // Use real dependencies from the container for e2e testing
    const container = initTestContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);
    adapter = container.get(GitHubActionReadmeGeneratorMigrationAdapter);
  });

  afterEach(() => {
    // Restore the real file system after each test
    mockFs.restore();

    vi.resetAllMocks();
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
    it('detects start/end markers in files', async () => {
      // Arrange
      const tmpPath = join(tmpdir(), `gharg-support-${Date.now()}.md`);
      mockFs({ [tmpPath]: '<!-- start inputs -->' });
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
    it('migrates github-action-readme-generator markers to ci-dokumentor format (e2e test)', async () => {
      // Arrange: create a file with github-action-readme-generator markers
      const source = `<!-- start branding -->
Brand stuff
<!-- end branding -->
<!-- start title -->
Header here
<!-- end title -->
<!-- start badges -->
BadgeA
<!-- end badges -->
<!-- start description -->
A description
<!-- end description -->
<!-- start contents -->
Contents here
<!-- end contents -->
<!-- start usage -->
Usage details
<!-- end usage -->
<!-- start inputs -->
Input details
<!-- end inputs -->
<!-- start outputs -->
Output details
<!-- end outputs -->
<!-- START [.github/GHADOCS/EXAMPLES/] -->
ExampleX
<!-- end [.github/ghadocs/examples/] -->
`;

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
      const expectedContent = `<!-- header:start -->

Brand stuff

Header here

<!-- header:end -->

<!-- badges:start -->

BadgeA

<!-- badges:end -->

<!-- overview:start -->

A description

<!-- overview:end -->


Contents here

<!-- usage:start -->

Usage details

<!-- usage:end -->

<!-- inputs:start -->

Input details

<!-- inputs:end -->

<!-- outputs:start -->

Output details

<!-- outputs:end -->

<!-- secrets:start -->
<!-- secrets:end -->

<!-- examples:start -->

ExampleX

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