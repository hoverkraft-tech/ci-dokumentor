import { ReadableContent, SectionGenerationPayload , SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class ContributingSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Contributing;
  }

  async generateSection({ formatterAdapter, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    const contributingInfo = await repositoryProvider.getContributing();

    if (!contributingInfo?.url) {
      return ReadableContent.empty();
    }

    const contributingText = `Contributions are welcome! Please see the [contributing guidelines](${contributingInfo.url}) for more details.`;

    return formatterAdapter.heading(new ReadableContent('Contributing'), 2).append(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(new ReadableContent(contributingText)),
    );
  }
}
