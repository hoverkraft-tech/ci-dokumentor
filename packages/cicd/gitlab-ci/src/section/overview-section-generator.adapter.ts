import { AbstractOverviewSectionGenerator, ReadableContent, SectionIdentifier, SectionGenerationPayload, FormatterAdapter } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class OverviewSectionGenerator extends GitLabCISectionGeneratorAdapter {
  private helper = new AbstractOverviewSectionGenerator<GitLabCIManifest>();

  getSectionIdentifier(): SectionIdentifier {
    return this.helper.getSectionIdentifier();
  }

  async generateSection(payload: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent> {
    // Call the abstract helper's generateSection but bind it to this instance
    const description = this.getDescription(payload.manifest);
    if (!description) {
      return ReadableContent.empty();
    }

    let overviewContent = payload.formatterAdapter.heading(new ReadableContent('Overview'), 2).append(
      payload.formatterAdapter.lineBreak(),
      payload.formatterAdapter.paragraph(new ReadableContent(description).trim()),
    );

    // Allow platform-specific implementations to add additional content
    const additionalContent = await this.generateAdditionalContent(payload.formatterAdapter, payload.manifest);
    if (!additionalContent.isEmpty()) {
      overviewContent = overviewContent.append(
        payload.formatterAdapter.lineBreak(),
        additionalContent,
      );
    }

    return overviewContent;
  }

  protected getDescription(manifest: GitLabCIManifest): string | undefined {
    return 'description' in manifest ? manifest.description : undefined;
  }

  protected generateAdditionalContent(
    _formatterAdapter: FormatterAdapter,
    _manifest: GitLabCIManifest
  ): Promise<ReadableContent> {
    return Promise.resolve(ReadableContent.empty());
  }
}