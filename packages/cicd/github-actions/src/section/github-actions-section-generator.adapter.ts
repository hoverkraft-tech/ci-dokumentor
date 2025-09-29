import {
  SectionGeneratorAdapter,
  SectionIdentifier,
  SectionOptions,
  SectionGenerationPayload,
  SectionOptionsDescriptors,
  ReadableContent,
} from '@ci-dokumentor/core';
import { GitHubAction, GitHubActionsManifest, GitHubWorkflow } from '../github-actions-parser.js';

export abstract class GitHubActionsSectionGeneratorAdapter
  implements SectionGeneratorAdapter<GitHubActionsManifest> {

  abstract getSectionIdentifier(): SectionIdentifier;

  /**
   * Generate section content using a structured payload object
   */
  abstract generateSection(payload: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent>;

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSectionOptions(_options: Partial<SectionOptions>): void {
    // Default implementation - subclasses can override
  }

  protected isGitHubAction(parsed: unknown): parsed is GitHubAction {
    // Validate all required fields for a GitHub Action
    return (
      'name' in (parsed as GitHubAction) &&
      typeof (parsed as GitHubAction).name === 'string' &&
      'runs' in (parsed as GitHubAction) &&
      typeof (parsed as GitHubAction).runs === 'object' &&
      'using' in (parsed as GitHubAction).runs &&
      typeof (parsed as GitHubAction).runs.using === 'string'
    );
  }

  protected isGitHubWorkflow(parsed: unknown): parsed is GitHubWorkflow {
    // Validate all required fields for a GitHub Workflow
    return (
      'name' in (parsed as GitHubWorkflow) &&
      typeof (parsed as GitHubWorkflow).name === 'string' &&
      'on' in (parsed as GitHubWorkflow) &&
      (typeof (parsed as GitHubWorkflow).on === 'object' ||
        Array.isArray((parsed as GitHubWorkflow).on) ||
        typeof (parsed as GitHubWorkflow).on === 'string')
    );
  }
}
