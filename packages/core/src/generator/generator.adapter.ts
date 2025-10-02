import { RendererAdapter } from '../renderer/renderer.adapter.js';
import { RepositoryProvider } from '../repository/repository.provider.js';
import { SectionOptions, SectionOptionsDescriptors } from './section/section-generator.adapter.js';

export const GENERATOR_ADAPTER_IDENTIFIER = Symbol('GeneratorAdapter');

export type GenerateSectionsOptions = {
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
  sectionConfig?: Record<string, SectionOptions>;
};

export interface GeneratorAdapter {
  /**
   * Get the platform name identifier for this adapter
   * @returns string the platform name (e.g., 'github-actions')
   */
  getPlatformName(): string;

  /**
   * Get the list of supported section identifiers for this adapter
   * @returns Array of section identifiers that this adapter can generate
   */
  getSupportedSections(): string[];

  /**
   * Checks if the adapter supports the given source file.
   * @param source The source file path.
   * @returns True if the adapter supports the source, false otherwise.
   */
  supportsSource(source: string): boolean;

  /**
   * Returns the documentation path for the given source file.
   * @param source The source file path.
   * @returns The documentation path.
   */
  getDocumentationPath(source: string): string;

  /**
   * Generates documentation for the given path using this CI/CD platform adapter.
   */
  generateDocumentation({
    source,
    sections,
    rendererAdapter,
    repositoryProvider
  }: {
    source: string;
    sections: GenerateSectionsOptions;
    rendererAdapter: RendererAdapter;
    repositoryProvider: RepositoryProvider;
  }): Promise<void>;

  /**
   * Get section-specific options from all section generators
   * @returns Record mapping section identifiers to their option descriptors
   */
  getSectionsOptions(): Record<string, SectionOptionsDescriptors>;
}
