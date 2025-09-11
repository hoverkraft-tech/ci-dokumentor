import { inject, injectable, multiInject, optional } from 'inversify';
import { MigrationAdapter, MIGRATION_ADAPTER_IDENTIFIER } from './migration.adapter.js';
import { FormatterService } from '../formatter/formatter.service.js';
import { FileRendererAdapter } from '../renderer/file-renderer.adapter.js';
import { DiffRendererAdapter } from '../renderer/diff-renderer.adapter.js';

/**
 * Service for migrating documentation from various tools to ci-dokumentor format
 */
@injectable()
export class MigrationService {
  private adapters: Map<string, MigrationAdapter> = new Map();

  constructor(
    @inject(FormatterService)
    private readonly formatterService: FormatterService,
    @inject(FileRendererAdapter)
    private readonly fileRendererAdapter: FileRendererAdapter,
    @inject(DiffRendererAdapter)
    private readonly diffRendererAdapter: DiffRendererAdapter,
    @multiInject(MIGRATION_ADAPTER_IDENTIFIER) @optional() adapters: MigrationAdapter[] = []
  ) {
    for (const adapter of adapters) {
      this.adapters.set(adapter.getToolName().toLowerCase(), adapter);
    }
  }

  /**
   * Get list of available migration tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get migration adapter for a specific tool
   */
  getMigrationAdapterByTool(toolName: string): MigrationAdapter | undefined {
    return this.adapters.get(toolName.toLowerCase());
  }

  /**
   * Migrate content using the specified tool adapter
   */
  migrate(toolName: string, content: string): string {
    const adapter = this.adapters.get(toolName.toLowerCase());
    if (!adapter) {
      throw new Error(`Migration adapter for tool '${toolName}' not found. Available tools: ${this.getAvailableTools().join(', ')}`);
    }

    if (!adapter.canMigrate(content)) {
      throw new Error(`Content does not contain markers compatible with ${toolName}`);
    }

    return adapter.migrate(content);
  }

  /**
   * Migrate documentation for a given tool following the same architecture as GeneratorService
   */
  async migrateDocumentationForTool({
    destination,
    toolName,
    dryRun,
  }: {
    destination: string;
    toolName: string;
    dryRun: boolean;
  }): Promise<{ destination: string; data: string | undefined; changes: number }> {
    // Get the migration adapter for the specified tool
    const migrationAdapter = this.getMigrationAdapterByTool(toolName);
    if (!migrationAdapter) {
      throw new Error(
        `Migration adapter for tool '${toolName}' not found. Available tools: ${this.getAvailableTools().join(', ')}`
      );
    }

    const formatterAdapter = this.formatterService.getFormatterAdapterForFile(destination);

    // Use provided renderer adapter or default to FileRenderer
    const rendererAdapter = dryRun ? this.diffRendererAdapter : this.fileRendererAdapter;

    // Initialize renderer for this destination
    await rendererAdapter.initialize(destination, formatterAdapter);

    // Read the current content (we need to handle this ourselves since migration is different from generation)
    const { readFileSync } = await import('fs');
    const originalContent = readFileSync(destination, 'utf-8');

    // Check if the adapter can migrate this content
    if (!migrationAdapter.canMigrate(originalContent)) {
      throw new Error(`Content does not contain markers compatible with ${toolName}`);
    }

    // Migrate the content
    const migratedContent = migrationAdapter.migrate(originalContent);

    // Calculate changes
    const originalLines = originalContent.split('\n');
    const migratedLines = migratedContent.split('\n');
    let changes = 0;
    
    for (let i = 0; i < Math.max(originalLines.length, migratedLines.length); i++) {
      const originalLine = originalLines[i] || '';
      const migratedLine = migratedLines[i] || '';
      if (originalLine !== migratedLine) {
        changes++;
      }
    }

    // Write the migrated content through the renderer
    if (changes > 0) {
      const contentBuffer = Buffer.from(migratedContent, 'utf-8');
      await rendererAdapter.writeSection('migration', contentBuffer);
    }

    const data = await rendererAdapter.finalize();

    return { destination, data, changes };
  }

  /**
   * Auto-detect which tool was used in the content and migrate
   */
  autoMigrate(content: string): { tool: string; migratedContent: string } | null {
    for (const adapter of this.adapters.values()) {
      if (adapter.canMigrate(content)) {
        return {
          tool: adapter.getToolName(),
          migratedContent: adapter.migrate(content)
        };
      }
    }
    return null;
  }
}