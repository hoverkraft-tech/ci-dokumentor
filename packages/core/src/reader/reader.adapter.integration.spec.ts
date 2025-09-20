import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { FileReaderAdapter } from './file-reader.adapter.js';
import { FileRendererAdapter } from '../renderer/file-renderer.adapter.js';
import { RendererService } from '../renderer/renderer.service.js';
import { MarkdownFormatterAdapter } from '../formatter/markdown/markdown-formatter.adapter.js';
import { MarkdownTableGenerator } from '../formatter/markdown/markdown-table.generator.js';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import { readableToBuffer } from './reader.adapter.js';

describe('ReaderAdapter Integration', () => {
  let readerAdapter: FileReaderAdapter;
  let rendererService: RendererService;
  let rendererAdapter: FileRendererAdapter;
  let formatterAdapter: MarkdownFormatterAdapter;

  beforeEach(() => {
    readerAdapter = new FileReaderAdapter();
    rendererService = new RendererService(readerAdapter);
    rendererAdapter = new FileRendererAdapter();
    formatterAdapter = new MarkdownFormatterAdapter(new MarkdownTableGenerator());
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('end-to-end content reading and writing flow', () => {
    it('should read existing content using ReaderAdapter and write new content using RendererAdapter', async () => {
      // Arrange
      const existingContent = '# Existing Content\n\nThis is existing content.\n';
      const newSectionContent = 'This is new section content.';
      
      mockFs({
        '/test/document.md': existingContent,
      });

      // Act: Read existing content using new ReaderAdapter pattern
      const readStream = await readerAdapter.getContent('/test/document.md');
      const readBuffer = await readableToBuffer(readStream);
      
      // Verify reading works
      expect(readBuffer.toString()).toBe(existingContent);

      // Act: Use RendererService to read content (the new way migrations work)
      const serviceBuffer = await rendererService.readExistingContent('/test/document.md');
      expect(serviceBuffer.toString()).toBe(existingContent);

      // Act: Write new content using RendererAdapter (existing pattern)
      await rendererAdapter.initialize('/test/document.md', formatterAdapter);
      const formattedSection = formatterAdapter.section(SectionIdentifier.Overview, Buffer.from(newSectionContent));
      await rendererAdapter.writeSection(SectionIdentifier.Overview, formattedSection);
      await rendererAdapter.finalize();

      // Assert: Verify the new content was written
      const finalStream = await readerAdapter.getContent('/test/document.md');
      const finalBuffer = await readableToBuffer(finalStream);
      const finalContent = finalBuffer.toString();
      
      expect(finalContent).toContain('<!-- overview:start -->');
      expect(finalContent).toContain(newSectionContent);
      expect(finalContent).toContain('<!-- overview:end -->');
    });

    it('should handle non-existent files gracefully', async () => {
      // Arrange
      mockFs({});

      // Act & Assert: RendererService should return empty buffer for non-existent files
      const buffer = await rendererService.readExistingContent('/test/nonexistent.md');
      expect(buffer.length).toBe(0);

      // Act & Assert: ReaderAdapter should let the stream handle the error
      const stream = await readerAdapter.getContent('/test/nonexistent.md');
      await expect(readableToBuffer(stream)).rejects.toThrow();
    });

    it('should maintain consistency between old Buffer-based processing and new stream-based reading', async () => {
      // Arrange
      const testContent = '# Test Document\n\nSome content here.\n';
      mockFs({
        '/test/document.md': testContent,
      });

      // Act: Read using new ReaderAdapter pattern
      const streamContent = await readerAdapter.getContent('/test/document.md');
      const streamBuffer = await readableToBuffer(streamContent);

      // Act: Read using RendererService (bridge pattern)
      const serviceBuffer = await rendererService.readExistingContent('/test/document.md');

      // Assert: Both methods should return identical content
      expect(streamBuffer.toString()).toBe(testContent);
      expect(serviceBuffer.toString()).toBe(testContent);
      expect(streamBuffer.equals(serviceBuffer)).toBe(true);
    });
  });
});