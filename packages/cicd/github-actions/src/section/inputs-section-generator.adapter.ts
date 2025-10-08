import { AbstractInputsSectionGenerator, FormatterAdapter, ReadableContent, SectionIdentifier, SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import {
  GitHubAction,
  GitHubActionInput,
  GitHubActionsManifest,
  GitHubWorkflow,
  GitHubWorkflowCallInput,
  GitHubWorkflowDispatchInput,
} from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

const abstractHelper = new AbstractInputsSectionGenerator();

@injectable()
export class InputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return abstractHelper.getSectionIdentifier();
  }

  async generateSection(payload: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    return abstractHelper.generateSection.call(this, payload);
  }

  protected async generateInputsContent(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest
  ): Promise<ReadableContent> {
    if (this.isGitHubAction(manifest)) {
      return this.generateActionInputsTable(formatterAdapter, manifest);
    } else if (this.isGitHubWorkflow(manifest)) {
      return this.generateWorkflowInputsTable(formatterAdapter, manifest);
    }
    throw new Error('Unsupported manifest type for InputsSectionGenerator');
  }

  private generateActionInputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubAction
  ): ReadableContent {
    const headers = [
      formatterAdapter.bold(new ReadableContent('Input')),
      formatterAdapter.bold(new ReadableContent('Description')),
      formatterAdapter.bold(new ReadableContent('Required')),
      formatterAdapter.bold(new ReadableContent('Default')),
    ];

    const rows = Object.entries(manifest.inputs || {}).map(([name, input]) => {
      return [
        abstractHelper.formatInputName(name, formatterAdapter),
        this.getInputDescription(input, formatterAdapter),
        abstractHelper.formatInputRequired(input.required, formatterAdapter),
        abstractHelper.formatInputDefault(input.default, formatterAdapter),
      ];
    });

    return formatterAdapter.table(headers, rows);
  }

  private generateWorkflowInputsTable(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubWorkflow
  ): ReadableContent {
    let content: ReadableContent = ReadableContent.empty();

    const workflowDispatchInputs = Object.entries(manifest.on?.workflow_dispatch?.inputs || {});
    if (workflowDispatchInputs.length) {
      if (!content.isEmpty()) {
        content = content.append(
          formatterAdapter.lineBreak(),
        );
      }
      content = content.append(
        formatterAdapter.heading(new ReadableContent('Workflow Dispatch Inputs'), 3),
        formatterAdapter.lineBreak(),
        this.getWorkflowInputsTable(formatterAdapter, workflowDispatchInputs),
      );
    }

    const workflowCallInputs = Object.entries(manifest.on?.workflow_call?.inputs || {});
    if (workflowCallInputs.length) {
      if (!content.isEmpty()) {
        content = content.append(
          formatterAdapter.lineBreak(),
        );
      }

      content = content.append(
        formatterAdapter.heading(new ReadableContent('Workflow Call Inputs'), 3),
        formatterAdapter.lineBreak(),
        this.getWorkflowInputsTable(formatterAdapter, workflowCallInputs),
      );
    }

    return content;
  }

  private getWorkflowInputsTable(formatterAdapter: FormatterAdapter, inputs: [string, GitHubWorkflowDispatchInput | GitHubWorkflowCallInput][]): ReadableContent {
    const headers = [
      formatterAdapter.bold(new ReadableContent('Input')),
      formatterAdapter.bold(new ReadableContent('Description')),
      formatterAdapter.bold(new ReadableContent('Required')),
      formatterAdapter.bold(new ReadableContent('Type')),
      formatterAdapter.bold(new ReadableContent('Default')),
    ];

    const rows = inputs.map(([name, input]) => {
      return [
        abstractHelper.formatInputName(name, formatterAdapter),
        this.getInputDescription(input, formatterAdapter),
        abstractHelper.formatInputRequired(input.required, formatterAdapter),
        abstractHelper.formatInputType(input.type, formatterAdapter),
        abstractHelper.formatInputDefault(input.default, formatterAdapter),
      ];
    });

    return formatterAdapter.table(headers, rows);
  }

  private getInputDescription(
    input: GitHubActionInput | GitHubWorkflowDispatchInput | GitHubWorkflowCallInput,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    let description = abstractHelper.formatInputDescription(input.description, formatterAdapter);

    const deprecationMessage = this.getInputDeprecationMessage(input);
    if (deprecationMessage) {
      if (!description.isEmpty()) {
        description = description.append(' - ');
      }
      description = ReadableContent.empty().append(
        ...[
          description,
          formatterAdapter.bold(new ReadableContent("Deprecated:")).append(deprecationMessage)
        ]
          .map((line) => line.trim())
          .filter(line => !line.isEmpty())
      );
    }

    if ((input as GitHubWorkflowDispatchInput).options) {
      const options = (input as GitHubWorkflowDispatchInput).options;
      if (options && options.length > 0) {
        const optionsContent = ReadableContent.empty();
        for (const option of options) {
          if (!optionsContent.isEmpty()) {
            optionsContent.append(formatterAdapter.lineBreak());
          }
          optionsContent.append(formatterAdapter.inlineCode(new ReadableContent(option)));
        }

        if (!optionsContent.isEmpty()) {
          description = description.append(formatterAdapter.lineBreak(), optionsContent);
        }
      }
    }

    return description;
  }

  private getInputDeprecationMessage(
    input: GitHubActionInput | GitHubWorkflowDispatchInput | GitHubWorkflowCallInput
  ): string | null {
    return (input as GitHubWorkflowDispatchInput).deprecationMessage || null;
  }
}
