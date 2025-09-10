import { RepositoryInfo, SectionGenerationPayload } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { icons } from 'feather-icons';
import { injectable } from 'inversify';

@injectable()
export class HeaderSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Header;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const [repositoryInfo, logo] = await Promise.all([
      repositoryProvider.getRepositoryInfo(),
      repositoryProvider.getLogo(),
    ]);

    const logoContent = this.generateLogo(
      formatterAdapter,
      manifest,
      logo
    );
    const titleContent = this.generateTitle(
      formatterAdapter,
      manifest,
      repositoryInfo
    );

    let sectionContent = titleContent;

    if (logoContent) {
      sectionContent = formatterAdapter.appendContent(
        logoContent,
        formatterAdapter.lineBreak(),
        titleContent,
      );
    }

    return formatterAdapter.center(sectionContent);
  }

  private generateLogo(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    logoPath: string | undefined
  ): Buffer | null {
    if (!logoPath) {
      return null;
    }

    const logoAltText = this.getDisplayName(manifest);
    const logoImage = formatterAdapter.image(Buffer.from(logoPath), logoAltText, {
      width: '60px',
      align: 'center',
    });

    return logoImage;
  }

  private getDisplayName(
    manifest: GitHubActionsManifest,
    repositoryInfo?: RepositoryInfo
  ): Buffer {
    const name = manifest.name || repositoryInfo?.name || 'Unknown';
    // Convert to pascal case
    return Buffer.from(name.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase()));
  }

  private generateTitle(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repositoryInfo: RepositoryInfo
  ): Buffer {
    const title = Buffer.from(
      this.getTitlePrefix(manifest) + this.getDisplayName(manifest, repositoryInfo)
    );
    const branchingIcon = this.generateBrandingIcon(formatterAdapter, manifest);

    const headingContent = branchingIcon
      ? formatterAdapter.appendContent(branchingIcon, Buffer.from(' '), title)
      : title;

    return formatterAdapter.heading(headingContent, 1);
  }

  private getTitlePrefix(manifest: GitHubActionsManifest): string {
    return 'runs' in manifest ? 'GitHub Action: ' : 'GitHub Workflow: ';
  }

  private generateBrandingIcon(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest
  ): Buffer | null {
    if (!('branding' in manifest) || !manifest.branding?.icon) {
      return null;
    }

    const icon = manifest.branding.icon as keyof typeof icons;

    const featherIcon = icons[icon]?.toSvg({
      color: manifest.branding.color || 'gray-dark',
    });
    if (!featherIcon) {
      return null;
    }

    // Get data URI for the icon
    const data = Buffer.from(`data:image/svg+xml;base64,${Buffer.from(featherIcon).toString(
      'base64'
    )}`);

    return formatterAdapter.image(data, Buffer.from('Icon'));
  }
}
