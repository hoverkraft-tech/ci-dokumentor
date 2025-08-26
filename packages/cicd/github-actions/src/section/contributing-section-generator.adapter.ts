import { Repository } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';

export class ContributingSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Contributing;
  }

  generateSection(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repository: Repository
  ): Buffer {
    if (!repository?.contributing?.url) {
      return Buffer.from('');
    }

    const contributingText = `Contributions are welcome! Please see the [contributing guidelines](${repository.contributing.url}) for more details.`;

    return formatterAdapter.paragraph(Buffer.from(contributingText));
  }
}
