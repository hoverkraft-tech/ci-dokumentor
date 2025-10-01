import { inject, injectable } from 'inversify';
import {
  GenerateSectionsOptions,
  GeneratorAdapter,
  GeneratorService,
  RepositoryOptions,
  RepositoryOptionsDescriptors,
  RepositoryProvider,
  RepositoryService,
  SectionOptionsDescriptors,
  FormatterOptions,
  FileReaderAdapter,
  ConcurrencyService
} from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { LoggerService } from '../logger/logger.service.js';

export interface GenerateDocumentationUseCaseInput {
  /**
   * Output format for the generated documentation (required)
   */
  outputFormat: string | undefined;

  /**
   * Source manifest file path(s) or pattern(s) for the CI/CD platform to handle (required)
   * Can be:
   * - A single file path: `action.yml`
   * - Multiple file paths: `['action1.yml', 'action2.yml']`
   * - A glob pattern: `*.yml` or `.github/workflows/*.yml`
   */
  source: string | string[];

  /**
   * Destination path for generated documentation (optional)
   * If not provided, the generator adapter will auto-detect the destination path
   * Only applicable when processing a single file
   */
  destination?: string;

  /**
   * Dry-run mode - when true, validate inputs and show what would be generated without writing files
   */
  dryRun: boolean;

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
  sections: GenerateSectionsOptions;

  /**
   * Formatter options for output customization
   */
  formatterOptions: FormatterOptions;

  /**
   * Maximum number of files to process concurrently (optional)
   * Default: 5
   */
  concurrency?: number;
}

export interface GenerateDocumentationUseCaseOutput {
  success: boolean;
  destination?: string;
  data?: string;
  /** Results for each file when processing multiple files */
  results?: Array<{
    source: string;
    success: boolean;
    destination?: string;
    error?: string;
  }>;
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
    private readonly repositoryService: RepositoryService,
    @inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter,
    @inject(ConcurrencyService) private readonly concurrencyService: ConcurrencyService
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
    RepositoryOptionsDescriptors
  > {
    const options: RepositoryOptionsDescriptors = {};

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
   * Get section-specific options for current context
   */
  getSectionSupportedOptions({
    cicdPlatform,
    source
  }: {
    cicdPlatform?: string;
    source?: string;
  }): Record<string, SectionOptionsDescriptors> {
    let generatorAdapter: GeneratorAdapter | undefined;
    if (cicdPlatform) {
      generatorAdapter = this.generatorService.getGeneratorAdapterByPlatform(cicdPlatform);
    } else if (source) {
      generatorAdapter = this.generatorService.autoDetectCicdAdapter(source);
    }

    if (generatorAdapter) {
      return generatorAdapter.getSectionsOptions();
    }

    return {};
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
    // Resolve source files from patterns
    const sourceFiles = await this.resolveSourceFiles(input.source);
    
    if (sourceFiles.length === 0) {
      throw new Error('No source files found matching the provided pattern(s)');
    }

    // Validate destination is not provided when processing multiple files
    if (sourceFiles.length > 1 && input.destination) {
      throw new Error('--destination option cannot be used when processing multiple files. Destinations will be auto-detected.');
    }

    // Single file processing (original behavior)
    if (sourceFiles.length === 1) {
      return this.executeSingleFile({
        ...input,
        source: sourceFiles[0]
      });
    }

    // Multiple file processing
    return this.executeMultipleFiles(input, sourceFiles);
  }

  /**
   * Resolve source files from patterns using ReaderAdapter
   */
  private async resolveSourceFiles(source: string | string[]): Promise<string[]> {
    const sources = Array.isArray(source) ? source : [source];
    const resolvedFiles = new Set<string>();

    for (const pattern of sources) {
      const files = await this.readerAdapter.findResources(pattern);
      files.forEach(file => resolvedFiles.add(file));
    }

    return Array.from(resolvedFiles).sort();
  }

  /**
   * Execute documentation generation for a single file
   */
  private async executeSingleFile(
    input: GenerateDocumentationUseCaseInput & { source: string }
  ): Promise<GenerateDocumentationUseCaseOutput> {
    this.validateInput(input);

    this.loggerService.info(
      `${input.dryRun ? '[DRY RUN] ' : ''}Starting documentation generation...`, input.outputFormat);
    this.loggerService.info(`Source manifest: ${input.source}`, input.outputFormat);
    if (input.destination) {
      this.loggerService.info(`Destination path: ${input.destination}`, input.outputFormat);
    }

    // Log section options if provided
    if (input.sections) {
      if (input.sections.includeSections?.length) {
        this.loggerService.info(
          `Including sections: ${input.sections.includeSections.join(', ')}`,
          input.outputFormat
        );
      }
      if (input.sections.excludeSections?.length) {
        this.loggerService.info(
          `Excluding sections: ${input.sections.excludeSections.join(', ')}`,
          input.outputFormat
        );
      }
    }

    const generatorAdapter = await this.resolveGeneratorAdapter(input);
    const repositoryProvider = await this.resolveRepositoryProvider(input);

    // Generate documentation using the specific CI/CD platform adapter
    const { destination, data } = await this.generatorService.generateDocumentationForPlatform({
      source: input.source,
      destination: input.destination,
      dryRun: input.dryRun,
      sections: input.sections,
      generatorAdapter,
      repositoryProvider,
      formatterOptions: input.formatterOptions,
    });

    this.loggerService.info('Documentation generated successfully!', input.outputFormat);

    const message = input.dryRun
      ? `(Dry-run) Documentation would be saved to: ${destination}`
      : `Documentation saved to: ${destination}`;

    this.loggerService.info(message, input.outputFormat);

    // Output the result using the logger
    const useCaseOutput: GenerateDocumentationUseCaseOutput = {
      success: true,
      destination,
      data
    };

    // Log the result at the command level
    this.loggerService.result(useCaseOutput, input.outputFormat);

    return useCaseOutput;
  }

  /**
   * Execute documentation generation for multiple files concurrently
   */
  private async executeMultipleFiles(
    input: GenerateDocumentationUseCaseInput,
    sourceFiles: string[]
  ): Promise<GenerateDocumentationUseCaseOutput> {
    const concurrency = input.concurrency ?? 5;

    this.loggerService.info(
      `${input.dryRun ? '[DRY RUN] ' : ''}Starting documentation generation for ${sourceFiles.length} files...`,
      input.outputFormat
    );

    // Create tasks for each file
    const tasks = sourceFiles.map(source => async () => {
      const fileInput = { ...input, source };
      return this.executeSingleFile(fileInput);
    });

    // Execute with concurrency control
    const results = await this.concurrencyService.executeWithLimit(tasks, concurrency);

    // Collect results
    const fileResults = results.map((result, index) => {
      const source = sourceFiles[index];
      if (result.status === 'fulfilled') {
        return {
          source,
          success: true,
          destination: result.value.destination,
        };
      } else {
        return {
          source,
          success: false,
          error: result.reason?.message || String(result.reason),
        };
      }
    });

    // Check for failures
    const failures = fileResults.filter(r => !r.success);
    
    if (failures.length > 0) {
      const errorMessages = failures.map(f => `  - ${f.source}: ${f.error}`).join('\n');
      throw new Error(`Failed to process ${failures.length} of ${sourceFiles.length} files:\n${errorMessages}`);
    }

    this.loggerService.info(
      `Successfully processed ${sourceFiles.length} files!`,
      input.outputFormat
    );

    return {
      success: true,
      results: fileResults,
    };
  }

  private validateInput(input: GenerateDocumentationUseCaseInput & { source: string }): void {
    if (!input.source) {
      throw new Error('Source manifest file path is required');
    }

    // Validate that the source exists
    if (!this.readerAdapter.resourceExists(input.source)) {
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

  /**
   * Auto-detect repository platform if not provided    
   */
  private async resolveRepositoryProvider(input: GenerateDocumentationUseCaseInput & { source: string }): Promise<RepositoryProvider> {
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

    // If repository provider options were provided, apply them to the provider
    const repositoryOptions = input.repository?.options;
    if (repositoryOptions) {
      repositoryProviderAdapter.setOptions(repositoryOptions);
    }

    return repositoryProviderAdapter;
  }

  /**
 * Get CI/CD adapter (either from platform input or auto-detect)
 */
  private async resolveGeneratorAdapter(input: GenerateDocumentationUseCaseInput & { source: string }): Promise<GeneratorAdapter> {
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

}
