import { HeaderSectionMixin, FormatterAdapter, ReadableContent, RepositoryInfo } from '@ci-dokumentor/core';
import { icons } from 'feather-icons';
import { injectable } from 'inversify';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';

@injectable()
export class HeaderSectionGenerator extends HeaderSectionMixin<GitHubActionsManifest, typeof GitHubActionsSectionGeneratorAdapter>(GitHubActionsSectionGeneratorAdapter) {
  public override generateTitle(
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

  public override getLogoAltText(manifest: GitHubActionsManifest): ReadableContent {
    return this.getDisplayName(manifest);
  }

  private getDisplayName(
    manifest: GitHubActionsManifest,
    repositoryInfo?: RepositoryInfo
  ): ReadableContent {
    const name = manifest.name || repositoryInfo?.name || 'Unknown';
    // Convert to pascal case
    return new ReadableContent(name.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase()));
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
