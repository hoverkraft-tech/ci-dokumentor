import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileReaderAdapter } from "./file-reader.adapter.js";

describe("FileReaderAdapter", () => {
  let fileReaderAdapter: FileReaderAdapter;
  let testDirectory: string;
  let testFilePath: string;
  const testContent = "Test content\nLine 2\nLine 3";

  beforeEach(() => {
    fileReaderAdapter = new FileReaderAdapter();

    testDirectory = mkdtempSync(join(tmpdir(), "ci-dokumentor-reader-"));
    mkdirSync(join(testDirectory, "test"));
    testFilePath = join(testDirectory, "test/document.md");
    writeFileSync(testFilePath, testContent);
    writeFileSync(join(testDirectory, "test/empty.md"), "");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(testDirectory, { recursive: true, force: true });
  });

  describe("resourceExists", () => {
    it("should return true for existing file", async () => {
      // Act
      const result = fileReaderAdapter.resourceExists(testFilePath);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for existing empty file", async () => {
      // Act
      const result = fileReaderAdapter.resourceExists(
        join(testDirectory, "test/empty.md"),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      // Act
      const result = fileReaderAdapter.resourceExists(
        join(testDirectory, "test/nonexistent.md"),
      );

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for a directory path", async () => {
      // Act
      const result = fileReaderAdapter.resourceExists(
        join(testDirectory, "test"),
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("readResource", () => {
    it("should read file content successfully", async () => {
      // Act
      const result = await fileReaderAdapter.readResource(testFilePath);

      // Assert
      expect(result.toString()).toBe(testContent);
    });

    it("should return empty buffer for non-existent file", async () => {
      // Act
      const result = await fileReaderAdapter.readResource(
        join(testDirectory, "test/nonexistent.md"),
      );

      // Assert
      expect(result.getSize()).toBe(0);
    });

    it("should handle empty files", async () => {
      // Act
      const result = await fileReaderAdapter.readResource(
        join(testDirectory, "test/empty.md"),
      );

      // Assert
      expect(result.getSize()).toBe(0);
    });

    it("should handle file read errors", async () => {
      // Simulate a file disappearing between the existence check and opening it.
      vi.spyOn(fileReaderAdapter, "resourceExists").mockImplementation(() => {
        unlinkSync(testFilePath);
        return true;
      });

      await expect(
        fileReaderAdapter.readResource(testFilePath),
      ).rejects.toMatchObject({
        code: "ENOENT",
      });
    });
  });

  describe("containerExists", () => {
    it("should return true for existing directory", async () => {
      // Act
      const result = fileReaderAdapter.containerExists(
        join(testDirectory, "test"),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for non-existent directory", async () => {
      // Act
      const result = fileReaderAdapter.containerExists(
        join(testDirectory, "nonexistent"),
      );

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for a file path", async () => {
      // Act
      const result = fileReaderAdapter.containerExists(testFilePath);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("readContainer", () => {
    it("should list files in a directory", async () => {
      // Act
      const result = await fileReaderAdapter.readContainer(
        join(testDirectory, "test"),
      );

      // Assert
      expect(result).toEqual([
        join(testDirectory, "test/document.md"),
        join(testDirectory, "test/empty.md"),
      ]);
    });

    it("should return empty list for non-existent directory", async () => {
      // Act
      const result = await fileReaderAdapter.readContainer(
        join(testDirectory, "nonexistent"),
      );

      // Assert
      expect(result).toEqual([]);
    });

    it("should return empty list for an empty directory", async () => {
      // Arrange - Create an empty directory
      mkdirSync(join(testDirectory, "emptydir"));

      // Act
      const result = await fileReaderAdapter.readContainer(
        join(testDirectory, "emptydir"),
      );

      // Assert
      expect(result).toEqual([]);
    });

    it("should ignore . and .. entries", async () => {
      mkdirSync(join(testDirectory, "dirwithdots"));
      writeFileSync(join(testDirectory, "dirwithdots/file1.txt"), "content1");
      writeFileSync(join(testDirectory, "dirwithdots/file2.txt"), "content2");

      // Act
      const result = await fileReaderAdapter.readContainer(
        join(testDirectory, "dirwithdots"),
      );

      // Assert
      expect(result).toEqual([
        join(testDirectory, "dirwithdots/file1.txt"),
        join(testDirectory, "dirwithdots/file2.txt"),
      ]);
    });

    it("should handle directories with many files efficiently", async () => {
      // Arrange - Create a directory with many files
      mkdirSync(join(testDirectory, "manyfiles"));
      for (let i = 0; i < 1000; i++) {
        writeFileSync(
          join(testDirectory, "manyfiles", `file${i}.txt`),
          `content of file ${i}`,
        );
      }

      // Act
      const result = await fileReaderAdapter.readContainer(
        join(testDirectory, "manyfiles"),
      );

      // Assert
      expect(result.length).toBe(1000);
      expect(result).toContain(join(testDirectory, "manyfiles/file0.txt"));
      expect(result).toContain(join(testDirectory, "manyfiles/file999.txt"));
    });

    it("should handle read errors gracefully", async () => {
      // Simulate a directory being replaced by a file after the existence check.
      const directoryPath = join(testDirectory, "restricted");
      mkdirSync(directoryPath);
      vi.spyOn(fileReaderAdapter, "containerExists").mockImplementation(() => {
        rmSync(directoryPath, { recursive: true });
        writeFileSync(directoryPath, "no longer a directory");
        return true;
      });

      await expect(
        fileReaderAdapter.readContainer(directoryPath),
      ).rejects.toMatchObject({
        code: "ENOTDIR",
      });
    });
  });
});
