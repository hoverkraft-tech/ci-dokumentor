import { Repository } from '@ci-dokumentor/core';
import {
  FormatterAdapter,
  SectionGeneratorAdapter,
  SectionIdentifier,
} from '@ci-dokumentor/core';
import { GitHubAction, GitHubActionsManifest, GitHubWorkflow } from 'src/github-actions-parser.js';

export abstract class GitHubActionsSectionGeneratorAdapter
  implements SectionGeneratorAdapter<GitHubActionsManifest> {
  abstract getSectionIdentifier(): SectionIdentifier;

  abstract generateSection(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repository: Repository
  ): Buffer;

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
