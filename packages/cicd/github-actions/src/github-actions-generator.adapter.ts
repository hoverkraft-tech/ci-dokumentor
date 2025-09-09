import {
  GeneratorAdapter,
  SECTION_GENERATOR_ADAPTER_IDENTIFIER,
  SectionGeneratorAdapter,
  RepositoryProvider,
  GenerateSectionsOptions,
  RendererAdapter,
  SectionOptionsDescriptors,
  SectionGenerationPayload,
} from '@ci-dokumentor/core';
import { inject, multiInject } from 'inversify';
import {
  GitHubActionsManifest,
  GitHubActionsParser,
} from './github-actions-parser.js';
import { dirname, join } from 'node:path';

/**
 * GitHub Actions generator adapter.
 * This class is a placeholder for the actual implementation of the GitHub Actions generator.
 * It implements the GeneratorAdapter interface from the core package.
 */
export class GitHubActionsGeneratorAdapter implements GeneratorAdapter {
  constructor(
    @inject(GitHubActionsParser)
    public readonly gitHubActionsParser: GitHubActionsParser,
    @multiInject(SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    private readonly sectionGeneratorAdapters: SectionGeneratorAdapter<GitHubActionsManifest>[]
  ) { }

  /**
   * Get the platform name identifier for this adapter
   */
  getPlatformName(): string {
    return 'github-actions';
  }

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
    const sectionOptions: Record<string, SectionOptionsDescriptors> = {};

    for (const sectionGenerator of this.sectionGeneratorAdapters) {
      const sectionId = sectionGenerator.getSectionIdentifier();
      // getSectionOptions is now mandatory, so we can call it directly
      sectionOptions[sectionId] = sectionGenerator.getSectionOptions();
    }

    return sectionOptions;
  }

  /**
   * Checks if the adapter supports the given source file.
   * @param source The source file path.
   * @returns True if the adapter supports the source, false otherwise.
   */
  supportsSource(source: string): boolean {
    // GitHub Actions files are typically .yml or .yaml files in .github/workflows/ or action.yml/action.yaml
    const isYaml = /\.ya?ml$/i.test(source);
    const isGitHubActionOrWorkflow =
      this.gitHubActionsParser.isGitHubActionFile(source) ||
      this.gitHubActionsParser.isGitHubWorkflowFile(source);
    return isYaml && isGitHubActionOrWorkflow;
  }

  /**
   * Returns the documentation path for the given source file.
   * @param source The source file path.
   * @returns The documentation path.
   */
  getDocumentationPath(source: string): string {
    // For GitHub Actions, the documentation path README.md in the same directory
    if (this.gitHubActionsParser.isGitHubActionFile(source)) {
      return join(dirname(source), 'README.md');
    }

    // For GitHub Workflows, the documentation path is .github/workflows/[workflow].md
    if (this.gitHubActionsParser.isGitHubWorkflowFile(source)) {
      return source.replace(/\.ya?ml$/, '.md');
    }

    throw new Error(`Unsupported source file: ${source}`);
  }

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
    const gitHubActionOrWorkflow = this.gitHubActionsParser.parseFile(
      source,
      await repositoryProvider.getRepositoryInfo()
    );

    for (const sectionGeneratorAdapter of this.sectionGeneratorAdapters) {
      // Check if the section should be included or excluded based on the options
      if (!this.shouldGenerateSection(sectionGeneratorAdapter, sections)) {
        continue;
      }

      // Apply section-specific options if provided
      const sectionId = sectionGeneratorAdapter.getSectionIdentifier();
      if (sections.sectionConfig && sections.sectionConfig[sectionId]) {
        sectionGeneratorAdapter.setSectionOptions(sections.sectionConfig[sectionId]);
      }

      // Section generators now use repository provider for on-demand data fetching
      const payload: SectionGenerationPayload<GitHubActionsManifest> = {
        formatterAdapter: rendererAdapter.getFormatterAdapter(),
        manifest: gitHubActionOrWorkflow,
        repositoryProvider,
      };

      const sectionContent = await sectionGeneratorAdapter.generateSection(payload);

      await rendererAdapter.writeSection(
        sectionGeneratorAdapter.getSectionIdentifier(),
        sectionContent,
      );
    }
  }

  private shouldGenerateSection(
    sectionGeneratorAdapter: SectionGeneratorAdapter<GitHubActionsManifest>,
    options: GenerateSectionsOptions
  ): boolean {
    if (options.includeSections && !options.includeSections.includes(sectionGeneratorAdapter.getSectionIdentifier())) {
      return false;
    }
    if (options.excludeSections && options.excludeSections.includes(sectionGeneratorAdapter.getSectionIdentifier())) {
      return false;
    }
    return true;
  }
}
