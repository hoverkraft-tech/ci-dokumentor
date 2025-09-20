import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { FileReaderAdapter } from './file-reader.adapter.js';
import { FileRendererAdapter } from '../renderer/file-renderer.adapter.js';
import { MarkdownFormatterAdapter } from '../formatter/markdown/markdown-formatter.adapter.js';
import { MarkdownTableGenerator } from '../formatter/markdown/markdown-table.generator.js';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import { readableToBuffer, readableToString, bufferToReadable } from './reader.adapter.js';

describe('ReaderAdapter Integration', () => {
  let readerAdapter: FileReaderAdapter;
  let rendererAdapter: FileRendererAdapter;
  let formatterAdapter: MarkdownFormatterAdapter;

  beforeEach(() => {
    readerAdapter = new FileReaderAdapter();
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

      // Act: Write new content using RendererAdapter (existing pattern)
      await rendererAdapter.initialize('/test/document.md', formatterAdapter);
      const formattedSection = formatterAdapter.section(SectionIdentifier.Overview, Buffer.from(newSectionContent));
      await rendererAdapter.writeSection(SectionIdentifier.Overview, bufferToReadable(formattedSection));
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

      // Act & Assert: ReaderAdapter should let the stream handle the error
      const stream = await readerAdapter.getContent('/test/nonexistent.md');
      await expect(readableToBuffer(stream)).rejects.toThrow();
    });

    it('should read content consistently using ReaderAdapter', async () => {
      // Arrange
      const testContent = '# Test Document\n\nSome content here.\n';
      mockFs({
        '/test/document.md': testContent,
      });

      // Act: Read using ReaderAdapter pattern
      const streamContent = await readerAdapter.getContent('/test/document.md');
      const streamBuffer = await readableToBuffer(streamContent);

      // Assert: Content should match what was written
      expect(streamBuffer.toString()).toBe(testContent);
    });

    it('should convert stream directly to string efficiently', async () => {
      // Arrange
      const testContent = '# Test Document\n\nSome content here.\n';
      mockFs({
        '/test/document.md': testContent,
      });

      // Act: Read using readableToString for direct string conversion
      const stream1 = await readerAdapter.getContent('/test/document.md');
      const directString = await readableToString(stream1, 'utf-8');

      // Act: Read using readableToBuffer then convert to string
      const stream2 = await readerAdapter.getContent('/test/document.md');
      const bufferThenString = (await readableToBuffer(stream2)).toString('utf-8');

      // Assert: Both methods should return identical content
      expect(directString).toBe(testContent);
      expect(bufferThenString).toBe(testContent);
      expect(directString).toBe(bufferThenString);
    });
  });
});