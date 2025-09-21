export const MIGRATION_ADAPTER_IDENTIFIER = Symbol('MigrationAdapter');

import type { RendererAdapter } from '../renderer/renderer.adapter.js';

export type MigrateDocumentationPayload = {
  destination: string;
  rendererAdapter: RendererAdapter;
};

/**
 * Interface for migration adapters that transform existing documentation markers
 * from various tools to ci-dokumentor format
 */
export interface MigrationAdapter {
  /**
   * Get the name/identifier of the tool this adapter supports
   */
  getName(): string;

  /**
   * Check whether this adapter can handle the given destination/file.
   * Adapters may inspect the destination path, its contents, or both.
   */
  supportsDestination(destination: string): Promise<boolean>;

  /**
   * Perform the migration for the provided destination and write using the
   * provided renderer adapter. Implementations MUST use the renderer to
   * persist output (via writeSection) and return when
   * finished.
   */
  migrateDocumentation(payload: MigrateDocumentationPayload): Promise<void>;
}