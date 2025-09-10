import { SectionGenerationPayload } from '@ci-dokumentor/core';
import {
  GitHubAction,
  GitHubActionInput,
  GitHubActionsManifest,
  GitHubWorkflow,
  GitHubWorkflowCallInput,
  GitHubWorkflowDispatchInput,
} from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

@injectable()
export class InputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Inputs;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    let manifestInputsContent: Buffer;
    if (this.isGitHubAction(manifest)) {
      manifestInputsContent = this.generateActionInputsTable(formatterAdapter, manifest);
    } else if (this.isGitHubWorkflow(manifest)) {
      manifestInputsContent = this.generateWorkflowInputsTable(formatterAdapter, manifest);
    } else {
      throw new Error('Unsupported manifest type for InputsSectionGenerator');
    }

    if (!manifestInputsContent || manifestInputsContent.length === 0) {
      return Buffer.alloc(0);
    }

    return formatterAdapter.appendContent(
      formatterAdapter.heading(Buffer.from('Inputs'), 2),
      formatterAdapter.lineBreak(),
      manifestInputsContent,
    );
  }

  private generateActionInputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubAction
  ): Buffer {
    const headers = [
      formatterAdapter.bold(Buffer.from('Input')),
      formatterAdapter.bold(Buffer.from('Description')),
      formatterAdapter.bold(Buffer.from('Required')),
      formatterAdapter.bold(Buffer.from('Default')),
    ];

    const rows = Object.entries(manifest.inputs || {}).map(([name, input]) => {
      return [
        this.getInputName(name, formatterAdapter),
        this.getInputDescription(input),
        this.getInputRequired(input, formatterAdapter),
        this.getInputDefault(input, formatterAdapter),
      ];
    });

    return formatterAdapter.table(headers, rows);
  }

  private generateWorkflowInputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubWorkflow
  ): Buffer {
    let content: Buffer = Buffer.alloc(0);

    const workflowDispatchInputs = Object.entries(manifest.on?.workflow_dispatch?.inputs || {});
    if (workflowDispatchInputs.length) {
      if (content.length > 0) {
        content = formatterAdapter.appendContent(
          content,
          formatterAdapter.lineBreak(),
        );
      }
      content = formatterAdapter.appendContent(
        content,
        formatterAdapter.heading(Buffer.from('Workflow Dispatch Inputs'), 3),
        formatterAdapter.lineBreak(),
        this.getWorkflowInputsTable(formatterAdapter, workflowDispatchInputs),
      );
    }

    const workflowCallInputs = Object.entries(manifest.on?.workflow_call?.inputs || {});
    if (workflowCallInputs.length) {
      if (content.length > 0) {
        content = formatterAdapter.appendContent(
          content,
          formatterAdapter.lineBreak(),
        );
      }

      content = formatterAdapter.appendContent(
        content,
        formatterAdapter.heading(Buffer.from('Workflow Call Inputs'), 3),
        formatterAdapter.lineBreak(),
        this.getWorkflowInputsTable(formatterAdapter, workflowCallInputs),
      );
    }

    return content;
  }

  private getWorkflowInputsTable(formatterAdapter: FormatterAdapter, inputs: [string, GitHubWorkflowDispatchInput | GitHubWorkflowCallInput][]): Buffer {
    const headers = [
      formatterAdapter.bold(Buffer.from('Input')),
      formatterAdapter.bold(Buffer.from('Description')),
      formatterAdapter.bold(Buffer.from('Required')),
      formatterAdapter.bold(Buffer.from('Type')),
      formatterAdapter.bold(Buffer.from('Default')),
    ];

    const rows = inputs.map(([name, input]) => {
      return [
        this.getInputName(name, formatterAdapter),
        this.getInputDescription(input),
        this.getInputRequired(input, formatterAdapter),
        this.getInputType(input, formatterAdapter),
        this.getInputDefault(input, formatterAdapter),
      ];
    });

    return formatterAdapter.table(headers, rows);
  }

  private getInputName(
    name: string,
    formatterAdapter: FormatterAdapter
  ): Buffer {

    return formatterAdapter.bold(
      formatterAdapter.inlineCode(Buffer.from(name))
    );
  }

  private getInputDescription(
    input: GitHubActionInput | GitHubWorkflowDispatchInput | GitHubWorkflowCallInput
  ): Buffer {
    let description = (input.description || '').trim();

    const deprecationMessage = this.getInputDeprecationMessage(input);
    if (deprecationMessage) {
      if (description) {
        description += ' - ';
      }
      description = [description, `**Deprecated:** ${deprecationMessage}`]
        .map((line) => line.trim())
        .filter(Boolean).join(' - ');
    }

    if ((input as GitHubWorkflowDispatchInput).options) {
      const options = (input as GitHubWorkflowDispatchInput).options;
      if (options && options.length > 0) {


        description = [
          description,
          `Options: ${options
            .map((option) => `\`${option}\``)
            .join(', ')}`]
          .map((line) => line.trim()).filter(Boolean).join('\n');
      }
    }

    return Buffer.from(description);
  }

  private getInputDefault(
    input: GitHubActionInput | GitHubWorkflowDispatchInput | GitHubWorkflowCallInput,
    formatterAdapter: FormatterAdapter
  ): Buffer {
    return formatterAdapter.inlineCode(Buffer.from(input.default || ''));
  }

  private getInputRequired(
    input: GitHubActionInput | GitHubWorkflowDispatchInput | GitHubWorkflowCallInput,
    formatterAdapter: FormatterAdapter
  ): Buffer {
    return formatterAdapter.bold(
      Buffer.from(input.required ? 'true' : 'false')
    );
  }

  private getInputType(
    input: GitHubWorkflowDispatchInput | GitHubWorkflowCallInput,
    formatterAdapter: FormatterAdapter
  ): Buffer {
    return formatterAdapter.bold(Buffer.from(input.type));
  }

  private getInputDeprecationMessage(
    input: GitHubActionInput | GitHubWorkflowDispatchInput | GitHubWorkflowCallInput
  ): string | null {
    return (input as GitHubWorkflowDispatchInput).deprecationMessage || null;
  }
}
