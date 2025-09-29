import { dirname, join } from 'node:path';
import {
  AbstractGeneratorAdapter,
  RepositoryInfo,
  SectionGeneratorAdapter,
} from '@ci-dokumentor/core';
import { inject, multiInject } from 'inversify';
import {
  GitLabCIManifest,
  GitLabCIParser,
} from './gitlab-ci-parser.js';

export const GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER = Symbol(
  'GitLabCISectionGeneratorAdapter'
);

/**
 * GitLab CI generator adapter.
 * This class implements the GeneratorAdapter interface for GitLab CI pipelines and components.
 */
export class GitLabCIGeneratorAdapter extends AbstractGeneratorAdapter<GitLabCIManifest> {
  constructor(
    @inject(GitLabCIParser)
    public readonly gitLabCIParser: GitLabCIParser,
    @multiInject(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    sectionGeneratorAdapters: SectionGeneratorAdapter<GitLabCIManifest>[]
  ) {
    super(sectionGeneratorAdapters);
  }

  /**
   * Get the platform name identifier for this adapter
   */
  getPlatformName(): string {
    return 'gitlab-ci';
  }

  /**
   * Checks if the adapter supports the given source file.
   */
  supportsSource(source: string): boolean {
    return this.gitLabCIParser.isGitLabCIFile(source) ||
      this.gitLabCIParser.isGitLabComponentFile(source);
  }

  /**
   * Returns the documentation path for the given source file.
   */
  getDocumentationPath(source: string): string {
    if (this.gitLabCIParser.isGitLabComponentFile(source)) {
      // If parent is 'templates', place docs next to the template
      const parentDir = dirname(source).split(/[/\\]/).pop() || '';
      if (parentDir === 'templates') {
        return source.replace(/\.(yml|yaml)$/, '.md');
      }

      // For GitLab components, place docs next to the template
      return join(dirname(source), 'docs.md');
    }

    if (this.gitLabCIParser.isGitLabCIFile(source)) {
      // For GitLab CI files, place docs next to the pipeline file with .md extension
      return source.replace(/\.(yml|yaml)$/, '.md');
    }

    throw new Error(`Unsupported source file: ${source}`);
  }

  /**
   * Parse the source file into a manifest
   */
  protected async parseFile(source: string, repositoryInfo: RepositoryInfo): Promise<GitLabCIManifest> {
    return await this.gitLabCIParser.parseFile(source, repositoryInfo);
  }
}