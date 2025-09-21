import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { FileReaderAdapter } from './file-reader.adapter.js';

describe('FileReaderAdapter', () => {
  let fileReaderAdapter: FileReaderAdapter;
  const testFilePath = '/test/document.md';
  const testContent = 'Test content\nLine 2\nLine 3';

  beforeEach(() => {
    fileReaderAdapter = new FileReaderAdapter();

    // Set up mock filesystem
    mockFs({
      '/test': {
        'document.md': testContent,
        'empty.md': '',
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('resourceExists', () => {
    it('should return true for existing file', async () => {
      // Act
      const result = fileReaderAdapter.resourceExists(testFilePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for existing empty file', async () => {
      // Act
      const result = fileReaderAdapter.resourceExists('/test/empty.md');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      // Act
      const result = fileReaderAdapter.resourceExists('/test/nonexistent.md');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for a directory path', async () => {
      // Act
      const result = fileReaderAdapter.resourceExists('/test');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('readResource', () => {
    it('should read file content successfully', async () => {
      // Act
      const result = await fileReaderAdapter.readResource(testFilePath);

      // Assert

      expect(result.toString()).toBe(testContent);
    });

    it('should return empty buffer for non-existent file', async () => {
      // Act
      const result = await fileReaderAdapter.readResource('/test/nonexistent.md');

      // Assert

      expect(result.length).toBe(0);
    });

    it('should handle empty files', async () => {
      // Act
      const result = await fileReaderAdapter.readResource('/test/empty.md');

      // Assert

      expect(result.length).toBe(0);
    });

    it('should handle file read errors', async () => {
      // Arrange - Create a mock fs with a directory instead of a file
      mockFs.restore();
      mockFs({
        '/test': {
          'document.md': mockFs.file({
            mode: 0o000, // No permissions
          }),
        },
      });

      // Act & Assert
      await expect(
        fileReaderAdapter.readResource('/test/document.md')
      ).rejects.toThrow(`EACCES, permission denied '/test/document.md'`);
    });
  });

  describe('containerExists', () => {
    it('should return true for existing directory', async () => {
      // Act
      const result = fileReaderAdapter.containerExists('/test');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-existent directory', async () => {
      // Act
      const result = fileReaderAdapter.containerExists('/nonexistent');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for a file path', async () => {
      // Act
      const result = fileReaderAdapter.containerExists(testFilePath);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('readContainer', () => {
    it('should list files in a directory', async () => {
      // Act
      const result = await fileReaderAdapter.readContainer('/test');

      // Assert
      expect(result).toEqual([
        '/test/document.md',
        '/test/empty.md',
      ]);
    });

    it('should return empty list for non-existent directory', async () => {
      // Act
      const result = await fileReaderAdapter.readContainer('/nonexistent');

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty list for an empty directory', async () => {
      // Arrange - Create an empty directory
      mockFs({
        '/emptydir': {},
      });

      // Act
      const result = await fileReaderAdapter.readContainer('/emptydir');

      // Assert
      expect(result).toEqual([]);
    });

    it('should ignore . and .. entries', async () => {
      // Arrange - Create a directory with . and .. entries (mock-fs does this automatically)
      mockFs({
        '/dirwithdots': {
          'file1.txt': 'content1',
          'file2.txt': 'content2',
        },
      });

      // Act
      const result = await fileReaderAdapter.readContainer('/dirwithdots');

      // Assert
      expect(result).toEqual([
        '/dirwithdots/file1.txt',
        '/dirwithdots/file2.txt',
      ]);
    });

    it('should handle directories with many files efficiently', async () => {
      // Arrange - Create a directory with many files
      const manyFiles: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        manyFiles[`file${i}.txt`] = `content of file ${i}`;
      }
      mockFs({
        '/manyfiles': manyFiles,
      });

      // Act
      const result = await fileReaderAdapter.readContainer('/manyfiles');

      // Assert
      expect(result.length).toBe(1000);
      expect(result).toContain('/manyfiles/file0.txt');
      expect(result).toContain('/manyfiles/file999.txt');
    });

    it('should handle read errors gracefully', async () => {
      // Arrange - Create a mock fs with a directory that cannot be read
      mockFs({
        '/restricted': mockFs.directory({
          mode: 0o000, // No permissions
        }),
      });
      // Act & Assert
      await expect(
        fileReaderAdapter.readContainer('/restricted')
      ).rejects.toThrow(`EACCES, permission denied '/restricted'`);
    });
  });
});