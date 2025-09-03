import { inject, injectable } from 'inversify';
import { existsSync, statSync } from 'fs';
import {
  GeneratorAdapter,
  GeneratorService,
  OptionDescriptor,
  RepositoryOptions,
  RepositoryProvider,
  RepositoryService
} from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

export interface GenerateDocumentationUseCaseInput {
  /**
   * Output format for the generated documentation (required)
   */
  outputFormat: string | undefined;

  /**
   * Source manifest file path for the CI/CD platform to handle (required)
   * This should point to a CI/CD manifest file such as `action.yml` or a
   * workflow file like `.github/workflows/ci.yml`.
   */
  source: string;

  /**
   * Destination path for generated documentation (optional)
   * If not provided, the generator adapter will auto-detect the destination path
   */
  destination?: string;

  /**
   * Repository platform options
   */
  repository?: {
    /**
     * The repository platform to use
     * If not specified, auto-detected from the repository
     */
    platform?: string;

    /**
     * Provider-specific option values.
     */
    options?: RepositoryOptions;
  };

  /**
   * CI/CD platform options
   */
  cicd?: {
    /**
     * The CI/CD platform to use
     * If not specified, auto-detected from available manifest files
     */
    platform?: string;
  };

  /**
   * Section generator options
   */
  sections?: {
    /**
     * List of section identifiers to include in generation
     * If not specified, all available sections are included
     */
    includeSections?: string[];

    /**
     * List of section identifiers to exclude from generation
     */
    excludeSections?: string[];

    /**
     * Section-specific configuration options
     */
    sectionConfig?: Record<string, Record<string, unknown>>;
  };

  /**
   * Dry-run mode - when true, validate inputs and show what would be generated without writing files
   */
  dryRun?: boolean;
}

export interface GenerateDocumentationUseCaseOutput {
  success: boolean;
  message: string;
  destination?: string;
}

/**
 * Use case for generating documentation from CI/CD manifest files
 * Following clean architecture principles
 */
@injectable()
export class GenerateDocumentationUseCase {
  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(GeneratorService)
    private readonly generatorService: GeneratorService,
    @inject(RepositoryService)
    private readonly repositoryService: RepositoryService
  ) { }


  /**
   * Get list of supported repository platforms based on registered providers
   */
  getSupportedRepositoryPlatforms(): string[] {
    return this.repositoryService.getSupportedRepositoryPlatforms();
  }

  /**
   * Get list of supported CI/CD platforms based on registered generator adapters
   */
  getSupportedCicdPlatforms(): string[] {
    return this.generatorService.getSupportedCicdPlatforms();
  }

  /**
   * Detect some extra options for current context and return any CLI options it exposes
   */
  async getRepositorySupportedOptions(repositoryPlatform?: string): Promise<
    Record<string, OptionDescriptor>
  > {
    const options: Record<string, OptionDescriptor> = {};

    let repositoryProvider: RepositoryProvider | undefined;
    if (repositoryPlatform) {
      repositoryProvider = this.repositoryService.getRepositoryProviderByPlatform(repositoryPlatform);
    } else {
      repositoryProvider = await this.repositoryService.autoDetectRepositoryProvider();
    }

    if (repositoryProvider) {
      const repositoryProviderOptions = repositoryProvider.getOptions();
      // Ensure option unicity. Prefer canonical `key` when provided by the
      // provider; fall back to `flags` otherwise.      
      const seenByKey = new Set<string>();
      for (const optionKey of Object.keys(repositoryProviderOptions)) {
        const option = repositoryProviderOptions[optionKey];
        if (seenByKey.has(option.flags)) {
          throw new Error(`Duplicate option flags found: ${option.flags} - Repository provider: ${repositoryProvider.getPlatformName()}`);
        }
        seenByKey.add(option.flags);

        options[optionKey] = option;
      }
    }

    return options;
  }

  /**
   * Get supported sections for a current context
   */
  getSupportedSections({
    cicdPlatform,
    source
  }: {
    cicdPlatform?: string;
    source?: string;
  }): string[] | undefined {
    let generatorAdapter: GeneratorAdapter | undefined;
    if (cicdPlatform) {
      generatorAdapter = this.generatorService.getGeneratorAdapterByPlatform(cicdPlatform);
    } else if (source) {
      generatorAdapter = this.generatorService.autoDetectCicdAdapter(source);
    }

    if (generatorAdapter) {
      return generatorAdapter.getSupportedSections();
    }

    return undefined;
  }

  async execute(
    input: GenerateDocumentationUseCaseInput
  ): Promise<GenerateDocumentationUseCaseOutput> {
    this.validateInput(input);

    if (input.dryRun) {
      this.loggerService.info('DRY-RUN MODE: Previewing documentation generation...', input.outputFormat);
    } else {
      this.loggerService.info('Starting documentation generation...', input.outputFormat);
    }

    this.loggerService.info(`Source manifest: ${input.source}`, input.outputFormat);
    if (input.destination) {
      this.loggerService.info(`Destination path: ${input.destination}`, input.outputFormat);
    }

    const repositoryProviderAdapter = await this.resolveRepositoryProvider(input);

    // If repository provider options were provided, apply them to the provider
    const repositoryOptions = input.repository?.options;
    if (repositoryOptions) {
      repositoryProviderAdapter.setOptions(repositoryOptions);
    }

    const generatorAdapter = this.resolveGeneratorAdapter(input);

    // Log section options if provided
    if (input.sections?.includeSections?.length) {
      this.loggerService.info(
        `Including sections: ${input.sections.includeSections.join(', ')}`,
        input.outputFormat
      );
    }
    if (input.sections?.excludeSections?.length) {
      this.loggerService.info(
        `Excluding sections: ${input.sections.excludeSections.join(', ')}`,
        input.outputFormat
      );
    }

    if (input.dryRun) {
      this.loggerService.info('DRY-RUN MODE: Would generate documentation with the following configuration:', input.outputFormat);
      this.loggerService.info(`- Repository platform: ${repositoryProviderAdapter.getPlatformName()}`, input.outputFormat);
      this.loggerService.info(`- CI/CD platform: ${generatorAdapter.getPlatformName()}`, input.outputFormat);

      const supportedSections = generatorAdapter.getSupportedSections();
      if (supportedSections) {
        this.loggerService.info(`- Available sections: ${supportedSections.join(', ')}`, input.outputFormat);
      }

      this.loggerService.info('DRY-RUN MODE: Documentation generation preview completed successfully!', input.outputFormat);

      return {
        success: true,
        message: 'Documentation generation preview completed successfully (dry-run mode)',
      };
    }

    // Generate documentation using the specific CI/CD platform adapter
    // Note: generateDocumentationForPlatform(adapter, source, output?) returns the destination path
    const destination = await this.generatorService.generateDocumentationForPlatform(
      generatorAdapter,
      input.source,
      input.destination
    );

    this.loggerService.info('Documentation generated successfully!', input.outputFormat);
    this.loggerService.info(`Documentation saved to: ${destination}`, input.outputFormat);

    // Output the result using the logger
    const result: GenerateDocumentationUseCaseOutput = {
      success: true,
      message: 'Documentation generated successfully',
      destination,
    };


    // Log the result at the command level
    this.loggerService.result(result, input.outputFormat);

    return result;
  }

  /**
   * Auto-detect repository platform if not provided    
   */
  private async resolveRepositoryProvider(input: GenerateDocumentationUseCaseInput) {
    let repositoryProviderAdapter: RepositoryProvider | undefined;
    if (input.repository?.platform) {
      this.loggerService.info(`Repository platform: ${input.repository.platform}`, input.outputFormat);
      repositoryProviderAdapter = this.repositoryService.getRepositoryProviderByPlatform(input.repository.platform);
      if (!repositoryProviderAdapter) {
        throw new Error(
          `No repository platform found for '${input.repository.platform}'. Please specify a valid one.`
        );
      }

    } else {
      repositoryProviderAdapter = await this.repositoryService.autoDetectRepositoryProvider();
      if (!repositoryProviderAdapter) {
        throw new Error(
          `No repository platform could be auto-detected. Please specify one using --repository option.`
        );
      }
      this.loggerService.info(
        `Auto-detected repository platform: ${repositoryProviderAdapter.getPlatformName()}`,
        input.outputFormat
      );
    }
    return repositoryProviderAdapter;
  }

  /**
   * Get CI/CD adapter (either from platform input or auto-detect)
   */
  private resolveGeneratorAdapter(input: GenerateDocumentationUseCaseInput) {
    let generatorAdapter: GeneratorAdapter | undefined;
    if (input.cicd?.platform) {
      this.loggerService.info(`CI/CD platform: ${input.cicd.platform}`, input.outputFormat);
      generatorAdapter = this.generatorService.getGeneratorAdapterByPlatform(
        input.cicd.platform
      );
      if (!generatorAdapter) {
        throw new Error(
          `No generator adapter found for CI/CD platform '${input.cicd.platform}'`
        );
      }
    } else {
      generatorAdapter = this.generatorService.autoDetectCicdAdapter(input.source);
      if (!generatorAdapter) {
        throw new Error(
          `No CI/CD platform could be auto-detected for source '${input.source}'. Please specify one using --cicd option.`
        );
      }
      this.loggerService.info(
        `Auto-detected CI/CD platform: ${generatorAdapter.getPlatformName()}`,
        input.outputFormat
      );
    }
    return generatorAdapter;
  }


  private validateInput(input: GenerateDocumentationUseCaseInput): void {
    if (!input.source) {
      throw new Error('Source manifest file path is required');
    }

    // Validate that the source exists and is a file
    if (!existsSync(input.source) || !statSync(input.source).isFile()) {
      throw new Error(`Source manifest file does not exist or is not a file: ${input.source}`);
    }

    // Validate repository platform if provided
    if (input.repository?.platform) {
      const validRepositoryPlatforms = this.getSupportedRepositoryPlatforms();
      if (!validRepositoryPlatforms.includes(input.repository.platform)) {
        throw new Error(
          `Invalid repository platform '${input.repository.platform
          }'. Valid platforms: ${validRepositoryPlatforms.join(', ')}`
        );
      }
    }

    // Validate CI/CD platform if provided
    if (input.cicd?.platform) {
      const validCicdPlatforms = this.getSupportedCicdPlatforms();
      if (!validCicdPlatforms.includes(input.cicd.platform)) {
        throw new Error(
          `Invalid CI/CD platform '${input.cicd.platform
          }'. Valid platforms: ${validCicdPlatforms.join(', ')}`
        );
      }
    }
  }

}
