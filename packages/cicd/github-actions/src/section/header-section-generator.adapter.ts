import { Repository } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { icons } from 'feather-icons';

export class HeaderSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Header;
  }

  generateSection(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repository: Repository
  ): Buffer {
    const logoContent = this.generateLogo(
      formatterAdapter,
      manifest,
      repository
    );
    const titleContent = this.generateTitle(
      formatterAdapter,
      manifest,
      repository
    );

    let sectionContent = titleContent;

    if (logoContent) {
      sectionContent = Buffer.concat([
        logoContent,
        formatterAdapter.lineBreak(),
        titleContent,
      ]);
    }

    return formatterAdapter.center(sectionContent);
  }

  private generateLogo(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repository: Repository
  ): Buffer | null {
    const logoPath = repository.logo;
    if (!logoPath) {
      return null;
    }

    const logoAltText = this.getDisplayName(manifest, repository);
    const logoImage = formatterAdapter.image(Buffer.from(logoPath), logoAltText, {
      width: '60px',
      align: 'center',
    });

    return logoImage;
  }

  private getDisplayName(
    manifest: GitHubActionsManifest,
    repository: Repository
  ): Buffer {
    const name = manifest.name || repository.name;
    // Convert to pascal case
    return Buffer.from(name.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase()));
  }

  private generateTitle(
    formatterAdapter: FormatterAdapter,
    manifest: GitHubActionsManifest,
    repository: Repository
  ): Buffer {
    const title = Buffer.from(
      this.getTitlePrefix(manifest) + this.getDisplayName(manifest, repository)
    );
    const branchingIcon = this.generateBrandingIcon(formatterAdapter, manifest);

    const headingContent = branchingIcon
      ? Buffer.concat([branchingIcon, Buffer.from(' '), title])
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
