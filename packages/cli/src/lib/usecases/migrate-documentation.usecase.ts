import { inject, injectable } from 'inversify';
import { existsSync, statSync } from 'fs';
import { MigrationService } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

export interface MigrateDocumentationUseCaseInput {
  /**
   * Output format for the migration results (required)
   */
  outputFormat: string | undefined;

  /**
   * Migration tool to convert from (required)
   */
  tool: string;

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
  changes?: number;
}

/**
 * Use case for migrating documentation from various tools to ci-dokumentor format
 * Following clean architecture principles
 */
@injectable()
export class MigrateDocumentationUseCase {
  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(MigrationService) private readonly migrationService: MigrationService
  ) { }

  /**
   * Get list of available migration tools
   */
  getAvailableTools(): string[] {
    return this.migrationService.getAvailableTools();
  }

  async execute(
    input: MigrateDocumentationUseCaseInput
  ): Promise<MigrateDocumentationUseCaseOutput> {
    this.validateInput(input);

    this.loggerService.info(
      `${input.dryRun ? '[DRY RUN] ' : ''}Starting documentation migration...`, input.outputFormat);
    this.loggerService.info(`Migration tool: ${input.tool}`, input.outputFormat);
    this.loggerService.info(`Target file: ${input.destination}`, input.outputFormat);

    const result = await this.handleMigration(input);

    this.loggerService.info('Migration completed successfully!', input.outputFormat);

    const message = input.dryRun
      ? `(Dry-run) Documentation would be migrated in: ${input.destination}`
      : `Documentation migrated in: ${input.destination}`;

    this.loggerService.info(message, input.outputFormat);

    // Output the result using the logger
    this.loggerService.result(result, input.outputFormat);

    return result;
  }

  private validateInput(input: MigrateDocumentationUseCaseInput): void {
    if (!input.tool) {
      throw new Error('Migration tool is required');
    }

    if (!input.destination) {
      throw new Error('Destination file is required');
    }

    // Validate that the destination exists and is a file
    if (!existsSync(input.destination) || !statSync(input.destination).isFile()) {
      throw new Error(`Destination file does not exist or is not a file: ${input.destination}`);
    }

    // Validate migration tool
    const availableTools = this.migrationService.getAvailableTools();
    if (!availableTools.includes(input.tool.toLowerCase())) {
      throw new Error(
        `Invalid migration tool '${input.tool}'. Available tools: ${availableTools.join(', ')}`
      );
    }
  }

  /**
   * Handle migration of existing documentation markers
   */
  private async handleMigration(input: MigrateDocumentationUseCaseInput): Promise<MigrateDocumentationUseCaseOutput> {
    try {
      // Use migration service to handle the full migration process with proper architecture
      const { destination, changes } = await this.migrationService.migrateDocumentationForTool({
        destination: input.destination,
        toolName: input.tool,
        dryRun: input.dryRun,
      });

      if (input.dryRun && changes > 0) {
        this.loggerService.info(`Would migrate ${changes} line(s)`, input.outputFormat);
      } else if (changes > 0) {
        this.loggerService.info(`Migrated ${changes} line(s)`, input.outputFormat);
      } else {
        this.loggerService.info('No changes needed - content already in ci-dokumentor format', input.outputFormat);
      }

      return {
        success: true,
        destination,
        changes
      };
    } catch (error) {
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}