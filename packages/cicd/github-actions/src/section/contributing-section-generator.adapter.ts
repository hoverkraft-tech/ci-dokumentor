import { ReadableContent, SectionGenerationPayload } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

@injectable()
export class ContributingSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Contributing;
  }

  async generateSection({ formatterAdapter, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    const contributingInfo = await repositoryProvider.getContributing();

    if (!contributingInfo?.url) {
      return Buffer.alloc(0);
    }

    const contributingText = `Contributions are welcome! Please see the [contributing guidelines](${contributingInfo.url}) for more details.`;

    return formatterAdapter.appendContent(
      formatterAdapter.heading(Buffer.from('Contributing'), 2),
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(Buffer.from(contributingText)),
    );
  }
}
