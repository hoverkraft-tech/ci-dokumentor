import {
  GENERATOR_ADAPTER_IDENTIFIER,
  GeneratorAdapter,
} from './generator.adapter.js';
import { FileOutputAdapter } from '../output/file-output.adapter.js';
import { inject, injectable, multiInject } from 'inversify';
import { FormatterService } from '../formatter/formatter.service.js';

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
   * Get supported sections for a specific CI/CD platform
   */
  getSupportedSectionsForPlatform(platform: string): string[] {
    const adapter = this.getGeneratorAdapterByPlatform(platform);
    return adapter ? adapter.getSupportedSections() : [];
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
  autoDetectCicdAdapter(source: string): GeneratorAdapter | null {
    for (const adapter of this.generatorAdapters) {
      if (adapter.supportsSource(source)) {
        return adapter;
      }
    }
    return null;
  }

  /**
   * Generates documentation for the given path using a specific CI/CD platform adapter.
   */
  async generateDocumentationForPlatform(
    adapter: GeneratorAdapter,
    source: string,
    output?: string
  ): Promise<string> {
    // Check if the adapter supports the source path
    if (!adapter.supportsSource(source)) {
      throw new Error(
        `CI/CD platform '${adapter.getPlatformName()}' does not support source '${source}'`
      );
    }

    const destinationPath = output ?? adapter.getDocumentationPath(source);
    const formatterAdapter =
      this.formatterService.getFormatterAdapterForFile(destinationPath);

    // Create an output adapter for the destination path
    const outputAdapter = new FileOutputAdapter(
      destinationPath,
      formatterAdapter
    );

    await adapter.generateDocumentation(
      source,
      formatterAdapter,
      outputAdapter
    );

    return destinationPath;
  }
}
