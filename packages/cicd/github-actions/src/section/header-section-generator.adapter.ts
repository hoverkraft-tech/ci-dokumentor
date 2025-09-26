import { relative, dirname } from 'node:path';
import { FormatterAdapter, SectionIdentifier, ReadableContent, RepositoryInfo, SectionGenerationPayload } from '@ci-dokumentor/core';
import { icons } from 'feather-icons';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class HeaderSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Header;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider, destination }: SectionGenerationPayload<GitHubActionsManifest>): Promise<ReadableContent> {
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
      // Ensure the heading (H1) is the very first content in the file so
      // markdown linters (MD041) treat the first line as a top-level heading.
      // Place the centered logo after the heading separated by a line break,
      // and add a horizontal rule after the logo for visual separation.
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

  private generateLogo(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    logoPath: string | undefined,
    destination: string
  ): ReadableContent {
    if (!logoPath) {
      return ReadableContent.empty();
    }

    // Calculate relative path for file:// URLs
    let resolvedLogoPath = logoPath;
    if (logoPath.startsWith('file://')) {
      const filePath = logoPath.replace(/^file:\/\//, '');
      const destinationDir = dirname(destination);
      resolvedLogoPath = relative(destinationDir, filePath);
    }

    const logoAltText = this.getDisplayName(manifest);
    const logoImage = formatterAdapter.image(new ReadableContent(resolvedLogoPath), logoAltText, {
      width: '60px',
      align: 'center',
    });

    return formatterAdapter.center(logoImage);
  }

  private getDisplayName(
    manifest: GitHubActionsManifest,
    repositoryInfo?: RepositoryInfo
  ): ReadableContent {
    const name = manifest.name || repositoryInfo?.name || 'Unknown';
    // Convert to pascal case
    return new ReadableContent(name.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase()));
  }

  private generateTitle(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repositoryInfo: RepositoryInfo
  ): ReadableContent {
    const title = this.getTitlePrefix(manifest).append(this.getDisplayName(manifest, repositoryInfo));
    const branchingIcon = this.generateBrandingIcon(formatterAdapter, manifest);

    const headingContent = branchingIcon.isEmpty()
      ? title
      : branchingIcon.append(' ', title);

    return formatterAdapter.heading(headingContent, 1);
  }

  private getTitlePrefix(manifest: GitHubActionsManifest): ReadableContent {
    let title;

    switch (true) {
      case this.isGitHubAction(manifest):
        title = 'GitHub Action';
        break;
      case this.isGitHubWorkflow(manifest):
        if (manifest.on.workflow_call) {
          title = 'GitHub Reusable Workflow';
          break;
        }
        title = 'GitHub Workflow';
        break;
    }
    return new ReadableContent(`${title ? title + ': ' : ''}`);
  }

  private generateBrandingIcon(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest
  ): ReadableContent {
    if (!('branding' in manifest) || !manifest.branding?.icon) {
      return ReadableContent.empty();
    }

    const icon = manifest.branding.icon as keyof typeof icons;

    const featherIcon = icons[icon]?.toSvg({
      color: manifest.branding.color || 'gray-dark',
    });
    if (!featherIcon) {
      return ReadableContent.empty();
    }

    // Get data URI for the icon
    const data = new ReadableContent(`data:image/svg+xml;base64,${Buffer.from(featherIcon).toString(
      'base64'
    )}`);

    return formatterAdapter.image(data, new ReadableContent('Icon'));
  }
}
