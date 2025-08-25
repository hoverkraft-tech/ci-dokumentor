import { Repository } from '@ci-dokumentor/core';
import {
  GitHubAction,
  GitHubActionOutput,
  GitHubActionsManifest,
  GitHubWorkflow,
  GitHubWorkflowOutput,
} from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';

export class OutputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Outputs;
  }

  generateSection(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    _repository: Repository
  ): Buffer {
    let manifestOutputsContent: Buffer;
    if (this.isGitHubAction(manifest)) {
      manifestOutputsContent = this.generateActionOutputsTable(formatterAdapter, manifest);
    } else if (this.isGitHubWorkflow(manifest)) {
      manifestOutputsContent = this.generateWorkflowOutputsTable(formatterAdapter, manifest);
    } else {
      throw new Error('Unsupported manifest type for OutputsSectionGenerator');
    }

    if (!manifestOutputsContent || manifestOutputsContent.length === 0) {
      return Buffer.alloc(0);
    }

    return Buffer.concat([
      formatterAdapter.heading(Buffer.from('Outputs'), 2),
      formatterAdapter.lineBreak(),
      manifestOutputsContent,
    ]);
  }

  private generateActionOutputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubAction
  ): Buffer {
    return this.generateOutputsTable(
      formatterAdapter,
      Object.entries(manifest.outputs || {})
    );
  }

  private generateWorkflowOutputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubWorkflow
  ): Buffer {
    return this.generateOutputsTable(
      formatterAdapter,
      Object.entries(manifest?.on?.workflow_call?.outputs || {})
    );
  }

  private generateOutputsTable(
    formatterAdapter: FormatterAdapter,
    outputs: [string, GitHubActionOutput | GitHubWorkflowOutput][]
  ): Buffer {
    if (outputs.length === 0) {
      return Buffer.alloc(0);
    }

    const headers = this.getHeaders(formatterAdapter);

    const rows = outputs.map(
      ([name, output]) => {
        return [
          this.getOutputName(name, formatterAdapter),
          this.getOutputDescription(output),
        ];
      }
    );

    return formatterAdapter.table(headers, rows);
  }

  private getHeaders(formatterAdapter: FormatterAdapter): Buffer[] {
    return [
      formatterAdapter.bold(Buffer.from('Output')),
      formatterAdapter.bold(Buffer.from('Description')),
    ];
  }

  private getOutputName(
    name: string,
    formatterAdapter: FormatterAdapter
  ): Buffer {
    return formatterAdapter.bold(
      formatterAdapter.inlineCode(Buffer.from(name))
    );
  }

  private getOutputDescription(output: GitHubActionOutput | GitHubWorkflowOutput): Buffer {
    return Buffer.from(output.description || '');
  }
}
