import { existsSync, readFileSync } from 'node:fs';
import mockFs, { file, restore } from 'mock-fs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MarkdownFormatterAdapter } from '../formatter/markdown/markdown-formatter.adapter.js';
import { FileReaderAdapter } from '../reader/file-reader.adapter.js';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import { initContainer, resetContainer } from '../container.js';
import { ReadableContent } from '../reader/readable-content.js';
import { FileRendererAdapter } from './file-renderer.adapter.js';

describe('FileRendererAdapter', () => {
  const testFilePath = '/test/document.md';
  const testSectionIdentifier = SectionIdentifier.Examples;
  const testData = new ReadableContent('New section content\n');

  let formatterAdapter: MarkdownFormatterAdapter;

  let fileRendererAdapter: FileRendererAdapter;

  beforeEach(() => {
    vi.resetAllMocks();

    // Set up mock filesystem
    mockFs({
      '/test': {
        'document.md': 'Initial content\nSome text\n',
        'existing-section.md': `Content before section
<!-- examples:start -->
Old section content
<!-- examples:end -->
Content after section
`,
        'multiple-sections.md': `Header content
<!-- usage:start -->
Second section content
<!-- usage:end -->
Middle content
<!-- examples:start -->

First section content

<!-- examples:end -->
<!-- security:start -->
<!-- security:end -->
<!-- license:start -->
License content
<!-- license:end -->
`,
        'empty.md': '',
      },
      '/unsupported': {
        'document.txt': 'Text file content',
        'no-extension': 'File without extension',
      },
    });

    const container = initContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);

    fileRendererAdapter = container.get(FileRendererAdapter);
  });

  afterEach(() => {
    resetContainer();

    // Restore real filesystem
    restore();

    vi.resetAllMocks();
  });

  describe('writeSection', () => {
    it('should append a new section when the file exists but has no matching section', async () => {
      // Act
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await fileRendererAdapter.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toEqual(`Initial content
Some text
<!-- examples:start -->

New section content

<!-- examples:end -->
`);
    });

    it('should replace existing section content when section already exists', async () => {
      // Arrange
      const adapterWithExistingSection = new FileRendererAdapter(new FileReaderAdapter());

      // Act
      await adapterWithExistingSection.initialize('/test/existing-section.md', formatterAdapter);
      await adapterWithExistingSection.writeSection(testSectionIdentifier, testData);

      // Assert
      const fileContent = readFileSync('/test/existing-section.md', 'utf-8');
      expect(fileContent).toEqual(`Content before section
<!-- examples:start -->

New section content

<!-- examples:end -->
Content after section
`);
    });

    it('should handle empty files correctly', async () => {
      // Arrange
      const emptyFileAdapter = new FileRendererAdapter(new FileReaderAdapter());

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
      const multipleSectionsAdapter = new FileRendererAdapter(new FileReaderAdapter());
      const newUsageContent = new ReadableContent('Updated usage section\n');
      const newLicenseContent = new ReadableContent('Updated license section\n');

      // Act
      await multipleSectionsAdapter.initialize('/test/multiple-sections.md', formatterAdapter);
      await multipleSectionsAdapter.writeSection(SectionIdentifier.Usage, newUsageContent);
      await multipleSectionsAdapter.writeSection(SectionIdentifier.Security, ReadableContent.empty()); // Empty content for security section
      await multipleSectionsAdapter.writeSection(SectionIdentifier.License, newLicenseContent);

      // Assert
      const fileContent = readFileSync('/test/multiple-sections.md', 'utf-8');

      // Should preserve first section with blank lines around content
      expect(fileContent).toEqual(`Header content
<!-- usage:start -->

Updated usage section

<!-- usage:end -->
Middle content
<!-- examples:start -->

First section content

<!-- examples:end -->
<!-- security:start -->
<!-- security:end -->
<!-- license:start -->

Updated license section

<!-- license:end -->
`);
    });

    it('should handle sections with complex content including line breaks', async () => {
      // Arrange
      const complexData = new ReadableContent(
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
      const emptyData = ReadableContent.empty();

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
      const newFileAdapter = new FileRendererAdapter(new FileReaderAdapter());

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
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Arrange - Create a read-only file system
      mockFs({
        '/readonly': {
          'document.md': file({
            content: 'Initial content',
            mode: 0o444, // Read-only
          }),
        },
      });

      const readOnlyAdapter = new FileRendererAdapter(new FileReaderAdapter());

      // Act & Assert
      await readOnlyAdapter.initialize(testFilePath, formatterAdapter);
      await expect(
        readOnlyAdapter.writeSection(testSectionIdentifier, testData)
      ).rejects.toThrow('test');
    });

    it('should handle invalid file paths', async () => {
      // Arrange
      const invalidPathAdapter = new FileRendererAdapter(new FileReaderAdapter());

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
      const firstData = new ReadableContent('First content');
      const secondData = new ReadableContent('Second content');
      const thirdData = new ReadableContent('Third content');

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
      const section1Data = new ReadableContent('Section 1 content');
      const section2Data = new ReadableContent('Section 2 content');

      // Act - Simulate concurrent writes to different sections
      await fileRendererAdapter.initialize(testFilePath, formatterAdapter);
      await Promise.all([
        fileRendererAdapter.writeSection(SectionIdentifier.Examples, section1Data),
        fileRendererAdapter.writeSection(SectionIdentifier.Usage, section2Data),
      ]);

      // Assert
      const fileContent = readFileSync(testFilePath, 'utf-8');
      expect(fileContent).toEqual(`Initial content
Some text
<!-- examples:start -->

Section 1 content

<!-- examples:end -->
<!-- usage:start -->

Section 2 content

<!-- usage:end -->
`);
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
      const differentAdapter = new FileRendererAdapter(new FileReaderAdapter());

      // Act
      await differentAdapter.initialize(differentPath, formatterAdapter);
      const destination = differentAdapter.getDestination();

      // Assert
      expect(destination).toBe(differentPath);
    });
  });
});
