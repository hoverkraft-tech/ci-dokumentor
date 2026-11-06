import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MarkdownFormatterAdapter } from "../formatter/markdown/markdown-formatter.adapter.js";
import { FileReaderAdapter } from "../reader/file-reader.adapter.js";
import type { FormatterAdapter } from "../formatter/formatter.adapter.js";
import { SectionIdentifier } from "../generator/section/section-generator.adapter.js";
import { initContainer, resetContainer } from "../container.js";
import { ReadableContent } from "../reader/readable-content.js";
import { DiffRendererAdapter } from "./diff-renderer.adapter.js";
import { FileRendererAdapter } from "./file-renderer.adapter.js";

describe("DiffRendererAdapter", () => {
  const fixedNow = 1234567890;
  let testDirectory: string;
  let testFilePath: string;

  let formatter: FormatterAdapter;
  let adapter: DiffRendererAdapter;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    testDirectory = mkdtempSync(join(tmpdir(), "ci-dokumentor-diff-"));
    vi.stubEnv("TMPDIR", testDirectory);
    testFilePath = join(testDirectory, "document.md");
    writeFileSync(testFilePath, "Original content\n");

    const container = initContainer();

    vi.spyOn(Date, "now").mockReturnValue(fixedNow);

    formatter = container.get(MarkdownFormatterAdapter);

    adapter = container.get(DiffRendererAdapter);
  });

  afterEach(() => {
    resetContainer();

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    rmSync(testDirectory, { recursive: true, force: true });
  });

  describe("writeSection", () => {
    it("should delegate writeSection to FileRendererAdapter and write to a temp file", async () => {
      // Arrange

      await adapter.initialize(testFilePath, formatter);

      // Act
      await adapter.writeSection(
        SectionIdentifier.Examples,
        new ReadableContent("New section content"),
      );

      // Assert
      const tmpPath = join(
        testDirectory,
        `${basename(testFilePath)}.${fixedNow}.tmp`,
      );
      expect(existsSync(tmpPath)).toBe(true);
      const content = readFileSync(tmpPath, "utf-8");
      expect(content).toEqual(`<!-- examples:start -->

New section content

<!-- examples:end -->
`);
    });
  });

  describe("finalize", () => {
    it("should return a unified patch between destination and temp file", async () => {
      // Arrange
      // Prepare original and temp files
      const dest = testFilePath;
      const tmpPath = join(testDirectory, `${basename(dest)}.${fixedNow}.tmp`);
      writeFileSync(dest, "original line\n");
      writeFileSync(tmpPath, "modified line\n");

      // initialize adapter so it knows destination/temp
      await adapter.initialize(dest, formatter);

      // Act
      const patch = await adapter.finalize();

      // Assert
      // unified diff should contain removed and added lines
      expect(patch).toEqual(`Index: ${dest}
===================================================================
--- ${dest}
+++ ${dest}
@@ -1,1 +1,1 @@
-original line
+modified line
`);
    });

    it("should get patch for non existing destination file", async () => {
      // Arrange
      const dest = join(testDirectory, "new-document.md");
      const tmpPath = join(testDirectory, `${basename(dest)}.${fixedNow}.tmp`);
      writeFileSync(tmpPath, "new file content\n");

      // initialize adapter so it knows destination/temp
      await adapter.initialize(dest, formatter);

      // Act
      const patch = await adapter.finalize();
      expect(typeof patch).toBe("string");

      // Assert
      // unified diff should contain only added lines since destination did not exist
      expect(patch).toEqual(`Index: ${dest}
===================================================================
--- ${dest}
+++ ${dest}
@@ -0,0 +1,1 @@
+new file content
`);
    });

    it("should throw when temp file is missing", async () => {
      // Arrange
      const dest = testFilePath;
      // initialize to set destination but do not create temp
      await adapter.initialize(dest, formatter);

      // Act & Assert
      await expect(adapter.finalize()).rejects.toMatchObject({
        code: "ENOENT",
      });
    });
  });

  describe("getDestination", () => {
    it("should return the destination path after initialization", async () => {
      // Arrange
      const testDestination = testFilePath;

      // Act
      await adapter.initialize(testDestination, formatter);
      const destination = adapter.getDestination();

      // Assert
      expect(destination).toBe(testDestination);
    });

    it("should throw error when trying to get destination before initialization", () => {
      // Arrange
      const fileRenderer = new FileRendererAdapter(new FileReaderAdapter());
      const adapter = new DiffRendererAdapter(
        fileRenderer,
        new FileReaderAdapter(),
      );

      // Act & Assert
      expect(() => adapter.getDestination()).toThrow(
        "Destination not initialized",
      );
    });
  });
});
