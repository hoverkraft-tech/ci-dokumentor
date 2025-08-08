import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { existsSync, readFileSync } from 'node:fs';
import { FileOutputAdapter } from './file-output.adapter.js';
import { MarkdownFormatterAdapter } from '../formatter/markdown-formatter.adapter.js';

describe('FileOutputAdapter', () => {
  let formatter: MarkdownFormatterAdapter;

  let adapter: FileOutputAdapter;
  const testFilePath = '/test/document.md';
  const testSectionIdentifier = 'test-section';
  const testData = Buffer.from('New section content');

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
          'First section content',
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

    formatter = new MarkdownFormatterAdapter();

    adapter = new FileOutputAdapter(testFilePath, formatter);
  });

  afterEach(() => {
    // Restore real filesystem
    mockFs.restore();
  });

  describe('constructor', () => {
    it('should create an instance with the provided file path', () => {
      const filePath = '/test/document.md';
      const instance = new FileOutputAdapter(filePath, formatter);
      expect(instance).toBeInstanceOf(FileOutputAdapter);
    });
  });

  describe('writeSection', () => {
    it('should append a new section when the file exists but has no matching section', async () => {
      // Act
      await adapter.writeSection(testSectionIdentifier, testData);

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
      const adapterWithExistingSection = new FileOutputAdapter(
        '/test/existing-section.md',
        formatter
      );

      // Act
      await adapterWithExistingSection.writeSection(
        testSectionIdentifier,
        testData
      );

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
      const emptyFileAdapter = new FileOutputAdapter(
        '/test/empty.md',
        formatter
      );

      // Act
      await emptyFileAdapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync('/test/empty.md', 'utf-8');
      const expectedContent = `<!-- ${testSectionIdentifier}:start -->\nNew section content\n<!-- ${testSectionIdentifier}:end -->`;
      expect(fileContent).toBe(expectedContent);
    });

    it('should handle multiple sections without affecting other sections', async () => {
      // Arrange
      const multipleSectionsAdapter = new FileOutputAdapter(
        '/test/multiple-sections.md',
        formatter
      );
      const newData = Buffer.from('Updated second section');

      // Act
      await multipleSectionsAdapter.writeSection('second-section', newData);

      // Assert
      const fileContent = readFileSync('/test/multiple-sections.md', 'utf-8');

      // Should preserve first section
      expect(fileContent).toContain('<!-- first-section:start -->');
      expect(fileContent).toContain('First section content');
      expect(fileContent).toContain('<!-- first-section:end -->');

      // Should update second section
      expect(fileContent).toContain('<!-- second-section:start -->');
      expect(fileContent).toContain('Updated second section');
      expect(fileContent).toContain('<!-- second-section:end -->');
      expect(fileContent).not.toContain('Second section content');

      // Should preserve other content
      expect(fileContent).toContain('Header content');
      expect(fileContent).toContain('Middle content');
      expect(fileContent).toContain('Footer content');
    });

    it('should handle sections with complex content including line breaks', async () => {
      // Arrange
      const complexData = Buffer.from(
        'Line 1\nLine 2\n\nLine 4 with spaces   \n<!-- embedded comment -->'
      );

      // Act
      await adapter.writeSection(testSectionIdentifier, complexData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(
        'Line 1\nLine 2\n\nLine 4 with spaces   \n<!-- embedded comment -->'
      );
    });

    it('should handle empty section content', async () => {
      // Arrange
      const emptyData = Buffer.from('');

      // Act
      await adapter.writeSection(testSectionIdentifier, emptyData);

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
      expect(sectionContent).toBe('');
    });

    it('should handle special characters in section identifier', async () => {
      // Arrange
      const specialIdentifier = 'test-section_with.special@chars';
      const specialData = Buffer.from('Special content');

      // Act
      await adapter.writeSection(specialIdentifier, specialData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(`<!-- ${specialIdentifier}:start -->`);
      expect(fileContent).toContain('Special content');
      expect(fileContent).toContain(`<!-- ${specialIdentifier}:end -->`);
    });

    it('should preserve file content order when adding new section', async () => {
      // Act
      await adapter.writeSection(testSectionIdentifier, testData);

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
      const newFileAdapter = new FileOutputAdapter(
        '/test/new-file.md',
        formatter
      );

      // Act & Assert - This should fail because the file doesn't exist
      await newFileAdapter.writeSection(testSectionIdentifier, testData);

      expect(existsSync('/test/new-file.md')).toBe(true);
    });
  });

  describe('section markers', () => {
    it('should generate correct start markers', async () => {
      // Act
      await adapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:start -->`);
    });

    it('should generate correct end markers', async () => {
      // Act
      await adapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toContain(`<!-- ${testSectionIdentifier}:end -->`);
    });

    it('should handle empty section identifier in markers', async () => {
      // Arrange
      const emptyIdentifier = '';

      // Act
      await adapter.writeSection(emptyIdentifier, testData);

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

      const readOnlyAdapter = new FileOutputAdapter(
        '/readonly/document.md',
        formatter
      );

      // Act & Assert
      await expect(
        readOnlyAdapter.writeSection(testSectionIdentifier, testData)
      ).rejects.toThrow();
    });

    it('should handle invalid file paths', async () => {
      // Arrange
      const invalidPathAdapter = new FileOutputAdapter(
        '/nonexistent/path/file.md',
        formatter
      );

      // Act & Assert
      await expect(
        invalidPathAdapter.writeSection(testSectionIdentifier, testData)
      ).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple consecutive writes to the same section', async () => {
      // Arrange
      const firstData = Buffer.from('First content');
      const secondData = Buffer.from('Second content');
      const thirdData = Buffer.from('Third content');

      // Act
      await adapter.writeSection(testSectionIdentifier, firstData);
      await adapter.writeSection(testSectionIdentifier, secondData);
      await adapter.writeSection(testSectionIdentifier, thirdData);

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
      await Promise.all([
        adapter.writeSection('section-1', section1Data),
        adapter.writeSection('section-2', section2Data),
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
});
