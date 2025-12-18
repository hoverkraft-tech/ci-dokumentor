import {
  SectionGeneratorAdapter,
  SectionIdentifier,
  SectionOptions,
  SectionGenerationPayload,
  SectionOptionsDescriptors,
  ReadableContent,
} from '@ci-dokumentor/core';
import { GitLabComponent, GitLabCIManifest, GitLabCIPipeline } from '../gitlab-ci-parser.js';

export abstract class GitLabCISectionGeneratorAdapter
  implements SectionGeneratorAdapter<GitLabCIManifest> {

  abstract getSectionIdentifier(): SectionIdentifier;

  /**
   * Generate section content using a structured payload object
   */
  abstract generateSection(payload: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent>;

  /**
   * Provide CLI option descriptors specific to this section generator
   * Must return an object (can be empty if no options needed)
   */
  getSectionOptions(): SectionOptionsDescriptors<SectionOptions> {
    return {};
  }

  /**
   * Apply runtime option values to the section generator
   */
  setSectionOptions(options: Partial<SectionOptions>): void {
    // Default implementation - subclasses can override
    void options;
  }

  protected isGitLabComponent(parsed: unknown): parsed is GitLabComponent {
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      typeof parsed.name === 'string' &&
      'spec' in parsed &&
      typeof parsed.spec === 'object' &&
      parsed.spec !== null &&
      'inputs' in parsed.spec
    );
  }

  protected isGitLabCIPipeline(parsed: unknown): parsed is GitLabCIPipeline {
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      typeof parsed.name === 'string'
    );
  }
}