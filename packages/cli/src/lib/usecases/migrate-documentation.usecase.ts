import { inject, injectable } from 'inversify';
import { FileReaderAdapter, MigrationAdapter, MigrationService, ConcurrencyService } from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

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

export interface MigrateDocumentationUseCaseOutput {
  success: boolean;
  destination?: string;
  data?: string;
  /** Results for each file when processing multiple files */
  results?: Array<{
    destination: string;
    success: boolean;
    error?: string;
  }>;
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
    @inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter,
    @inject(ConcurrencyService) private readonly concurrencyService: ConcurrencyService
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
    // Resolve destination files from patterns
    const destinationFiles = await this.resolveDestinationFiles(input.destination);
    
    if (destinationFiles.length === 0) {
      throw new Error('No destination files found matching the provided pattern(s)');
    }

    // Single file processing (original behavior)
    if (destinationFiles.length === 1) {
      return this.executeSingleFile({
        ...input,
        destination: destinationFiles[0]
      });
    }

    // Multiple file processing
    return this.executeMultipleFiles(input, destinationFiles);
  }

  /**
   * Resolve destination files from patterns using ReaderAdapter
   */
  private async resolveDestinationFiles(destination: string | string[]): Promise<string[]> {
    const destinations = Array.isArray(destination) ? destination : [destination];
    const resolvedFiles = new Set<string>();

    for (const pattern of destinations) {
      const files = await this.readerAdapter.findResources(pattern);
      files.forEach(file => resolvedFiles.add(file));
    }

    return Array.from(resolvedFiles).sort();
  }

  /**
   * Execute documentation migration for a single file
   */
  private async executeSingleFile(
    input: MigrateDocumentationUseCaseInput & { destination: string }
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

  /**
   * Execute documentation migration for multiple files concurrently
   */
  private async executeMultipleFiles(
    input: MigrateDocumentationUseCaseInput,
    destinationFiles: string[]
  ): Promise<MigrateDocumentationUseCaseOutput> {
    const concurrency = input.concurrency ?? 5;

    this.loggerService.info(
      `${input.dryRun ? '[DRY RUN] ' : ''}Starting documentation migration for ${destinationFiles.length} files...`,
      input.outputFormat
    );

    // Create tasks for each file
    const tasks = destinationFiles.map(destination => async () => {
      const fileInput = { ...input, destination };
      return this.executeSingleFile(fileInput);
    });

    // Execute with concurrency control
    const results = await this.concurrencyService.executeWithLimit(tasks, concurrency);

    // Collect results
    const fileResults = results.map((result, index) => {
      const destination = destinationFiles[index];
      if (result.status === 'fulfilled') {
        return {
          destination,
          success: true,
        };
      } else {
        return {
          destination,
          success: false,
          error: result.reason?.message || String(result.reason),
        };
      }
    });

    // Check for failures
    const failures = fileResults.filter(r => !r.success);
    
    if (failures.length > 0) {
      const errorMessages = failures.map(f => `  - ${f.destination}: ${f.error}`).join('\n');
      throw new Error(`Failed to process ${failures.length} of ${destinationFiles.length} files:\n${errorMessages}`);
    }

    this.loggerService.info(
      `Successfully processed ${destinationFiles.length} files!`,
      input.outputFormat
    );

    return {
      success: true,
      results: fileResults,
    };
  }

  private validateInput(input: MigrateDocumentationUseCaseInput & { destination: string }): void {
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

  private async resolveMigrationAdapter(input: MigrateDocumentationUseCaseInput & { destination: string }): Promise<MigrationAdapter> {
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