import { describe, it, expect, beforeEach, afterEach, vi, MockInstance, } from 'vitest';
import mockFs from 'mock-fs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { MarkdownFormatterAdapter } from '../formatter/markdown/markdown-formatter.adapter.js';
import { MarkdownTableGenerator } from '../formatter/markdown/markdown-table.generator.js';
import { FileRendererAdapter } from './file-renderer.adapter.js';
import { DiffRendererAdapter } from './diff-renderer.adapter.js';
import { FileReaderAdapter } from '../reader/file-reader.adapter.js';
import { FormatterAdapter } from '../formatter/formatter.adapter.js';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import { bufferToReadable } from '../reader/reader.adapter.js';

describe('DiffRendererAdapter', () => {
    const fixedNow = 1234567890;
    let dateSpy: MockInstance<typeof Date.now>;

    let formatter: FormatterAdapter;
    let fileRenderer: FileRendererAdapter;
    let fileReader: FileReaderAdapter;
    let adapter: DiffRendererAdapter;

    beforeEach(() => {
        // Provide a deterministic tmpdir and test file structure
        mockFs({
            [tmpdir()]: {},
            '/test': {
                'document.md': 'Original content\n',
            },
        });

        dateSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

        formatter = new MarkdownFormatterAdapter(new MarkdownTableGenerator());
        fileRenderer = new FileRendererAdapter();
        fileReader = new FileReaderAdapter();

        adapter = new DiffRendererAdapter(fileRenderer, fileReader);
    });

    afterEach(() => {
        dateSpy.mockRestore();
        mockFs.restore();
    });

    describe('writeSection', () => {

        it('should delegate writeSection to FileRendererAdapter and write to a temp file', async () => {
            // Arrange

            await adapter.initialize('/test/document.md', formatter);

            // Act
            await adapter.writeSection(SectionIdentifier.Examples, bufferToReadable(Buffer.from('New section content')));

            // Assert
            const tmpPath = join(tmpdir(), `${basename('/test/document.md')}.${fixedNow}.tmp`);
            expect(existsSync(tmpPath)).toBe(true);
            const content = readFileSync(tmpPath, 'utf-8');
            expect(content).toEqual(`<!-- examples:start -->

New section content

<!-- examples:end -->
`);
        });
    });

    describe('finalize', () => {
        it('should return a unified patch between destination and temp file', async () => {
            // Arrange
            // Prepare original and temp files
            const dest = '/test/document.md';
            const tmpPath = join(tmpdir(), `${basename(dest)}.${fixedNow}.tmp`);
            writeFileSync(dest, 'original line\n');
            writeFileSync(tmpPath, 'modified line\n');

            // initialize adapter so it knows destination/temp
            await adapter.initialize(dest, formatter);

            // Act
            const patch = await adapter.finalize();

            // Assert
            // unified diff should contain removed and added lines
            expect(patch).toEqual(`Index: /test/document.md
===================================================================
--- /test/document.md
+++ /test/document.md
@@ -1,1 +1,1 @@
-original line
+modified line
`);
        });

        it('should get patch for non existing destination file', async () => {
            // Arrange
            const dest = '/test/new-document.md';
            const tmpPath = join(tmpdir(), `${basename(dest)}.${fixedNow}.tmp`);
            writeFileSync(tmpPath, 'new file content\n');

            // initialize adapter so it knows destination/temp
            await adapter.initialize(dest, formatter);

            // Act
            const patch = await adapter.finalize();
            expect(typeof patch).toBe('string');

            // Assert
            // unified diff should contain only added lines since destination did not exist
            expect(patch).toEqual(`Index: /test/new-document.md
===================================================================
--- /test/new-document.md
+++ /test/new-document.md
@@ -0,0 +1,1 @@
+new file content
`);
        });

        it('should throw when temp file is missing', async () => {
            // Arrange
            const dest = '/test/document.md';
            // initialize to set destination but do not create temp
            await adapter.initialize(dest, formatter);

            // Act & Assert
            await expect(adapter.finalize()).rejects.toThrow("ENOENT, no such file or directory '/tmp/document.md");
        });
    });

    describe('getDestination', () => {
        it('should return the destination path after initialization', async () => {
            // Arrange
            const testDestination = '/test/document.md';

            // Act
            await adapter.initialize(testDestination, formatter);
            const destination = adapter.getDestination();

            // Assert
            expect(destination).toBe(testDestination);
        });

        it('should throw error when trying to get destination before initialization', () => {
            // Arrange
            const fileRenderer = new FileRendererAdapter();
            const fileReader = new FileReaderAdapter();
            const adapter = new DiffRendererAdapter(fileRenderer, fileReader);

            // Act & Assert
            expect(() => adapter.getDestination()).toThrow('Destination not initialized');
        });
    });
});
