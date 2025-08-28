import { inject, injectable, injectFromBase } from 'inversify';
import { Option } from 'commander';
import { BaseCommand } from './base-command.js';
import {
  GenerateDocumentationUseCase,
  GenerateDocumentationUseCaseInput,
} from '../usecases/generate-documentation.usecase.js';

export type GenerateCommandOptions = {
  source: string;
  output: string;
  repository?: string;
  cicd?: string;
  includeSections?: string;
  excludeSections?: string;
  format?: string; // Comma-separated list of formats: text,json,github-action
  formatDestination?: string; // Format-specific destinations: format:destination,format:destination
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
        '--include-sections <sections>',
        'Comma-separated list of sections to include'
      )
      .option(
        '--exclude-sections <sections>',
        'Comma-separated list of sections to exclude'
      )
      .option(
        '--format <formats>',
        'Comma-separated list of output formats (text,json,github-action)',
        'text'
      )
      .option(
        '--format-destination <destinations>',
        'Format-specific destinations (format:destination,format:destination). Use stdout/stderr for console output.'
      )
      .action(async (options: GenerateCommandOptions) => {
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

        // Handle section options
        if (options.includeSections || options.excludeSections) {
          generateOptions.sections = {};

          if (options.includeSections) {
            generateOptions.sections.includeSections = options.includeSections
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0);
          }

          if (options.excludeSections) {
            generateOptions.sections.excludeSections = options.excludeSections
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0);
          }
        }

        // Handle output format options
        if (options.format) {
          const formats = options.format
            .split(',')
            .map((f: string) => f.trim())
            .filter((f: string) => f.length > 0);

          const validFormats = ['text', 'json', 'github-action'];
          for (const format of formats) {
            if (!validFormats.includes(format)) {
              throw new Error(`Invalid output format '${format}'. Valid formats: ${validFormats.join(', ')}`);
            }
          }

          // Parse format destinations
          const formatDestinations: Record<string, string> = {};
          if (options.formatDestination) {
            const destinations = options.formatDestination
              .split(',')
              .map((d: string) => d.trim())
              .filter((d: string) => d.length > 0);

            for (const dest of destinations) {
              const [format, destination] = dest.split(':');
              if (format && destination) {
                formatDestinations[format.trim()] = destination.trim();
              }
            }
          }

          // Build output formats array
          generateOptions.outputFormats = formats.map(format => ({
            type: format as 'text' | 'json' | 'github-action',
            destination: formatDestinations[format]
          }));
        }

        await this.generateDocumentationUseCase.execute(generateOptions);
      })
  }
}
