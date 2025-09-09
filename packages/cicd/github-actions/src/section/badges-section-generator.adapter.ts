import { RepositoryInfo, SectionGenerationPayload, SectionGeneratorAdapter, SectionOptions } from '@ci-dokumentor/core';
import { GitHubActionsManifest } from '../github-actions-parser.js';
import { GitHubActionsSectionGeneratorAdapter } from './github-actions-section-generator.adapter.js';
import { FormatterAdapter, SectionIdentifier } from '@ci-dokumentor/core';
import { injectable } from 'inversify';

type Badge = { label: string; url: string };
type LinkedBadge = { url: string; badge: Badge };

export interface BadgesSectionOptions extends SectionOptions {
  extraBadges?: string;
}

@injectable()
export class BadgesSectionGenerator extends GitHubActionsSectionGeneratorAdapter implements SectionGeneratorAdapter<GitHubActionsManifest, BadgesSectionOptions> {
  private extraBadges?: LinkedBadge[];
  getSectionIdentifier(): SectionIdentifier {
    return SectionIdentifier.Badges;
  }

  override getSectionOptions() {
    return {
      extraBadges: {
        flags: '--extra-badges <badges>',
        description: 'Additional badges to include as JSON array of objects with label, url, and linkUrl properties',
      },
    };
  }

  override setSectionOptions({ extraBadges }: Partial<BadgesSectionOptions>): void {
    if (extraBadges) {
      try {
        const parsed = JSON.parse(extraBadges);
        if (Array.isArray(parsed)) {
          this.extraBadges = parsed.map(badge => {
            // Determine the badge image URL (shields.io URL)
            const badgeImageUrl = badge.badgeUrl || badge.url;
            // Determine the link URL (where clicking the badge should go)
            const linkUrl = badge.linkUrl || badge.url;
            
            return {
              url: linkUrl,
              badge: {
                label: badge.label,
                url: badgeImageUrl,
              },
            };
          });
        }
      } catch (error) {
        // If JSON parsing fails, ignore the extra badges and continue
        this.extraBadges = undefined;
      }
    }
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
    const badges = [
      ...this.getDistributionBadges(manifest, repositoryInfo),
      ...this.getComplianceBadges(repositoryInfo),
      ...this.getCommunityBadges(repositoryInfo),
    ];
    
    // Add extra badges if provided
    if (this.extraBadges && this.extraBadges.length > 0) {
      badges.push(...this.extraBadges);
    }
    
    return badges;
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
