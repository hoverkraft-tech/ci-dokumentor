import { inject, injectable, injectFromBase } from 'inversify';
import { Command, Option } from 'commander';
import { BaseCommand } from './base-command.js';
import {
  GenerateDocumentationUseCase,
  GenerateDocumentationUseCaseInput,
} from '../usecases/generate-documentation.usecase.js';
import { GenerateSectionsOptions, RepositoryOptions, SectionOptions } from '@ci-dokumentor/core';

export type GenerateCommandOptions = {
  outputFormat: string;
  source: string;
  destination?: string;
  repository?: string;
  cicd?: string;
  includeSections?: string;
  excludeSections?: string;
  dryRun: boolean;
  [key: string]: unknown; // Allow dynamic keys for provider-specific options and section options
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
    private readonly generateDocumentationUseCase: GenerateDocumentationUseCase,
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
      .description('Generate documentation from CI/CD manifest files')
      .requiredOption(
        '-s, --source <file>',
        'Source manifest file path to handle'
      )
      .option(
        '-d, --destination <file>',
        'Destination file path for generated documentation (auto-detected if not specified)',
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
      .option(
        '--dry-run',
        'Preview what would be generated without writing files',
        false
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

        await this.generateDocumentationUseCase.execute(input);
      })
      .allowUnknownOption(true)
      .allowExcessArguments(true)
      .helpCommand(true);
  }

  private async populateSupportedOptions(thisCommand: Command) {
    // Add repository-specific options
    const repositorySupportedOptions = await this.generateDocumentationUseCase.getRepositorySupportedOptions(
      thisCommand.getOptionValue('repository')
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

    // Add section-specific options
    const sectionSupportedOptions = await this.generateDocumentationUseCase.getSectionSupportedOptions({
      cicdPlatform: thisCommand.getOptionValue('cicd'),
      source: thisCommand.getOptionValue('source'),
    });

    for (const [_sectionId, sectionOptions] of Object.entries(sectionSupportedOptions)) {
      for (const [_optionKey, optionDescription] of Object.entries(sectionOptions)) {
        if (!thisCommand.options.find((o) => o.flags === optionDescription.flags)) {
          const option = new Option(optionDescription.flags, optionDescription.description || '');
          if (optionDescription.env) {
            option.env(optionDescription.env);
          }
          thisCommand.addOption(option);
        }
      }
    }

    const supportedSections = await this.generateDocumentationUseCase.getSupportedSections({
      cicdPlatform: thisCommand.getOptionValue('cicd'),
      source: thisCommand.getOptionValue('source'),
    });

    if (supportedSections) {
      thisCommand.options.find((o) => o.flags === '--include-sections')?.choices(supportedSections);
      thisCommand.options.find((o) => o.flags === '--exclude-sections')?.choices(supportedSections);
    }
  }

  private mapGenerateCommandOptions(options: GenerateCommandOptions): GenerateDocumentationUseCaseInput {
    const generateOptions: GenerateDocumentationUseCaseInput = {
      source: options.source,
      destination: options.destination,
      outputFormat: this.getOutputFormatOption(this),
      dryRun: options.dryRun,
      sections: this.getSectionsOptions(options),
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

  private getSectionsOptions(options: GenerateCommandOptions): GenerateSectionsOptions {
    const sectionsOptions: GenerateSectionsOptions = {};

    // Handle standard section options (include/exclude sections)
    if (options.includeSections || options.excludeSections) {

      if (options.includeSections) {
        sectionsOptions.includeSections = options.includeSections
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }

      if (options.excludeSections) {
        sectionsOptions.excludeSections = options.excludeSections
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }
    }

    // Handle section-specific options
    const sectionSupportedOptions = this.generateDocumentationUseCase.getSectionSupportedOptions({
      cicdPlatform: options.cicd,
      source: options.source,
    });

    const sectionConfig: Record<string, SectionOptions> = {};

    for (const [sectionId, sectionOptions] of Object.entries(sectionSupportedOptions)) {
      const sectionSpecificOptions: SectionOptions = {};

      for (const [optionKey, optionDescriptor] of Object.entries(sectionOptions)) {
        const longFlag = optionDescriptor.flags.split(/[ ,|]+/).find((f) => f.startsWith('--')) || optionDescriptor.flags;
        const key = this.sanitizeFlagName(longFlag);
        const targetKey = key.split('-').map((part, idx) => idx === 0 ? part : part[0].toUpperCase() + part.slice(1)).join('');

        const value = options[targetKey as keyof GenerateCommandOptions] ?? undefined;
        if (value !== undefined) {
          sectionSpecificOptions[optionKey] = value;
        }
      }

      if (Object.keys(sectionSpecificOptions).length > 0) {
        sectionConfig[sectionId] = sectionSpecificOptions;
      }
    }

    if (Object.keys(sectionConfig).length > 0) {
      sectionsOptions.sectionConfig = {
        ...sectionsOptions.sectionConfig,
        ...sectionConfig
      };
    }

    return sectionsOptions;
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

}
