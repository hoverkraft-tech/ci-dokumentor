import { inject, injectable, injectFromBase } from 'inversify';
import { Command } from 'commander';
import fg from 'fast-glob';
import pLimit from 'p-limit';
import { MigrationService } from '@ci-dokumentor/core';
import {
  MigrateDocumentationUseCase,
  MigrateDocumentationUseCaseInput,
} from '../usecases/migrate-documentation.usecase.js';
import { BaseCommand } from './base-command.js';

export type MigrateCommandOptions = {
  outputFormat: string;
  tool: string;
  destination: string | string[];
  dryRun: boolean;
  concurrency?: number;
  [key: string]: unknown;
};

/**
 * Migrate command implementation that extends Commander Command
 * Self-configures and calls the MigrateDocumentationUseCase
 */
@injectable()
@injectFromBase({
  extendConstructorArguments: true,
})
export class MigrateCommand extends BaseCommand {
  constructor(
    @inject(MigrateDocumentationUseCase)
    private readonly migrateDocumentationUseCase: MigrateDocumentationUseCase,
    @inject(MigrationService)
    private readonly migrationService: MigrationService,
  ) {
    super();
  }

  /**
   * Configure the command with name, description, options, and action
   */
  configure(): this {
    // Get available migration tools
    const availableTools = this.migrationService.getSupportedTools();

    return this.name('migrate')
      .description('Migrate existing documentation markers from various tools to ci-dokumentor format')
      .option(
        '-t, --tool <tool>',
        `Migration tool to convert from (${availableTools.join(', ')})`,
      )
      .requiredOption(
        '-d, --destination <file...>',
        'Destination file(s) containing documentation markers to migrate. Supports glob patterns and multiple files.'
      )
      .option(
        '--dry-run',
        'Preview what would be migrated without writing files',
        false
      )
      .option(
        '--concurrency [number]',
        'Maximum number of files to process concurrently',
        '5'
      )
      .action(async (options: MigrateCommandOptions) => {
        await this.processMultipleFiles(options);
      })
      .helpCommand(true);
  }

  /**
   * Process multiple files concurrently with error handling
   */
  private async processMultipleFiles(options: MigrateCommandOptions): Promise<void> {
    // Resolve destination files (handle globs and arrays)
    const destinationFiles = await this.resolveDestinationFiles(options.destination);

    if (destinationFiles.length === 0) {
      throw new Error('No destination files found matching the provided pattern(s)');
    }

    // Parse concurrency option
    const concurrency = parseInt(String(options.concurrency || '5'), 10);
    if (isNaN(concurrency) || concurrency < 1) {
      throw new Error('--concurrency must be a positive integer');
    }

    // Create a limit for concurrent operations
    const limit = pLimit(concurrency);

    // Process all files with concurrency control
    const tasks = destinationFiles.map(destination =>
      limit(async () => {
        const fileOptions = { ...options, destination };
        const input: MigrateDocumentationUseCaseInput = this.mapMigrateCommandOptions(fileOptions);
        return this.migrateDocumentationUseCase.execute(input);
      })
    );

    // Execute all tasks and collect results
    const results = await Promise.allSettled(tasks);

    // Check for failures
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0) {
      const errorMessages = failures.map((f) => {
        const failedFile = destinationFiles[results.indexOf(f)];
        return `  - ${failedFile}: ${f.reason?.message || f.reason}`;
      }).join('\n');
      
      throw new Error(`Failed to process ${failures.length} of ${destinationFiles.length} files:\n${errorMessages}`);
    }
  }

  /**
   * Resolve destination files from patterns and arrays
   */
  private async resolveDestinationFiles(destination: string | string[]): Promise<string[]> {
    const destinations = Array.isArray(destination) ? destination : [destination];
    const resolvedFiles = new Set<string>();

    for (const pattern of destinations) {
      // Check if pattern contains glob characters
      if (pattern.includes('*') || pattern.includes('?') || pattern.includes('[')) {
        // Use fast-glob to resolve pattern
        const files = await fg(pattern, { 
          onlyFiles: true,
          absolute: false,
        });
        files.forEach(file => resolvedFiles.add(file));
      } else {
        // Direct file path
        resolvedFiles.add(pattern);
      }
    }

    return Array.from(resolvedFiles).sort();
  }

  private mapMigrateCommandOptions(options: MigrateCommandOptions): MigrateDocumentationUseCaseInput {
    // Ensure destination is a string at this point (called per-file in processMultipleFiles)
    const destination = Array.isArray(options.destination) ? options.destination[0] : options.destination;
    
    return {
      tool: options.tool,
      destination,
      outputFormat: this.getOutputFormatOption(this),
      dryRun: options.dryRun,
    };
  }

  private getOutputFormatOption(command: Command): string | undefined {
    const format = command.opts().outputFormat;
    if (format !== undefined) {
      return format;
    }

    if (command.parent) {
      return this.getOutputFormatOption(command.parent);
    }
    return undefined;
  }
}