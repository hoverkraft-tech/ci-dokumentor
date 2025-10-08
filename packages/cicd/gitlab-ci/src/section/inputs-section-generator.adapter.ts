import { InputsSectionMixin, FormatterAdapter, ReadableContent } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest, GitLabComponentInput } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class InputsSectionGenerator extends InputsSectionMixin<GitLabCIManifest, typeof GitLabCISectionGeneratorAdapter>(GitLabCISectionGeneratorAdapter) {
  public override async generateInputsContent(
    formatterAdapter: FormatterAdapter,
    manifest: GitLabCIManifest
  ): Promise<ReadableContent> {
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

    return this.generateInputsTable(formatterAdapter, inputs);
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
        this.formatInputName(name, formatterAdapter),
        this.formatInputDescription(input.description, formatterAdapter),
        this.formatInputRequired(input.required, formatterAdapter),
        this.formatInputType(input.type, formatterAdapter),
        this.formatInputDefault(input.default, formatterAdapter),
      ];
    });

    return formatterAdapter.table(headers, rows);
  }
}