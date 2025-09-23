import { ReadableContent, SectionGenerationPayload , FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import {
  GitHubAction,
  GitHubActionOutput,
  GitHubActionsManifest,
  GitHubWorkflow,
  GitHubWorkflowOutput,
} from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class OutputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Outputs;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    let manifestOutputsContent: ReadableContent;
    if (this.isGitHubAction(manifest)) {
      manifestOutputsContent = this.generateActionOutputsTable(formatterAdapter, manifest);
    } else if (this.isGitHubWorkflow(manifest)) {
      manifestOutputsContent = this.generateWorkflowOutputsTable(formatterAdapter, manifest);
    } else {
      throw new Error('Unsupported manifest type for OutputsSectionGenerator');
    }

    if (manifestOutputsContent.isEmpty()) {
      return ReadableContent.empty();
    }

    return formatterAdapter.heading(new ReadableContent('Outputs'), 2).append(
      formatterAdapter.lineBreak(),
      manifestOutputsContent,
    );
  }

  private generateActionOutputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubAction
  ): ReadableContent {
    return this.generateOutputsTable(
      formatterAdapter,
      Object.entries(manifest.outputs || {})
    );
  }

  private generateWorkflowOutputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubWorkflow
  ): ReadableContent {
    return this.generateOutputsTable(
      formatterAdapter,
      Object.entries(manifest?.on?.workflow_call?.outputs || {})
    );
  }

  private generateOutputsTable(
    formatterAdapter: FormatterAdapter,
    outputs: [string, GitHubActionOutput | GitHubWorkflowOutput][]
  ): ReadableContent {
    if (outputs.length === 0) {
      return ReadableContent.empty();
    }

    const headers = this.getHeaders(formatterAdapter);

    const rows = outputs.map(
      ([name, output]) => {
        return [
          this.getOutputName(name, formatterAdapter),
          this.getOutputDescription(output, formatterAdapter),
        ];
      }
    );

    return formatterAdapter.table(headers, rows);
  }

  private getHeaders(formatterAdapter: FormatterAdapter): ReadableContent[] {
    return [
      formatterAdapter.bold(new ReadableContent('Output')),
      formatterAdapter.bold(new ReadableContent('Description')),
    ];
  }

  private getOutputName(
    name: string,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(
      formatterAdapter.inlineCode(new ReadableContent(name))
    );
  }

  private getOutputDescription(output: GitHubActionOutput | GitHubWorkflowOutput, formatterAdapter: FormatterAdapter): ReadableContent {
    return formatterAdapter.paragraph(new ReadableContent((output.description || '').trim()));
  }
}
