import { Repository } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';

export class LicenseSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.License;
  }

  generateSection(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repository: Repository
  ): Buffer {
    const currentYear = new Date().getFullYear();
    const authorName =
      'author' in manifest && manifest.author
        ? manifest.author
        : repository.owner;

    // Use license information from repository (fetched by GitHubRepositoryProvider with fallbacks)
    const licenseInfo = repository.license;

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

    return Buffer.concat(elements);
  }
}
