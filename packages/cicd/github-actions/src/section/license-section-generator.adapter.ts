import { ReadableContent, SectionIdentifier } from '@ci-dokumentor/core';
import type { SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class LicenseSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.License;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
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
      return ReadableContent.empty(); // Return empty buffer if no license info
    }

    // Generate license section
    const licenseText = `This project is licensed under the ${licenseInfo.name}.`;

    const spdxText = licenseInfo.spdxId
      ? `SPDX-License-Identifier: ${licenseInfo.spdxId}`
      : '';

    const licenseLink = licenseInfo.url
      ? `For more details, see the [license](${licenseInfo.url}).`
      : '';

    let licenceContent = formatterAdapter.heading(new ReadableContent('License'), 2).append(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(new ReadableContent(licenseText)),
    );

    if (spdxText) {
      licenceContent = licenceContent.append(
        formatterAdapter.lineBreak(),
        formatterAdapter.paragraph(new ReadableContent(spdxText)),
      );
    }

    licenceContent = licenceContent.append(
      formatterAdapter.lineBreak(),
      formatterAdapter.paragraph(
        new ReadableContent(`Copyright © ${currentYear} ${authorName}`)
      ),
    );

    if (licenseLink) {
      licenceContent = licenceContent.append(
        formatterAdapter.lineBreak(),
        formatterAdapter.paragraph(new ReadableContent(licenseLink))
      );
    }

    return licenceContent;
  }
}
