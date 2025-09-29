import { relative, dirname } from 'node:path';
import { FormatterAdapter, SectionIdentifier, ReadableContent, RepositoryInfo, SectionGenerationPayload } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import { GitLabCIManifest } from '../gitlab-ci-parser.js';
import { GitLabCISectionGeneratorAdapter } from './gitlab-ci-section-generator.adapter.js';

@injectable()
export class HeaderSectionGenerator extends GitLabCISectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Header;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider, destination }: SectionGenerationPayload<GitLabCIManifest>): Promise<ReadableContent> {
    const [repositoryInfo, logo] = await Promise.all([
      repositoryProvider.getRepositoryInfo(),
      repositoryProvider.getLogo(),
    ]);

    let sectionContent = this.generateTitle(
      formatterAdapter,
      manifest,
      repositoryInfo
    );

    const logoContent = this.generateLogo(
      formatterAdapter,
      manifest,
      logo,
      destination
    );

    if (!logoContent.isEmpty()) {
      sectionContent = sectionContent.append(
        formatterAdapter.lineBreak(),
        logoContent,
        formatterAdapter.lineBreak(),
        formatterAdapter.horizontalRule(),
        formatterAdapter.lineBreak(),
      );
    }

    return sectionContent;
  }

  private generateTitle(
    formatterAdapter: FormatterAdapter,
    manifest: GitLabCIManifest,
    repositoryInfo: RepositoryInfo
  ): ReadableContent {
    return formatterAdapter.heading(
      new ReadableContent(manifest.name),
      1
    );
  }

  private generateLogo(
    formatterAdapter: FormatterAdapter,
    manifest: GitLabCIManifest,
    logo: string | undefined,
    destination: string | undefined
  ): ReadableContent {
    if (!logo) {
      return ReadableContent.empty();
    }

    let logoUrl = logo;

    // Handle file:// URLs by converting them to relative paths
    if (logo.startsWith('file://')) {
      const logoPath = logo.slice(7); // Remove 'file://' prefix
      if (destination) {
        logoUrl = relative(dirname(destination), logoPath);
      } else {
        logoUrl = logoPath;
      }
    }

    const logoImage = formatterAdapter.image(
      new ReadableContent(logoUrl),
      new ReadableContent(manifest.name),
      { width: '200px', align: 'center' }
    );

    return formatterAdapter.center(logoImage);
  }
}