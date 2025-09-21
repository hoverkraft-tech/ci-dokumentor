import { inject, injectable } from 'inversify';
import { FileReaderAdapter, MigrationAdapter, MigrationService } from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

export interface MigrateDocumentationUseCaseInput {
  /**
   * Output format for the migration results (required)
   */
  outputFormat: string | undefined;

  /**
   * Migration tool to convert from (required)
   */
  tool: string | undefined;

  /**
   * Destination file containing documentation markers to migrate (required)
   */
  destination: string;

  /**
   * Dry-run mode - when true, validate inputs and show what would be migrated without writing files
   */
  dryRun: boolean;
}

export interface MigrateDocumentationUseCaseOutput {
  success: boolean;
  destination?: string;
  data?: string;
}

/**
 * Use case for migrating documentation from various tools to ci-dokumentor format
 * Following clean architecture principles
 */
@injectable()
export class MigrateDocumentationUseCase {
  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(MigrationService) private readonly migrationService: MigrationService,
    @inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter
  ) { }

  /**
   * Get list of available migration tools
   */
  getSupportedTools(): string[] {
    return this.migrationService.getSupportedTools();
  }

  async execute(
    input: MigrateDocumentationUseCaseInput
  ): Promise<MigrateDocumentationUseCaseOutput> {

    this.validateInput(input);

    this.loggerService.info(
      `${input.dryRun ? '[DRY RUN] ' : ''}Starting documentation migration...`, input.outputFormat);
    this.loggerService.info(`Target file: ${input.destination}`, input.outputFormat);

    const migrationAdapter = await this.resolveMigrationAdapter(input);
    this.loggerService.info(`Migration tool: ${migrationAdapter.getName()}`, input.outputFormat);

    // Use migration service to handle the full migration process with proper architecture
    const { destination, data } = await this.migrationService.migrateDocumentationFromTool({
      destination: input.destination,
      migrationAdapter,
      dryRun: input.dryRun,
    });

    // Output the result using the logger
    const useCaseOutput: MigrateDocumentationUseCaseOutput = {
      success: true,
      destination,
      data
    };

    this.loggerService.info('Migration completed successfully!', input.outputFormat);

    const message = input.dryRun
      ? `(Dry-run) Documentation would be migrated in: ${input.destination}`
      : `Documentation migrated in: ${input.destination}`;

    this.loggerService.info(message, input.outputFormat);

    // Output the result using the logger
    this.loggerService.result(useCaseOutput, input.outputFormat);

    return useCaseOutput;
  }

  private validateInput(input: MigrateDocumentationUseCaseInput): void {
    if (!input.destination) {
      throw new Error('Destination file is required');
    }

    // Validate that the destination exists and is a file
    if (!this.readerAdapter.resourceExists(input.destination)) {
      throw new Error(`Destination file does not exist or is not a file: ${input.destination}`);
    }

    // Validate migration tool (must be present now after potential auto-detect)
    if (input.tool) {

      const availableTools = this.migrationService.getSupportedTools();
      if (!availableTools.includes(input.tool.toLowerCase())) {
        throw new Error(
          `Invalid migration tool '${input.tool}'. Available tools: ${availableTools.join(', ')}`
        );
      }
    }
  }

  private async resolveMigrationAdapter(input: MigrateDocumentationUseCaseInput): Promise<MigrationAdapter> {
    if (input.tool) {
      const migrationAdapter = this.migrationService.getMigrationAdapterByTool(input.tool);
      if (migrationAdapter) {
        return migrationAdapter;
      }
      throw new Error(`Migration adapter not found for tool: ${input.tool}`);
    }

    const detectedMigrationAdapter = await this.migrationService.autoDetectMigrationAdapter(input.destination);
    if (detectedMigrationAdapter) {
      return detectedMigrationAdapter;
    }
    throw new Error('Migration tool could not be auto-detected. Please specify one using --tool option.');
  }
}