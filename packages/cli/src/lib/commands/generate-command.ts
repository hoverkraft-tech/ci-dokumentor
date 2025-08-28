import { inject, injectable, injectFromBase } from 'inversify';
import { Command, Option } from 'commander';
import { BaseCommand } from './base-command.js';
import {
  GenerateDocumentationUseCase,
  GenerateDocumentationUseCaseInput,
} from '../usecases/generate-documentation.usecase.js';
import { RepositoryOptions } from '@ci-dokumentor/core';

export type GenerateCommandOptions = {
  source: string;
  output: string;
  repository?: string;
  cicd?: string;
  includeSections?: string;
  excludeSections?: string;
  [key: string]: unknown; // Allow dynamic keys for provider-specific options
};

/**
 * Generate command implementation that extends Commander Command
 * Self-configures and calls the GenerateDocumentationUseCase
 */
@injectable()
@injectFromBase({
  extendConstructorArguments: true,
})
export class GenerateCommand extends BaseCommand {
  constructor(
    @inject(GenerateDocumentationUseCase)
    private readonly generateDocumentationUseCase: GenerateDocumentationUseCase
  ) {
    super();
  }

  /**
   * Configure the command with name, description, options, and action
   */
  configure(): this {
    // Get supported platforms from the use case
    const supportedRepositoryPlatforms =
      this.generateDocumentationUseCase.getSupportedRepositoryPlatforms();
    const supportedCicdPlatforms =
      this.generateDocumentationUseCase.getSupportedCicdPlatforms();

    return this.name('generate')
      .alias('gen')
      .description('Generate documentation from CI/CD configuration files')
      .requiredOption(
        '-s, --source <file>',
        'Source manifest file path to handle'
      )
      .option(
        '-o, --output <dir>',
        'Output path for generated documentation (auto-detected if not specified)',
      )
      .addOption(
        new Option(
          '-r, --repository <platform>',
          'Repository platform (auto-detected if not specified)'
        ).choices(supportedRepositoryPlatforms)
      )
      .addOption(
        new Option('-c, --cicd <platform>', 'CI/CD platform (auto-detected if not specified)').choices(
          supportedCicdPlatforms
        )
      )
      .option(
        '-i, --include-sections <sections>',
        'Comma-separated list of sections to include'
      )
      .option(
        '-e, --exclude-sections <sections>',
        'Comma-separated list of sections to exclude'
      )
      .hook('preAction', async (thisCommand) => {
        await this.populateSupportedOptions(thisCommand);

        thisCommand.allowExcessArguments(false);
        thisCommand.allowUnknownOption(false);
        const parsed = thisCommand.parseOptions(thisCommand.args);

        (thisCommand as Command & { _parseOptionsEnv: () => void })._parseOptionsEnv();
        (thisCommand as Command & { _parseOptionsImplied: () => void })._parseOptionsImplied();

        if (parsed.unknown.length > 0) {
          (thisCommand as Command & { unknownOption: (arg: string) => void }).unknownOption(parsed.unknown[0]);
        }
      })
      .action(async (options: GenerateCommandOptions) => {
        const input: GenerateDocumentationUseCaseInput = this.mapGenerateCommandOptions(options);

        await this.mapSupportedOptions(input, options);

        // Handle section options
        this.mapSectionOptions(input, options);

        await this.generateDocumentationUseCase.execute(input);
      })
      .allowUnknownOption(true)
      .allowExcessArguments(true)
      .helpCommand(true);
  }

  private async populateSupportedOptions(thisCommand: Command) {
    const repositorySupportedOptions = await this.generateDocumentationUseCase.getRepositorySupportedOptions(
      thisCommand.opts().repository
    );

    for (const optionKey of Object.keys(repositorySupportedOptions)) {
      const optionDescription = repositorySupportedOptions[optionKey];
      if (!thisCommand.options.find((o) => o.flags === optionDescription.flags)) {
        const option =
          new Option(optionDescription.flags, optionDescription.description || '');
        if (optionDescription.env) {
          option.env(optionDescription.env)
        }
        thisCommand.addOption(option);
      }
    }

    const supportedSections = await this.generateDocumentationUseCase.getSupportedSections({
      cicdPlatform: thisCommand.opts().cicd,
      source: thisCommand.opts().source,
    });

    if (supportedSections) {
      thisCommand.options.find((o) => o.flags === '--include-sections')?.choices(supportedSections);
      thisCommand.options.find((o) => o.flags === '--exclude-sections')?.choices(supportedSections);
    }
  }

  private mapGenerateCommandOptions(options: GenerateCommandOptions): GenerateDocumentationUseCaseInput {
    const generateOptions: GenerateDocumentationUseCaseInput = {
      source: options.source,
      output: options.output,
    };

    // Handle repository platform options
    if (options.repository) {
      generateOptions.repository = {
        platform: options.repository,
      };
    }

    // Handle CI/CD platform options
    if (options.cicd) {
      generateOptions.cicd = {
        platform: options.cicd,
      };
    }

    return generateOptions;
  }

  private async mapSupportedOptions(
    input: GenerateDocumentationUseCaseInput,
    options: GenerateCommandOptions
  ): Promise<void> {
    const repositorySupportedOptions = await this.generateDocumentationUseCase.getRepositorySupportedOptions(
      options.repository,
    );

    const repositoryOptions: RepositoryOptions = {};
    for (const optionKey of Object.keys(repositorySupportedOptions)) {
      const option = repositorySupportedOptions[optionKey];

      const longFlag = option.flags.split(/[ ,|]+/).find((f) => f.startsWith('--')) || option.flags;
      const key = this.sanitizeFlagName(longFlag);
      const targetKey = key.split('-').map((part, idx) => idx === 0 ? part : part[0].toUpperCase() + part.slice(1)).join('');

      const value = options[targetKey as keyof GenerateCommandOptions] ?? undefined;
      if (value !== undefined) {
        repositoryOptions[optionKey] = value;
      }
    }

    if (Object.keys(repositoryOptions).length > 0) {
      input.repository = input.repository ?? {}
      input.repository.options = {
        ...input.repository.options,
        ...repositoryOptions
      }
    }
  }

  /**
   * Helper to safely sanitize CLI flag names, removing any lingering -- or <...> or [...] patterns.
   */
  private sanitizeFlagName(flag: string): string {
    flag = flag.replace(/^--/, '').trim();
    let prev;
    do {
      prev = flag;
      flag = flag.replace(/<.*?>|\[.*?\]/g, '');
    } while (flag !== prev);
    return flag;
  }

  private mapSectionOptions(input: GenerateDocumentationUseCaseInput, options: GenerateCommandOptions) {
    if (options.includeSections || options.excludeSections) {
      input.sections = input.sections || {};

      if (options.includeSections) {
        input.sections.includeSections = options.includeSections
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }

      if (options.excludeSections) {
        input.sections.excludeSections = options.excludeSections
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }
    }
  }
}
