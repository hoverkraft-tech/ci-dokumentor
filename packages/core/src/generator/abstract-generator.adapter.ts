import { RepositoryInfo, RepositoryProvider } from '../repository/repository.provider.js';
import { RendererAdapter } from '../renderer/renderer.adapter.js';
import {
  GeneratorAdapter,
  GenerateSectionsOptions,
} from './generator.adapter.js';
import {
  SectionGeneratorAdapter,
  SectionOptionsDescriptors,
  SectionGenerationPayload,
} from './section/section-generator.adapter.js';

/**
 * Abstract base class for generator adapters to avoid code duplication
 */
export abstract class AbstractGeneratorAdapter<TManifest> implements GeneratorAdapter {
  constructor(
    protected readonly sectionGeneratorAdapters: SectionGeneratorAdapter<TManifest>[]
  ) { }

  /**
   * Get the platform name identifier for this adapter
   */
  abstract getPlatformName(): string;

  /**
   * Get the list of supported section identifiers for this adapter
   */
  getSupportedSections(): string[] {
    return this.sectionGeneratorAdapters.map((adapter) =>
      adapter.getSectionIdentifier()
    );
  }

  /**
   * Get section-specific options from all section generators
   */
  getSectionsOptions(): Record<string, SectionOptionsDescriptors> {
    const sectionsOptions: Record<string, SectionOptionsDescriptors> = {};

    for (const sectionGeneratorAdapter of this.sectionGeneratorAdapters) {
      const sectionIdentifier = sectionGeneratorAdapter.getSectionIdentifier();
      sectionsOptions[sectionIdentifier] = sectionGeneratorAdapter.getSectionOptions();
    }

    return sectionsOptions;
  }

  /**
   * Checks if the adapter supports the given source file.
   */
  abstract supportsSource(source: string): boolean;

  /**
   * Returns the documentation path for the given source file.
   */
  abstract getDocumentationPath(source: string): string;

  /**
   * Generates documentation for the given path using this CI/CD platform adapter.
   */
  async generateDocumentation({
    source,
    sections,
    rendererAdapter,
    repositoryProvider,
  }: {
    source: string;
    sections: GenerateSectionsOptions;
    rendererAdapter: RendererAdapter;
    repositoryProvider: RepositoryProvider;
  }): Promise<void> {
    const repositoryInfo = await repositoryProvider.getRepositoryInfo();
    const manifest = await this.parseFile(source, repositoryInfo);

    // Create the section generation payload
    const payload: SectionGenerationPayload<TManifest> = {
      manifest,
      repositoryProvider,
      formatterAdapter: rendererAdapter.getFormatterAdapter(),
      destination: rendererAdapter.getDestination(),
    };

    // Generate sections
    for (const sectionGeneratorAdapter of this.sectionGeneratorAdapters) {
      // Check if this section should be included or excluded
      if (!this.shouldGenerateSection(sectionGeneratorAdapter, sections)) {
        continue;
      }

      // Apply section-specific configuration
      const sectionIdentifier = sectionGeneratorAdapter.getSectionIdentifier();
      const sectionConfig = sections.sectionConfig?.[sectionIdentifier] || {};
      sectionGeneratorAdapter.setSectionOptions(sectionConfig);

      // Generate the section
      const sectionContent = await sectionGeneratorAdapter.generateSection(payload);

      await rendererAdapter.writeSection(
        sectionGeneratorAdapter.getSectionIdentifier(),
        sectionContent,
      );
    }
  }

  /**
   * Parse the source file into a manifest - to be implemented by subclasses
   */
  protected abstract parseFile(source: string, repositoryInfo: RepositoryInfo): Promise<TManifest>;

  /**
   * Check if a section should be generated based on include/exclude options
   */
  protected shouldGenerateSection(
    sectionGeneratorAdapter: SectionGeneratorAdapter<TManifest>,
    options: GenerateSectionsOptions
  ): boolean {
    const sectionId = sectionGeneratorAdapter.getSectionIdentifier();

    if (options.includeSections && !options.includeSections.includes(sectionId)) {
      return false;
    }
    if (options.excludeSections && options.excludeSections.includes(sectionId)) {
      return false;
    }
    return true;
  }
}