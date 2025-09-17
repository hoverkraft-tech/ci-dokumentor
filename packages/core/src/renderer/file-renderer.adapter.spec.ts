import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { existsSync, readFileSync } from 'node:fs';
import { MarkdownFormatterAdapter } from '../formatter/markdown-formatter.adapter.js';
import { FileRendererAdapter } from './file-renderer.adapter.js';

describe('FileRendererAdapter', () => {
  let formatterAdapter: MarkdownFormatterAdapter;

  let fileRendererAdapter: FileRendererAdapter;
  const testFilePath = '/test/document.md';
  const testSectionIdentifier = 'test-section';
  const testData = Buffer.from('New section content\n');

  beforeEach(() => {
    // Set up mock filesystem
    mockFs({
      '/test': {
        'document.md': 'Initial content\nSome text\n',
        'existing-section.md': [
          'Content before section',
          '<!-- test-section:start -->',
          'Old section content',
          '<!-- test-section:end -->',
          'Content after section',
          '',
        ].join('\n'),
        'multiple-sections.md': [
          'Header content',
          '<!-- first-section:start -->',
          '',
          'First section content',
          '',
          '<!-- first-section:end -->',
          'Middle content',
          '<!-- second-section:start -->',
          'Second section content',
          '<!-- second-section:end -->',
          'Footer content',
          '',
        ].join('\n'),
        'empty.md': '',
      },
      '/unsupported': {
        'document.txt': 'Text file content',
        'no-extension': 'File without extension',
      },
    });

    formatterAdapter = new MarkdownFormatterAdapter();

    fileRendererAdapter = new FileRendererAdapter();
  });

  afterEach(() => {
    // Restore real filesystem
    mockFs.restore();
  });

  describe('writeSection', () => {
    it('should append a new section when the file exists but has no matching section', async () => {
      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain('Initial content');
      expect(fileContent).toContain('Some text');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:start -->`);
      expect(fileContent).toContain('New section content');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:end -->`);
    });

    it('should replace existing section content when section already exists', async () => {
      // Arrange
      const adapterWithExistingSection = new FileRendererAdapter();

      // Act
      await adapterWithExistingSection.initialize('/test/existing-section.md', formatterAdapter);
      await adapterWithExistingSection.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync('/test/existing-section.md', 'utf-8');
      expect(fileContent).toContain('Content before section');
      expect(fileContent).toContain('Content after section');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:start -->`);
      expect(fileContent).toContain('New section content');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:end -->`);
      expect(fileContent).not.toContain('Old section content');
    });

    it('should handle empty files correctly', async () => {
      // Arrange
      const emptyFileAdapter = new FileRendererAdapter();

      // Act
      await emptyFileAdapter.initialize('/test/empty.md', formatterAdapter);
      await emptyFileAdapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync('/test/empty.md', 'utf-8');
      const expectedContent = `<!-- ${testSectionIdentifier}:start -->

New section content

<!-- ${testSectionIdentifier}:end -->
`;
      expect(fileContent).toBe(expectedContent);
    });

    it('should handle multiple sections without affecting other sections', async () => {
      // Arrange
      const multipleSectionsAdapter = new FileRendererAdapter();
      const newData = Buffer.from('Updated second section\n');

      // Act
      await multipleSectionsAdapter.initialize('/test/multiple-sections.md', formatterAdapter);
      await multipleSectionsAdapter.writeSection('second-section', newData);

      // Assert
      const fileContent = readFileSync('/test/multiple-sections.md', 'utf-8');

      // Should preserve first section with blank lines around content
      expect(fileContent).toEqual(`Header content
<!-- first-section:start -->

First section content

<!-- first-section:end -->
Middle content
<!-- second-section:start -->

Updated second section

<!-- second-section:end -->
Footer content
`);
    });

    it('should handle sections with complex content including line breaks', async () => {
      // Arrange
      const complexData = Buffer.from(
        'Line 1\nLine 2\n\nLine 4 with spaces   \n<!-- embedded comment -->'
      );

      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, complexData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(
        'Line 1\nLine 2\n\nLine 4 with spaces   \n<!-- embedded comment -->'
      );
    });

    it('should handle empty section content', async () => {
      // Arrange
      const emptyData = Buffer.alloc(0);

      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, emptyData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:start -->`);
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:end -->`);

      // Check that the section is empty
      const sectionStart = fileContent.indexOf(
        `<!-- ${testSectionIdentifier}:start -->`
      );
      const sectionEnd = fileContent.indexOf(
        `<!-- ${testSectionIdentifier}:end -->`
      );
      expect(sectionStart).toBeGreaterThan(-1);
      expect(sectionEnd).toBeGreaterThan(sectionStart);

      const sectionContent = fileContent.substring(
        sectionStart + `<!-- ${testSectionIdentifier}:start -->`.length,
        sectionEnd
      );
      // We expect three line breaks: the start marker's trailing newline plus two blank lines (before and after content)
      expect(sectionContent).toEqual('\n');
    });

    it('should handle special characters in section identifier', async () => {
      // Arrange
      const specialIdentifier = 'test-section_with.special@chars';
      const specialData = Buffer.from('Special content');

      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(specialIdentifier, specialData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(`<!-- ${specialIdentifier}:start -->`);
      expect(fileContent).toContain('Special content');
      expect(fileContent).toContain(`<!-- ${specialIdentifier}:end -->`);
    });

    it('should preserve file content order when adding new section', async () => {
      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      const lines = fileContent.split('\n');

      // Original content should come first
      expect(lines[0]).toBe('Initial content');
      expect(lines[1]).toBe('Some text');

      // New section should be appended
      const sectionStartIndex = lines.findIndex((line) =>
        line.includes(`<!-- ${testSectionIdentifier}:start -->`)
      );
      expect(sectionStartIndex).toBeGreaterThan(1);
    });

    it('should handle non-existent file by creating it', async () => {
      // Arrange
      const newFileAdapter = new FileRendererAdapter();

      // Act & Assert - This should fail because the file doesn't exist
      await newFileAdapter.initialize('/test/new-file.md', formatterAdapter);
      await newFileAdapter.writeSection(testSectionIdentifier, testData);

      expect(existsSync('/test/new-file.md')).toBe(true);
    });
  });

  describe('section markers', () => {
    it('should generate correct start markers', async () => {
      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:start -->`);
    });

    it('should generate correct end markers', async () => {
      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:end -->`);
    });

    it('should handle empty section identifier in markers', async () => {
      // Arrange
      const emptyIdentifier = '';

      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(emptyIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain('<!-- :start -->');
      expect(fileContent).toContain('<!-- :end -->');
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Arrange - Create a read-only file system
      mockFs.restore();
      mockFs({
        '/readonly': {
          'document.md': mockFs.file({
            content: 'Initial content',
            mode: 0o444, // Read-only
          }),
        },
      });

      const readOnlyAdapter = new FileRendererAdapter();

      // Act & Assert
      await readOnlyAdapter.initialize(testFilePath, formatterAdapter);
      await expect(
        readOnlyAdapter.writeSection(testSectionIdentifier, testData)
      ).rejects.toThrow('test');
    });

    it('should handle invalid file paths', async () => {
      // Arrange
      const invalidPathAdapter = new FileRendererAdapter();

      // Act & Assert
      await invalidPathAdapter.initialize('/nonexistent/path/file.md', formatterAdapter);
      await expect(
        invalidPathAdapter.writeSection(testSectionIdentifier, testData)
      ).rejects.toThrow("ENOENT, no such file or directory '/nonexistent/path/file.md'");
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple consecutive writes to the same section', async () => {
      // Arrange
      const firstData = Buffer.from('First content');
      const secondData = Buffer.from('Second content');
      const thirdData = Buffer.from('Third content');

      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, firstData);
      await fileRendererAdapter.writeSection(testSectionIdentifier, secondData);
      await fileRendererAdapter.writeSection(testSectionIdentifier, thirdData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain('Third content');
      expect(fileContent).not.toContain('First content');
      expect(fileContent).not.toContain('Second content');

      // Should only have one instance of each marker
      const startMarkers = (
        fileContent.match(
          new RegExp(`<!-- ${testSectionIdentifier}:start -->`, 'g')
        ) || []
      ).length;
      const endMarkers = (
        fileContent.match(
          new RegExp(`<!-- ${testSectionIdentifier}:end -->`, 'g')
        ) || []
      ).length;
      expect(startMarkers).toBe(1);
      expect(endMarkers).toBe(1);
    });

    it('should handle concurrent section updates', async () => {
      // Arrange
      const section1Data = Buffer.from('Section 1 content');
      const section2Data = Buffer.from('Section 2 content');

      // Act - Simulate concurrent writes to different sections
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await Promise.all([
        fileRendererAdapter.writeSection('section-1', section1Data),
        fileRendererAdapter.writeSection('section-2', section2Data),
      ]);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain('Section 1 content');
      expect(fileContent).toContain('Section 2 content');
      expect(fileContent).toContain('<!-- section-1:start -->');
      expect(fileContent).toContain('<!-- section-1:end -->');
      expect(fileContent).toContain('<!-- section-2:start -->');
      expect(fileContent).toContain('<!-- section-2:end -->');
    });
  });

  describe('getDestination', () => {
    it('should return the destination path after initialization', async () => {
      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      const destination = fileRendererAdapter.getDestination();

      // Assert
      expect(destination).toBe(testFilePath);
    });

    it('should throw error when trying to get destination before initialization', () => {
      // Act & Assert
      expect(() => fileRendererAdapter.getDestination()).toThrow('Destination not initialized');
    });

    it('should return correct destination for different file paths', async () => {
      // Arrange
      const differentPath = '/test/different-document.md';
      const differentAdapter = new FileRendererAdapter();

      // Act
      await differentAdapter.initialize(differentPath, formatterAdapter);
      const destination = differentAdapter.getDestination();

      // Assert
      expect(destination).toBe(differentPath);
    });
  });
});
