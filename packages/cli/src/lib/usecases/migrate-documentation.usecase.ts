import { inject, injectable } from 'inversify';
import { FileReaderAdapter, MigrationAdapter, MigrationService, ConcurrencyService } from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';
import { AbstractMultiFileUseCase, FileResult, MultiFileUseCaseOutput } from './abstract-multi-file.usecase.js';

export interface MigrateDocumentationUseCaseInput {
  /**
   * Output format for the migration results (required)
   */
  outputFormat: string | undefined;

  /**
   * Migration tool to convert from (optional, can be auto-detected)
   */
  tool: string | undefined;

  /**
   * Destination file(s) or pattern(s) containing documentation markers to migrate (required)
   * Can be:
   * - A single file path: `README.md`
   * - Multiple file paths: `['file1.md', 'file2.md']`
   * - A glob pattern: `**\/README.md`
   */
  destination: string | string[];

  /**
   * Dry-run mode - when true, validate inputs and show what would be migrated without writing files
   */
  dryRun: boolean;

  /**
   * Maximum number of files to process concurrently (optional)
   * Default: 5
   */
  concurrency?: number;
}

type MigrateDocumentationUseCaseOutput = MultiFileUseCaseOutput;

/**
 * Use case for migrating documentation from various tools to ci-dokumentor format
 * Following clean architecture principles
 */
@injectable()
export class MigrateDocumentationUseCase extends AbstractMultiFileUseCase {
  constructor(
    @inject(LoggerService) loggerService: LoggerService,
    @inject(MigrationService) private readonly migrationService: MigrationService,
    @inject(FileReaderAdapter) readerAdapter: ReaderAdapter,
    @inject(ConcurrencyService) concurrencyService: ConcurrencyService
  ) {
    super(loggerService, readerAdapter, concurrencyService);
  }

  /**
   * Get list of available migration tools
   */
  getSupportedTools(): string[] {
    return this.migrationService.getSupportedTools();
  }

  async execute(
    input: MigrateDocumentationUseCaseInput
  ): Promise<MigrateDocumentationUseCaseOutput> {
    // Resolve destination files from patterns
    const resolvedFiles = await this.resolveFiles(input.destination);

    if (resolvedFiles.length === 0) {
      throw new Error('No destination files found matching the provided pattern(s)');
    }

    const executionContext = this.initializeExecutionContext(
      'documentation migration',
      input,
      resolvedFiles
    );

    return this.processFilesConcurrently(
      input,
      executionContext
    );
  }

  protected async processFile(
    input: MigrateDocumentationUseCaseInput & { file: string }
  ): Promise<FileResult> {
    this.validateInput(input);
    this.logExecutionStart(input);

    const migrationAdapter = await this.resolveMigrationAdapter(input);
    this.loggerService.info(`Migration tool: ${migrationAdapter.getName()}`, input.outputFormat);

    const { destination, data } = await this.migrationService.migrateDocumentationFromTool({
      destination: input.file,
      migrationAdapter,
      dryRun: input.dryRun,
    });

    this.logExecutionSuccess({ ...input, destination });

    return {
      success: true,
      destination,
      data,
    }
  }

  /**
   * Log execution start information
   */
  private logExecutionStart(input: MigrateDocumentationUseCaseInput & { file: string }): void {
    const prefix = input.dryRun ? '[DRY RUN] ' : '';
    this.loggerService.info(`${prefix}Starting documentation migration...`, input.outputFormat);
    this.loggerService.info(`Target file: ${input.file}`, input.outputFormat);
  }

  /**
   * Log successful execution completion
   */
  private logExecutionSuccess(input: MigrateDocumentationUseCaseInput & { destination: string }): void {
    this.loggerService.info('Migration completed successfully!', input.outputFormat);

    const message = input.dryRun
      ? `(Dry-run) Documentation would be migrated in: ${input.destination}`
      : `Documentation migrated in: ${input.destination}`;

    this.loggerService.info(message, input.outputFormat);
  }

  private validateInput(input: MigrateDocumentationUseCaseInput & { file: string }): void {
    if (!input.file) {
      throw new Error('Destination file is required');
    }

    // Validate that the destination exists and is a file
    if (!this.readerAdapter.resourceExists(input.file)) {
      throw new Error(`Destination file does not exist or is not a file: ${input.file}`);
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

  private async resolveMigrationAdapter(input: MigrateDocumentationUseCaseInput & { file: string }): Promise<MigrationAdapter> {
    if (input.tool) {
      const migrationAdapter = this.migrationService.getMigrationAdapterByTool(input.tool);
      if (migrationAdapter) {
        return migrationAdapter;
      }
      throw new Error(`Migration adapter not found for tool: ${input.tool}`);
    }

    const detectedMigrationAdapter = await this.migrationService.autoDetectMigrationAdapter(input.file);
    if (detectedMigrationAdapter) {
      return detectedMigrationAdapter;
    }
    throw new Error('Migration tool could not be auto-detected. Please specify one using --tool option.');
  }

}