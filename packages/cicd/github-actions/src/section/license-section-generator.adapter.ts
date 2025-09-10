import { SectionGenerationPayload } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

@injectable()
export class LicenseSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.License;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const currentYear = new Date().getFullYear();

    const [repositoryInfo, licenseInfo] = await Promise.all([
      repositoryProvider.getRepositoryInfo(),
      repositoryProvider.getLicense(),
    ]);

    const authorName =
      'author' in manifest && manifest.author
        ? manifest.author
        : repositoryInfo.owner;

    // Only generate license section if license information is available
    if (!licenseInfo) {
      return Buffer.alloc(0); // Return empty buffer if no license info
    }

    // Generate license section
    const licenseText = `This project is licensed under the ${licenseInfo.name}.`;

    const spdxText = licenseInfo.spdxId
      ? `SPDX-License-Identifier: ${licenseInfo.spdxId}`
      : '';

    const licenseLink = licenseInfo.url
      ? `For more details, see the [license](${licenseInfo.url}).`
      : '';

    const elements = [
      formatterAdapter.heading(Buffer.from('License'), 2),
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(Buffer.from(licenseText)),
    ];

    if (spdxText) {
      elements.push(
        formatterAdapter.lineBreak(),
        formatterAdapter.paragraph(Buffer.from(spdxText)),
      );
    }

    elements.push(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(
        Buffer.from(`Copyright © ${currentYear} ${authorName}`)
      ),
    );

    if (licenseLink) {
      elements.push(
        formatterAdapter.lineBreak(),
        formatterAdapter.paragraph(Buffer.from(licenseLink))
      );
    }

    return formatterAdapter.appendContent(...elements);
  }
}
