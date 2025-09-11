import { inject, injectable, injectFromBase } from 'inversify';
import { Command } from 'commander';
import { BaseCommand } from './base-command.js';
import {
  MigrateDocumentationUseCase,
  MigrateDocumentationUseCaseInput,
} from '../usecases/migrate-documentation.usecase.js';
import { MigrationService } from '@ci-dokumentor/core';

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
    const availableTools = this.migrationService.getAvailableTools();

    return this.name('migrate')
      .description('Migrate existing documentation markers from various tools to ci-dokumentor format')
      .requiredOption(
        '-t, --tool <tool>',
        `Migration tool to convert from (${availableTools.join(', ')})`
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
      .hook('preAction', async (thisCommand) => {
        thisCommand.allowExcessArguments(false);
        thisCommand.allowUnknownOption(false);
        const parsed = thisCommand.parseOptions(thisCommand.args);

        (thisCommand as Command & { _parseOptionsEnv: () => void })._parseOptionsEnv();
        (thisCommand as Command & { _parseOptionsImplied: () => void })._parseOptionsImplied();

        if (parsed.unknown.length > 0) {
          (thisCommand as Command & { unknownOption: (arg: string) => void }).unknownOption(parsed.unknown[0]);
        }
      })
      .action(async (options: MigrateCommandOptions) => {
        const input: MigrateDocumentationUseCaseInput = this.mapMigrateCommandOptions(options);
        await this.migrateDocumentationUseCase.execute(input);
      })
      .allowUnknownOption(false)
      .allowExcessArguments(false)
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