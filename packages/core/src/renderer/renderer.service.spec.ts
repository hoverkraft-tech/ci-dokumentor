import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import mockFs from 'mock-fs';
import { RendererService } from './renderer.service.js';
import { ReaderAdapter } from '../reader/reader.adapter.js';
import { Readable } from 'node:stream';

describe('RendererService', () => {
  let service: RendererService;
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  beforeEach(() => {
    mockReaderAdapter = {
      getContent: vi.fn(),
    } as Mocked<ReaderAdapter>;
    
    service = new RendererService(mockReaderAdapter);
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('readExistingContent', () => {
    it('should return buffer from reader adapter for existing file', async () => {
      // Arrange
      const testContent = 'Test content';
      const mockStream = new Readable();
      mockStream.push(testContent);
      mockStream.push(null);
      
      mockFs({
        '/test/file.txt': testContent,
      });
      
      mockReaderAdapter.getContent.mockResolvedValue(mockStream);

      // Act
      const result = await service.readExistingContent('/test/file.txt');

      // Assert
      expect(mockReaderAdapter.getContent).toHaveBeenCalledWith('/test/file.txt');
      expect(result.toString()).toBe(testContent);
    });

    it('should return empty buffer for non-existent file', async () => {
      // Arrange
      mockFs({});

      // Act
      const result = await service.readExistingContent('/test/nonexistent.txt');

      // Assert
      expect(mockReaderAdapter.getContent).not.toHaveBeenCalled();
      expect(result.length).toBe(0);
    });

    it('should handle empty existing file', async () => {
      // Arrange
      const mockStream = new Readable();
      mockStream.push(null); // Empty stream
      
      mockFs({
        '/test/empty.txt': '',
      });
      
      mockReaderAdapter.getContent.mockResolvedValue(mockStream);

      // Act
      const result = await service.readExistingContent('/test/empty.txt');

      // Assert
      expect(mockReaderAdapter.getContent).toHaveBeenCalledWith('/test/empty.txt');
      expect(result.length).toBe(0);
    });
  });
});