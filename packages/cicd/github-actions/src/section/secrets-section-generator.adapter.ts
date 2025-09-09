import { SectionGenerationPayload } from '@ci-dokumentor/core';
import {
  GitHubActionsManifest,
  GitHubWorkflow,
  GitHubWorkflowSecret,
} from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

@injectable()
export class SecretsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Secrets;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    if (this.isGitHubAction(manifest)) {
      return Buffer.from('');
    }

    if (!this.isGitHubWorkflow(manifest)) {
      throw new Error('Unsupported manifest type for InputsSectionGenerator');
    }

    const manifestSecretsContent = this.generateWorkflowSecretsTable(formatterAdapter, manifest);
    if (!manifestSecretsContent || manifestSecretsContent.length === 0) {
      return Buffer.alloc(0);
    }

    return Buffer.concat([
      formatterAdapter.heading(Buffer.from('Secrets'), 2),
      formatterAdapter.lineBreak(),
      manifestSecretsContent,
    ]);
  }

  private generateWorkflowSecretsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubWorkflow
  ): Buffer {
    const secrets = Object.entries(manifest.on?.workflow_call?.secrets || {});

    if (secrets.length === 0) {
      return Buffer.alloc(0);
    }

    const headers = [
      formatterAdapter.bold(Buffer.from('Secret')),
      formatterAdapter.bold(Buffer.from('Description')),
      formatterAdapter.bold(Buffer.from('Required')),
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
  ): Buffer {
    return formatterAdapter.bold(
      formatterAdapter.inlineCode(Buffer.from(name))
    );
  }

  private getSecretDescription(secret: GitHubWorkflowSecret): Buffer {
    return Buffer.from((secret.description || '').trim());
  }

  private getSecretRequired(
    secret: GitHubWorkflowSecret,
    formatterAdapter: FormatterAdapter
  ): Buffer {
    return formatterAdapter.bold(
      Buffer.from(secret.required ? 'true' : 'false')
    );
  }
}
