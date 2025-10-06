import { inject, injectable, multiInject } from 'inversify';
import { FormatterService } from '../formatter/formatter.service.js';
import { RepositoryProvider } from '../repository/repository.provider.js';
import { FormatterOptions } from '../formatter/formatter.adapter.js';
import { RENDERER_FACTORY_IDENTIFIER } from '../renderer/renderer.factory.js';
import type { RendererFactory } from '../renderer/renderer.factory.js';
import {
  GenerateSectionsOptions,
  GENERATOR_ADAPTER_IDENTIFIER,
  GeneratorAdapter,
} from './generator.adapter.js';

@injectable()
export class GeneratorService {
  constructor(
    @inject(FormatterService)
    private readonly formatterService: FormatterService,
    @inject(RENDERER_FACTORY_IDENTIFIER)
    private readonly rendererFactory: RendererFactory,
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
   * Generates documentation for a given CI/CD platform
   */
  async generateDocumentationForPlatform({
    source,
    destination,
    dryRun,
    sections,
    generatorAdapter,
    repositoryProvider,
    formatterOptions,
  }: {
    source: string;
    destination?: string;
    dryRun: boolean;
    sections: GenerateSectionsOptions;
    generatorAdapter: GeneratorAdapter;
    repositoryProvider: RepositoryProvider;
    formatterOptions: FormatterOptions;
  }): Promise<{ destination: string; data: string | undefined }> {
    // Check if the adapter supports the source path
    if (!generatorAdapter.supportsSource(source)) {
      throw new Error(
        `CI/CD platform '${generatorAdapter.getPlatformName()}' does not support source '${source}'`
      );
    }

    const destinationPath = destination ?? generatorAdapter.getDocumentationPath(source);
    const formatterAdapter = this.formatterService.getFormatterAdapterForFile(destinationPath);

    // Set formatter options before initializing renderer
    formatterAdapter.setOptions(formatterOptions);

    // Use provided renderer adapter or default to FileRenderer
    const rendererAdapter = this.rendererFactory(dryRun);

    // Initialize renderer for this destination
    await rendererAdapter.initialize(destinationPath, formatterAdapter);

    await generatorAdapter.generateDocumentation({
      source,
      sections,
      rendererAdapter,
      repositoryProvider,
    });

    const data = await rendererAdapter.finalize();

    return { destination: destinationPath, data };
  }
}
