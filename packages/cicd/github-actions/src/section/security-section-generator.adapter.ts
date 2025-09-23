import { SectionIdentifier, ReadableContent } from '@ci-dokumentor/core';
import type { SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class SecuritySectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Security;
  }

  async generateSection({ formatterAdapter, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
    const securityInfo = await repositoryProvider.getSecurity();

    if (!securityInfo?.url) {
      return ReadableContent.empty();
    }

    const securityText = `We take security seriously. Please see our [security policy](${securityInfo.url}) for information on how to report security vulnerabilities.`;

    return formatterAdapter.heading(new ReadableContent('Security'), 2).append(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(new ReadableContent(securityText)),
    );
  }
}