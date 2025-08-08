import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { FormatterService } from './formatter.service.js';
import { FormatterAdapter } from './formatter.adapter.js';
import { FormatterLanguage } from './formatter-language.js';

describe('FormatterService', () => {
  let formatterService: FormatterService;
  let mockFormatterAdapters: FormatterAdapter[];

  beforeEach(() => {
    // Create mock formatter adapters
    const mockMarkdownAdapter: FormatterAdapter = {
      supportsLanguage: vi.fn(
        (language: FormatterLanguage) => language === FormatterLanguage.Markdown
      ),
    } as unknown as Mocked<FormatterAdapter>;

    const mockGenericAdapter: FormatterAdapter = {
      supportsLanguage: vi.fn(
        (language: FormatterLanguage) => language !== FormatterLanguage.Markdown
      ),
    } as unknown as Mocked<FormatterAdapter>;

    mockFormatterAdapters = [mockMarkdownAdapter, mockGenericAdapter];
    formatterService = new FormatterService(mockFormatterAdapters);
  });

  describe('getFormatterAdapterForFile', () => {
    it('should return markdown adapter for .md file', () => {
      // Arrange
      const filePath = 'test.md';

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(mockFormatterAdapters[0]);
      expect(mockFormatterAdapters[0].supportsLanguage).toHaveBeenCalledWith(
        FormatterLanguage.Markdown
      );
    });

    it('should return markdown adapter for .markdown file', () => {
      // Arrange
      const filePath = 'test.markdown';

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(mockFormatterAdapters[0]);
      expect(mockFormatterAdapters[0].supportsLanguage).toHaveBeenCalledWith(
        FormatterLanguage.Markdown
      );
    });

    it('should return first matching adapter when multiple adapters support the language', () => {
      // Arrange
      const filePath = 'test.md';
      const firstAdapter = mockFormatterAdapters[0];

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(firstAdapter);
    });
    it('should throw error when no adapter supports the file language', () => {
      // Arrange
      const filePath = 'test.md';

      // Mock both adapters to not support any language
      vi.mocked(mockFormatterAdapters[0].supportsLanguage).mockReturnValue(
        false
      );
      vi.mocked(mockFormatterAdapters[1].supportsLanguage).mockReturnValue(
        false
      );

      // Act & Assert
      expect(() =>
        formatterService.getFormatterAdapterForFile(filePath)
      ).toThrow('No formatter adapter found for file: test.md');
    });

    it('should throw error for unsupported file extension', () => {
      // Arrange
      const filePath = 'test.txt';

      // Act & Assert
      expect(() =>
        formatterService.getFormatterAdapterForFile(filePath)
      ).toThrow('Unsupported language for file: test.txt');
    });

    it('should handle file path with multiple dots correctly', () => {
      // Arrange
      const filePath = 'test.config.md';

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(mockFormatterAdapters[0]);
    });

    it('should handle file path without extension', () => {
      // Arrange
      const filePath = 'README';

      // Act & Assert
      expect(() =>
        formatterService.getFormatterAdapterForFile(filePath)
      ).toThrow('Unsupported language for file: README');
    });

    it('should handle uppercase file extensions', () => {
      // Arrange
      const filePath = 'test.MD';

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(mockFormatterAdapters[0]);
      expect(mockFormatterAdapters[0].supportsLanguage).toHaveBeenCalledWith(
        FormatterLanguage.Markdown
      );
    });

    it('should handle file path with directories', () => {
      // Arrange
      const filePath = '/path/to/directory/test.md';

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(mockFormatterAdapters[0]);
    });

    it('should handle relative file paths', () => {
      // Arrange
      const filePath = './docs/README.markdown';

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(mockFormatterAdapters[0]);
    });

    it('should check adapters in order and return first match', () => {
      // Arrange
      const filePath = 'test.md';

      // Mock first adapter to not support markdown
      vi.mocked(mockFormatterAdapters[0].supportsLanguage).mockReturnValue(
        false
      );
      // Mock second adapter to support markdown
      vi.mocked(mockFormatterAdapters[1].supportsLanguage).mockReturnValue(
        true
      );

      // Act
      const result = formatterService.getFormatterAdapterForFile(filePath);

      // Assert
      expect(result).toBe(mockFormatterAdapters[1]);
      expect(mockFormatterAdapters[0].supportsLanguage).toHaveBeenCalledWith(
        FormatterLanguage.Markdown
      );
      expect(mockFormatterAdapters[1].supportsLanguage).toHaveBeenCalledWith(
        FormatterLanguage.Markdown
      );
    });
  });

  describe('constructor', () => {
    it('should initialize with empty adapters array', () => {
      // Arrange & Act
      const service = new FormatterService([]);

      // Assert
      expect(() => service.getFormatterAdapterForFile('test.md')).toThrow(
        'No formatter adapter found for file: test.md'
      );
    });

    it('should initialize with provided adapters', () => {
      // Arrange
      const adapters = [mockFormatterAdapters[0]];

      // Act
      const service = new FormatterService(adapters);

      // Assert
      expect(service.getFormatterAdapterForFile('test.md')).toBe(adapters[0]);
    });
  });
});
