import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MarkdownFormatterAdapter,
  FileRendererAdapter,
} from "@ci-dokumentor/core";
import { describe, beforeEach, afterEach, it, expect } from "vitest";
import { initTestContainer } from "../container.js";
import { AutoDocMigrationAdapter } from "./auto-doc-migration.adapter.js";

describe("AutoDocMigrationAdapter", () => {
  let adapter: AutoDocMigrationAdapter;
  let formatterAdapter: MarkdownFormatterAdapter;
  let rendererAdapter: FileRendererAdapter;

  let testDirectory: string;

  beforeEach(() => {
    testDirectory = mkdtempSync(join(tmpdir(), "ci-dokumentor-migration-"));
    vi.resetAllMocks();

    // Use real dependencies from the container for e2e testing
    const container = initTestContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);
    adapter = container.get(AutoDocMigrationAdapter);
  });

  afterEach(() => {
    rmSync(testDirectory, { recursive: true, force: true });

    vi.resetAllMocks();
  });

  describe("getName", () => {
    it("returns the adapter name", () => {
      // Act
      const name = adapter.getName();
      // Assert
      expect(name).toBe("auto-doc");
    });
  });

  describe("supportsDestination", () => {
    it("detects headers in files", async () => {
      // Arrange
      const tmpPath = join(testDirectory, "autodoc-support.md");
      writeFileSync(tmpPath, "## Inputs");
      // Act
      const supported = await adapter.supportsDestination(tmpPath);
      // Assert
      expect(supported).toBe(true);
    });

    it("returns false for missing files", async () => {
      // Act
      const supported = await adapter.supportsDestination(
        join(testDirectory, "missing.md"),
      );
      // Assert
      return expect(supported).toBe(false);
    });
  });

  describe("migrateDocumentation", () => {
    it("wraps markdown headers with ci-dokumentor markers (e2e test)", async () => {
      // Arrange: create a file with markdown headers that should be wrapped
      const source = `## Description

Some description here

## Inputs

| Name   | Description |
|--------|-------------|
| input1 | First input |

## Outputs

| Name    | Description  |
|---------|--------------|
| output1 | First output |

## Secrets

- SECRET_X
`;

      const tmpPath = join(testDirectory, "autodoc-e2e.md");

      writeFileSync(tmpPath, source);

      // Initialize real renderer with real formatter
      await rendererAdapter.initialize(tmpPath, formatterAdapter);

      // Act: perform migration using real dependencies
      await adapter.migrateDocumentation({
        destination: tmpPath,
        rendererAdapter: rendererAdapter,
      });

      // Finalize renderer
      await rendererAdapter.finalize();

      // Assert: read the actual file content and verify headers are wrapped with markers
      const actualContent = readFileSync(tmpPath, "utf-8");
      const expectedContent = `<!-- overview:start -->

## Description

Some description here

<!-- overview:end -->
<!-- inputs:start -->

## Inputs

| Name   | Description |
|--------|-------------|
| input1 | First input |

<!-- inputs:end -->
<!-- outputs:start -->

## Outputs

| Name    | Description  |
|---------|--------------|
| output1 | First output |

<!-- outputs:end -->
<!-- secrets:start -->

## Secrets

- SECRET_X

<!-- secrets:end -->

<!-- header:start -->
<!-- header:end -->

<!-- badges:start -->
<!-- badges:end -->

<!-- usage:start -->
<!-- usage:end -->

<!-- examples:start -->
<!-- examples:end -->

<!-- contributing:start -->
<!-- contributing:end -->

<!-- security:start -->
<!-- security:end -->

<!-- license:start -->
<!-- license:end -->

<!-- generated:start -->
<!-- generated:end -->
`;

      expect(actualContent).toEqual(expectedContent);
    });
  });
});
