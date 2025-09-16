import { SectionGenerationPayload } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

@injectable()
export class SecuritySectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Security;
  }

  async generateSection({ formatterAdapter, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const securityInfo = await repositoryProvider.getSecurity();

    if (!securityInfo?.url) {
      return Buffer.alloc(0);
    }

    const securityText = `We take security seriously. Please see our [security policy](${securityInfo.url}) for information on how to report security vulnerabilities.`;

    return formatterAdapter.appendContent(
      formatterAdapter.heading(Buffer.from('Security'), 2),
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(Buffer.from(securityText)),
    );
  }
}