import { SectionGenerationPayload } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

@injectable()
export class ContributingSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Contributing;
  }

  async generateSection({ formatterAdapter, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const contributingInfo = await repositoryProvider.getContributing();

    if (!contributingInfo?.url) {
      return Buffer.from('');
    }

    const contributingText = `Contributions are welcome! Please see the [contributing guidelines](${contributingInfo.url}) for more details.`;

    return formatterAdapter.paragraph(Buffer.from(contributingText));
  }
}
