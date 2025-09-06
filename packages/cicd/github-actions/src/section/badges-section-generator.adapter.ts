import { RepositoryInfo, SectionGenerationPayload } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

type Badge = { label: string; url: string };
type LinkedBadge = { url: string; badge: Badge };

@injectable()
export class BadgesSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Badges;
  }

  async generateSection({ formatterAdapter, manifest, repositoryProvider }: SectionGenerationPayload<GitHubActionsManifest>): Promise<Buffer> {
    const repositoryInfo = await repositoryProvider.getRepositoryInfo();

    const linkedBadges = this.getAllBadges(manifest, repositoryInfo);
    return this.formatBadgeCollection(linkedBadges, formatterAdapter);
  }

  private getAllBadges(
    manifest: GitHubActionsManifest,
    repositoryInfo: RepositoryInfo
  ): LinkedBadge[] {
    return [
      ...this.getDistributionBadges(manifest, repositoryInfo),
      ...this.getComplianceBadges(repositoryInfo),
      ...this.getCommunityBadges(repositoryInfo),
    ];
  }

  private getDistributionBadges(
    manifest: GitHubActionsManifest,
    repositoryInfo: RepositoryInfo
  ): LinkedBadge[] {
    const actionName = manifest.name.toLowerCase().replace(/\s+/g, '-');
    const badges = [
      {
        url: `${repositoryInfo.url}/releases`,
        badge: {
          label: 'Release',
          url: `https://img.shields.io/github/v/release/${repositoryInfo.fullName}`,
        },
      },
    ];

    if (this.isGitHubAction(manifest)) {
      const badgeName = `Marketplace-${actionName.replace(/-/g, '--')}`;
      badges.unshift({
        url: `https://github.com/marketplace/actions/${actionName}`,
        badge: {
          label: 'Marketplace',
          url: `https://img.shields.io/badge/${badgeName}-blue?logo=github-actions`,
        },
      });
    }

    return badges;
  }
  private getComplianceBadges(
    repositoryInfo: RepositoryInfo
  ): LinkedBadge[] {
    return [
      {
        url: `https://img.shields.io/github/license/${repositoryInfo.fullName}`,
        badge: {
          label: 'License',
          url: `https://img.shields.io/github/license/${repositoryInfo.fullName}`,
        },
      },
    ];
  }

  private getCommunityBadges(
    repositoryInfo: RepositoryInfo
  ): LinkedBadge[] {
    return [
      {
        url: `https://img.shields.io/github/stars/${repositoryInfo.fullName}?style=social`,
        badge: {
          label: 'Stars',
          url: `https://img.shields.io/github/stars/${repositoryInfo.fullName}?style=social`,
        },
      },
    ];
  }

  private formatBadgeCollection(
    linkedBadges: LinkedBadge[],
    formatterAdapter: FormatterAdapter
  ): Buffer {
    if (linkedBadges.length === 0) {
      return Buffer.from('');
    }

    const badgeCollectionContent = linkedBadges.map((linkedBadge) => {
      const badgeBuffer = formatterAdapter.link(
        formatterAdapter.badge(Buffer.from(linkedBadge.badge.label), Buffer.from(linkedBadge.badge.url)),
        Buffer.from(linkedBadge.url)
      );
      return [badgeBuffer, formatterAdapter.lineBreak()];
    }).flat();

    return Buffer.concat(badgeCollectionContent);
  }
}
