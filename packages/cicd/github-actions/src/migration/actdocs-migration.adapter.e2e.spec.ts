import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MarkdownFormatterAdapter,
  FileRendererAdapter,
} from "@ci-dokumentor/core";
import { describe, beforeEach, afterEach, it, expect } from "vitest";
import { initTestContainer } from "../container.js";
import { ActdocsMigrationAdapter } from "./actdocs-migration.adapter.js";

describe("ActdocsMigrationAdapter", () => {
  let formatterAdapter: MarkdownFormatterAdapter;
  let rendererAdapter: FileRendererAdapter;
  let adapter: ActdocsMigrationAdapter;

  let testDirectory: string;

  beforeEach(() => {
    testDirectory = mkdtempSync(join(tmpdir(), "ci-dokumentor-migration-"));
    // Use real dependencies from the container for e2e testing
    const container = initTestContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);
    adapter = container.get(ActdocsMigrationAdapter);
  });

  afterEach(() => {
    rmSync(testDirectory, { recursive: true, force: true });
  });

  describe("getName", () => {
    it("returns the adapter name", () => {
      // Arrange
      // Act
      const name = adapter.getName();
      // Assert
      expect(name).toBe("actdocs");
    });
  });

  describe("supportsDestination", () => {
    it("returns true when a file contains actdocs markers", async () => {
      // Arrange
      const tmpPath = join(testDirectory, "actdocs-support.md");
      writeFileSync(
        tmpPath,
        "<!-- actdocs inputs start -->\nInput\n<!-- actdocs inputs end -->",
      );
      // Act
      const supported = await adapter.supportsDestination(tmpPath);
      // Assert
      expect(supported).toBe(true);
    });

    it("returns false for missing files", async () => {
      // Arrange
      // Act
      const supported = await adapter.supportsDestination(
        join(testDirectory, "missing.md"),
      );
      // Assert
      expect(supported).toBe(false);
    });
  });

  describe("migrateDocumentation", () => {
    it("migrates actdocs markers to ci-dokumentor format (e2e test)", async () => {
      // Arrange: create a file with actdocs markers
      const source = `<!-- actdocs description start -->
Description here
<!-- actdocs description end -->
<!-- actdocs inputs start -->
Input details here
<!-- actdocs inputs end -->
<!-- actdocs secrets start -->
Secret stuff
<!-- actdocs secrets end -->
<!-- actdocs outputs start -->
Output stuff
<!-- actdocs outputs end -->
<!-- actdocs permissions start -->
Perm stuff
<!-- actdocs permissions end -->
`;

      const tmpPath = join(testDirectory, "actdocs-e2e.md");

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

      // Assert: read the actual file content and verify complete migration
      const actualContent = readFileSync(tmpPath, "utf-8");
      const expectedContent = `<!-- overview:start -->

Description here

<!-- overview:end -->

<!-- inputs:start -->

Input details here

<!-- inputs:end -->

<!-- secrets:start -->

Secret stuff

<!-- secrets:end -->

<!-- outputs:start -->

Output stuff

<!-- outputs:end -->

<!-- security:start -->

Perm stuff

<!-- security:end -->


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

<!-- license:start -->
<!-- license:end -->

<!-- generated:start -->
<!-- generated:end -->
`;

      expect(actualContent).toEqual(expectedContent);
    });

    it("handles files with no actdocs markers (e2e test)", async () => {
      // Arrange: create a file with no actdocs markers
      const source = "No markers here";
      const tmpPath = join(testDirectory, "actdocs-no-markers.md");

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

      // Assert: read the actual file content and verify it remains unchanged
      const actualContent = readFileSync(tmpPath, "utf-8");
      expect(actualContent).toEqual(`No markers here

<!-- header:start -->
<!-- header:end -->

<!-- badges:start -->
<!-- badges:end -->

<!-- overview:start -->
<!-- overview:end -->

<!-- usage:start -->
<!-- usage:end -->

<!-- inputs:start -->
<!-- inputs:end -->

<!-- secrets:start -->
<!-- secrets:end -->

<!-- outputs:start -->
<!-- outputs:end -->

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
`);
    });
  });
});
