import { GENERATOR_ADAPTER_IDENTIFIER, GeneratorAdapter } from './generator.adapter.js';
import { FileOutputAdapter } from '../output/file-output.adapter.js';
import { inject, injectable, multiInject } from 'inversify';
import { FormatterService } from '../formatter/formatter.service.js';


@injectable()
export class GeneratorService {
  constructor(
    @inject(FormatterService) private readonly formatterService: FormatterService,
    @multiInject(GENERATOR_ADAPTER_IDENTIFIER) private readonly generatorAdapters: GeneratorAdapter[]
  ) { }

  /**
   * Get list of supported CI/CD platforms based on registered generator adapters
   */
  getSupportedCicdPlatforms(): string[] {
    return this.generatorAdapters.map(adapter => adapter.getPlatformName());
  }

  /**
   * Generates documentation for the given path using all registered generator adapters.
   */
  async generateDocumentation(source: string): Promise<void> {
    for (const adapter of this.generatorAdapters) {
      // Check if the adapter supports the source path
      if (!adapter.supportsSource(source)) {
        continue;
      }

      const destinationPath = adapter.getDocumentationPath(source);

      const formatterAdapter = this.formatterService.getFormatterAdapterForFile(destinationPath);

      // Create an output adapter for the destination path
      const outputAdapter = new FileOutputAdapter(destinationPath, formatterAdapter);

      await adapter.generateDocumentation(source, formatterAdapter, outputAdapter);
    }
  }
}
