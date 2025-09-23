import { ReadableContent, SectionGenerationPayload , FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import {
  GitHubActionsManifest,
  GitHubWorkflow,
  GitHubWorkflowSecret,
} from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class SecretsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Secrets;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    if (this.isGitHubAction(manifest)) {
      return ReadableContent.empty();
    }

    if (!this.isGitHubWorkflow(manifest)) {
      throw new Error('Unsupported manifest type for InputsSectionGenerator');
    }

    const manifestSecretsContent = this.generateWorkflowSecretsTable(formatterAdapter, manifest);
    if (manifestSecretsContent.isEmpty()) {
      return ReadableContent.empty();
    }

    return formatterAdapter.heading(new ReadableContent('Secrets'), 2).append(
      formatterAdapter.lineBreak(),
      manifestSecretsContent,
    );
  }

  private generateWorkflowSecretsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubWorkflow
  ): ReadableContent {
    const secrets = Object.entries(manifest.on?.workflow_call?.secrets || {});

    if (secrets.length === 0) {
      return ReadableContent.empty();
    }

    const headers = [
      formatterAdapter.bold(new ReadableContent('Secret')),
      formatterAdapter.bold(new ReadableContent('Description')),
      formatterAdapter.bold(new ReadableContent('Required')),
    ];


    const rows = secrets.map(([name, secret]) => {
      return [
        this.getSecretName(name, formatterAdapter),
        this.getSecretDescription(secret),
        this.getSecretRequired(secret, formatterAdapter),
      ];
    });

    return formatterAdapter.table(headers, rows);
  }

  private getSecretName(
    name: string,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(
      formatterAdapter.inlineCode(new ReadableContent(name))
    );
  }

  private getSecretDescription(secret: GitHubWorkflowSecret): ReadableContent {
    return new ReadableContent((secret.description || '').trim());
  }

  private getSecretRequired(
    secret: GitHubWorkflowSecret,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(
      new ReadableContent(secret.required ? 'true' : 'false')
    );
  }
}
