import { inject, injectable, injectFromBase } from 'inversify';
import { Command } from 'commander';
import { MigrationService } from '@ci-dokumentor/core';
import {
  MigrateDocumentationUseCase,
  MigrateDocumentationUseCaseInput,
} from '../usecases/migrate-documentation.usecase.js';
import { BaseCommand } from './base-command.js';

export type MigrateCommandOptions = {
  outputFormat: string;
  tool: string;
  destination: string;
  dryRun: boolean;
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
        '-d, --destination <file>',
        'Destination file containing documentation markers to migrate'
      )
      .option(
        '--dry-run',
        'Preview what would be migrated without writing files',
        false
      )
      .action(async (options: MigrateCommandOptions) => {
        const input: MigrateDocumentationUseCaseInput = this.mapMigrateCommandOptions(options);
        await this.migrateDocumentationUseCase.execute(input);
      })
      .helpCommand(true);
  }

  private mapMigrateCommandOptions(options: MigrateCommandOptions): MigrateDocumentationUseCaseInput {
    return {
      tool: options.tool,
      destination: options.destination,
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