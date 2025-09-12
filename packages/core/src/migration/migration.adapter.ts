export const MIGRATION_ADAPTER_IDENTIFIER = Symbol('MigrationAdapter');

/**
 * Interface for migration adapters that transform existing documentation markers
 * from various tools to ci-dokumentor format
 */
export interface MigrationAdapter {
  /**
   * Get the name/identifier of the tool this adapter supports
   */
  getToolName(): string;

  /**
   * Migrate content from the tool's format to ci-dokumentor format
   * @param content The original content with the tool's markers
   * @returns The content with ci-dokumentor markers
   */
  migrate(content: string): string;

  /**
   * Check if the content contains markers from this tool
   * @param content The content to check
   * @returns True if the content contains markers from this tool
   */
  canMigrate(content: string): boolean;
}