import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { FileReaderAdapter } from './file-reader.adapter.js';
import { readableToBuffer } from './reader.adapter.js';

describe('FileReaderAdapter', () => {
  let adapter: FileReaderAdapter;

  beforeEach(() => {
    adapter = new FileReaderAdapter();
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('getContent', () => {
    it('should return a readable stream for an existing file', async () => {
      // Arrange
      const testContent = 'Hello, World!';
      mockFs({
        '/test/file.txt': testContent,
      });

      // Act
      const stream = await adapter.getContent('/test/file.txt');
      const buffer = await readableToBuffer(stream);

      // Assert
      expect(buffer.toString()).toBe(testContent);
    });

    it('should handle empty files', async () => {
      // Arrange
      mockFs({
        '/test/empty.txt': '',
      });

      // Act
      const stream = await adapter.getContent('/test/empty.txt');
      const buffer = await readableToBuffer(stream);

      // Assert
      expect(buffer.length).toBe(0);
    });

    it('should handle non-existent files by throwing error', async () => {
      // Arrange
      mockFs({});

      // Act & Assert
      const stream = await adapter.getContent('/test/nonexistent.txt');
      await expect(readableToBuffer(stream)).rejects.toThrow();
    });
  });
});