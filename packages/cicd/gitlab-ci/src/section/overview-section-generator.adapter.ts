import { SectionIdentifier, ReadableContent, SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class OverviewSectionGenerator extends GitLabCISectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Overview;
  }

  async generateSection({ formatterAdapter, manifest }: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent> {
    const description =
      'description' in manifest ? manifest.description : undefined;
    if (!description) {
      return ReadableContent.empty();
    }

    const overviewContent = formatterAdapter.heading(new ReadableContent('Overview'), 2).append(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(new ReadableContent(description).trim()),
    );

    return overviewContent;
  }
}