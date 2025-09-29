import { SectionIdentifier, ReadableContent, SectionGenerationPayload, FormatterAdapter } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest, GitLabComponentInput } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class InputsSectionGenerator extends GitLabCISectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Inputs;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent> {
    let inputs: Record<string, GitLabComponentInput> | undefined;

    if (this.isGitLabComponent(manifest)) {
      inputs = manifest.spec?.inputs || manifest.inputs;
    } else {
      // For GitLab CI pipelines or any other type, just return empty
      return ReadableContent.empty();
    }

    if (!inputs || Object.keys(inputs).length === 0) {
      return ReadableContent.empty();
    }

    const inputsContent = this.generateInputsTable(formatterAdapter, inputs);

    if (inputsContent.isEmpty()) {
      return ReadableContent.empty();
    }

    return formatterAdapter.heading(new ReadableContent('Inputs'), 2).append(
      formatterAdapter.lineBreak(),
      inputsContent,
    );
  }

  private generateInputsTable(
    formatterAdapter: FormatterAdapter,
    inputs: Record<string, GitLabComponentInput>
  ): ReadableContent {
    const headers = [
      formatterAdapter.bold(new ReadableContent('Input')),
      formatterAdapter.bold(new ReadableContent('Description')),
      formatterAdapter.bold(new ReadableContent('Required')),
      formatterAdapter.bold(new ReadableContent('Type')),
      formatterAdapter.bold(new ReadableContent('Default')),
    ];

    const rows = Object.entries(inputs).map(([name, input]) => {
      return [
        this.getInputName(name, formatterAdapter),
        this.getInputDescription(input, formatterAdapter),
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
  ): ReadableContent {
    return formatterAdapter.bold(
      formatterAdapter.inlineCode(new ReadableContent(name))
    );
  }

  private getInputDescription(
    input: GitLabComponentInput,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    const description = new ReadableContent((input.description || '').trim());
    if (!description.isEmpty()) {
      return formatterAdapter.paragraph(description);
    }
    return description;
  }

  private getInputDefault(
    input: GitLabComponentInput,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return input.default
      ? formatterAdapter.inlineCode(new ReadableContent(input.default))
      : new ReadableContent('-');
  }

  private getInputRequired(
    input: GitLabComponentInput,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(
      new ReadableContent(input.required ? 'true' : 'false')
    );
  }

  private getInputType(
    input: GitLabComponentInput,
    formatterAdapter: FormatterAdapter
  ): ReadableContent {
    return formatterAdapter.bold(new ReadableContent(input.type ?? 'string'));
  }
}