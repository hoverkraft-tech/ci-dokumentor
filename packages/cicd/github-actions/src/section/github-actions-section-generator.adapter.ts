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

  protected isGitHubAction(parsed: any): parsed is GitHubAction {
    // Validate all required fields for a GitHub Action
    return (
      'name' in parsed &&
      typeof parsed.name === 'string' &&
      'runs' in parsed &&
      typeof parsed.runs === 'object' &&
      'using' in parsed.runs &&
      typeof parsed.runs.using === 'string'
    );
  }

  protected isGitHubWorkflow(parsed: any): parsed is GitHubWorkflow {
    // Validate all required fields for a GitHub Workflow
    return (
      'name' in parsed &&
      typeof parsed.name === 'string' &&
      'on' in parsed &&
      (typeof parsed.on === 'object' ||
        Array.isArray(parsed.on) ||
        typeof parsed.on === 'string')
    );
  }
}
