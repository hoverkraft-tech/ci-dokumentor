import {
  GenerateSectionsOptions,
  GENERATOR_ADAPTER_IDENTIFIER,
  GeneratorAdapter,
} from './generator.adapter.js';
import { FileOutputAdapter } from '../output/file-output.adapter.js';
import { inject, injectable, multiInject } from 'inversify';
import { FormatterService } from '../formatter/formatter.service.js';
import { RepositoryProvider } from 'src/index.js';

@injectable()
export class GeneratorService {
  constructor(
    @inject(FormatterService)
    private readonly formatterService: FormatterService,
    @multiInject(GENERATOR_ADAPTER_IDENTIFIER)
    private readonly generatorAdapters: GeneratorAdapter[]
  ) { }

  /**
   * Get list of supported CI/CD platforms based on registered generator adapters
   */
  getSupportedCicdPlatforms(): string[] {
    return this.generatorAdapters.map((adapter) => adapter.getPlatformName());
  }

  /**
   * Get generator adapter for a specific platform
   */
  getGeneratorAdapterByPlatform(
    platform: string
  ): GeneratorAdapter | undefined {
    return this.generatorAdapters.find(
      (adapter) => adapter.getPlatformName() === platform
    );
  }

  /**
   * Auto-detect CI/CD platform for a given source
   */
  autoDetectCicdPlatform(source: string): string | null {
    for (const adapter of this.generatorAdapters) {
      if (adapter.supportsSource(source)) {
        return adapter.getPlatformName();
      }
    }
    return null;
  }

  /**
   * Auto-detect CI/CD adapter for a given source
   */
  autoDetectCicdAdapter(source: string): GeneratorAdapter | undefined {
    for (const adapter of this.generatorAdapters) {
      if (adapter.supportsSource(source)) {
        return adapter;
      }
    }
    return undefined;
  }

  /**
   * Generates documentation for the given path using a specific CI/CD platform adapter.
   */
  async generateDocumentationForPlatform({
    source,
    destination,
    dryRun,
    sections,
    generatorAdapter,
    repositoryProvider,
  }: {
    source: string;
    destination?: string;
    dryRun: boolean;
    sections: GenerateSectionsOptions;
    generatorAdapter: GeneratorAdapter;
    repositoryProvider: RepositoryProvider;
  }): Promise<string> {
    // Check if the adapter supports the source path
    if (!generatorAdapter.supportsSource(source)) {
      throw new Error(
        `CI/CD platform '${generatorAdapter.getPlatformName()}' does not support source '${source}'`
      );
    }

    const destinationPath = destination ?? generatorAdapter.getDocumentationPath(source);
    const formatterAdapter = this.formatterService.getFormatterAdapterForFile(destinationPath);

    // Use FileOutputAdapter for writing to files
    const outputAdapter = new FileOutputAdapter(
      destinationPath,
      formatterAdapter
    );

    await generatorAdapter.generateDocumentation({
      source,
      sections,
      formatterAdapter,
      outputAdapter,
      repositoryProvider
    });

    return destinationPath;
  }


}
