import { inject, injectable, multiInject, optional } from 'inversify';
import { FormatterService } from '../formatter/formatter.service.js';
import { RENDERER_FACTORY_IDENTIFIER } from '../renderer/renderer.factory.js';
import type { RendererFactory } from '../renderer/renderer.factory.js';
import { MigrationAdapter, MIGRATION_ADAPTER_IDENTIFIER } from './migration.adapter.js';

/**
 * Service for migrating documentation from various tools to ci-dokumentor format
 */
@injectable()
export class MigrationService {
  private adapters: Map<string, MigrationAdapter> = new Map();

  constructor(
    @inject(FormatterService)
    private readonly formatterService: FormatterService,
    @inject(RENDERER_FACTORY_IDENTIFIER)
    private readonly rendererFactory: RendererFactory,
    @multiInject(MIGRATION_ADAPTER_IDENTIFIER) @optional() adapters: MigrationAdapter[] = []
  ) {
    for (const adapter of adapters) {
      this.adapters.set(adapter.getName().toLowerCase(), adapter);
    }
  }

  /**
   * Get list of supported migration tools
   */
  getSupportedTools(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get migration adapter for a specific tool
   */
  getMigrationAdapterByTool(toolName: string): MigrationAdapter | undefined {
    return this.adapters.get(toolName.toLowerCase());
  }

  /**
   * Auto-detect CI/CD platform for a given source
   */
  async autoDetectMigrationAdapter(destination: string): Promise<MigrationAdapter | undefined> {
    for (const adapter of this.adapters.values()) {
      if (await adapter.supportsDestination(destination)) {
        return adapter;
      }
    }
    return undefined;
  }

  /**
   * Migrate documentation for a given tool following the same architecture as GeneratorService
   */
  async migrateDocumentationFromTool({
    destination,
    migrationAdapter,
    dryRun,
  }: {
    destination: string;
    migrationAdapter: MigrationAdapter;
    dryRun: boolean;
  }): Promise<{ destination: string; data: string | undefined }> {
    const formatterAdapter = this.formatterService.getFormatterAdapterForFile(destination);

    // Use provided renderer adapter or default to FileRenderer
    const rendererAdapter = this.rendererFactory(dryRun);

    // Initialize renderer for this destination
    await rendererAdapter.initialize(destination, formatterAdapter);

    // Let the adapter perform migration and write through the renderer
    await migrationAdapter.migrateDocumentation({ destination, rendererAdapter });

    // Finalize renderer to obtain diff (for dry-run) or complete writes
    const data = await rendererAdapter.finalize();

    return { destination, data };
  }
}