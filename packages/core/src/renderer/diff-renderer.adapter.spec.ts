import { describe, it, expect, beforeEach, afterEach, vi, MockInstance, } from 'vitest';
import mockFs from 'mock-fs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { MarkdownFormatterAdapter } from '../formatter/markdown-formatter.adapter.js';
import { FileRendererAdapter } from './file-renderer.adapter.js';
import { DiffRendererAdapter } from './diff-renderer.adapter.js';

describe('DiffRendererAdapter', () => {
    const fixedNow = 1234567890;
    let dateSpy: MockInstance<typeof Date.now>;

    beforeEach(() => {
        // Provide a deterministic tmpdir and test file structure
        mockFs({
            [tmpdir()]: {},
            '/test': {
                'document.md': 'Original content\n',
            },
        });

        dateSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
    });

    afterEach(() => {
        dateSpy.mockRestore();
        mockFs.restore();
    });

    describe('writeSection', () => {

        it('should delegate writeSection to FileRendererAdapter and write to a temp file', async () => {
            // Arrange
            const formatter = new MarkdownFormatterAdapter();
            const fileRenderer = new FileRendererAdapter();
            const adapter = new DiffRendererAdapter(fileRenderer);

            await adapter.initialize('/test/document.md', formatter);

            // Act
            await adapter.writeSection('my-section', Buffer.from('New section content'));

            // Assert
            const tmpPath = join(tmpdir(), `${basename('/test/document.md')}.${fixedNow}.tmp`);
            expect(existsSync(tmpPath)).toBe(true);
            const content = readFileSync(tmpPath, 'utf-8');
            expect(content).toContain('New section content');
            expect(content).toContain(`<!-- my-section:start -->`);
            expect(content).toContain(`<!-- my-section:end -->`);
        });
    });

    describe('finalize', () => {
        it('should return a unified patch between destination and temp file', async () => {
            // Arrange
            const fileRenderer = new FileRendererAdapter();
            const adapter = new DiffRendererAdapter(fileRenderer);

            // Prepare original and temp files
            const dest = '/test/document.md';
            const tmpPath = join(tmpdir(), `${basename(dest)}.${fixedNow}.tmp`);
            writeFileSync(dest, 'original line\n');
            writeFileSync(tmpPath, 'modified line\n');

            // initialize adapter so it knows destination/temp
            await adapter.initialize(dest, new MarkdownFormatterAdapter());

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
            const fileRenderer = new FileRendererAdapter();
            const adapter = new DiffRendererAdapter(fileRenderer);

            const dest = '/test/new-document.md';
            const tmpPath = join(tmpdir(), `${basename(dest)}.${fixedNow}.tmp`);
            writeFileSync(tmpPath, 'new file content\n');

            // initialize adapter so it knows destination/temp
            await adapter.initialize(dest, new MarkdownFormatterAdapter());

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
            const fileRenderer = new FileRendererAdapter();
            const adapter = new DiffRendererAdapter(fileRenderer);

            const dest = '/test/document.md';
            // initialize to set destination but do not create temp
            await adapter.initialize(dest, new MarkdownFormatterAdapter());

            // Act & Assert
            await expect(adapter.finalize()).rejects.toThrow("ENOENT, no such file or directory '/tmp/document.md");
        });
    });

    describe('getDestination', () => {
        it('should return the destination path after initialization', async () => {
            // Arrange
            const fileRenderer = new FileRendererAdapter();
            const adapter = new DiffRendererAdapter(fileRenderer);
            const testDestination = '/test/document.md';

            // Act
            await adapter.initialize(testDestination, new MarkdownFormatterAdapter());
            const destination = adapter.getDestination();

            // Assert
            expect(destination).toBe(testDestination);
        });

        it('should throw error when trying to get destination before initialization', () => {
            // Arrange
            const fileRenderer = new FileRendererAdapter();
            const adapter = new DiffRendererAdapter(fileRenderer);

            // Act & Assert
            expect(() => adapter.getDestination()).toThrow('Destination not initialized');
        });
    });
});
