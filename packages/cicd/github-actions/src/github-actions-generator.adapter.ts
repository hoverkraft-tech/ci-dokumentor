import { dirname, join } from 'node:path';
import {
  AbstractGeneratorAdapter,
  RepositoryInfo,
  SectionGeneratorAdapter,
} from '@ci-dokumentor/core';
import { inject, multiInject } from 'inversify';
import {
  GitHubActionsManifest,
  GitHubActionsParser,
} from './github-actions-parser.js';

export const GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER = Symbol(
  'GitHubActionsSectionGeneratorAdapter'
);

/**
 * GitHub Actions generator adapter.
 * This class is a placeholder for the actual implementation of the GitHub Actions generator.
 * It implements the GeneratorAdapter interface from the core package.
 */
export class GitHubActionsGeneratorAdapter extends AbstractGeneratorAdapter<GitHubActionsManifest> {
  constructor(
    @inject(GitHubActionsParser)
    public readonly gitHubActionsParser: GitHubActionsParser,
    @multiInject(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    sectionGeneratorAdapters: SectionGeneratorAdapter<GitHubActionsManifest>[]
  ) {
    super(sectionGeneratorAdapters);
  }

  /**
   * Get the platform name identifier for this adapter
   */
  getPlatformName(): string {
    return 'github-actions';
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

  /**
   * Parse the source file into a manifest
   */
  protected async parseFile(source: string, repositoryInfo: RepositoryInfo): Promise<GitHubActionsManifest> {
    return await this.gitHubActionsParser.parseFile(source, repositoryInfo);
  }
}
