import { Repository } from "@ci-dokumentor/core";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

type Badge = { label: string; url: string; };
type LinkedBadge = { url: string; badge: Badge; };

export class BadgesSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Badges;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: Repository): Buffer {
        const linkedBadges = this.getAllBadges(manifest, repository);
        return this.formatBadgeCollection(linkedBadges, formatterAdapter);
    }

    private getAllBadges(manifest: GitHubAction | GitHubWorkflow, repository: Repository): LinkedBadge[] {
        return [
            ...this.getDistributionBadges(manifest, repository),
            ...this.getBuildQualityBadges(manifest, repository),
            ...this.getSecurityBadges(manifest, repository),
            ...this.getComplianceBadges(manifest, repository),
            ...this.getCommunityBadges(manifest, repository),
        ];
    }

    private getDistributionBadges(manifest: GitHubAction | GitHubWorkflow, repository: Repository): LinkedBadge[] {
        const actionName = manifest.name.toLowerCase().replace(/\s+/g, '-');
        const badges = [
            {
                url: `${repository.url}/releases`,
                badge: {
                    label: 'Release',
                    url: `https://img.shields.io/github/v/release/${repository.fullName}`
                }
            }
        ];

        if (this.isGitHubAction(manifest)) {
            const badgeName = `Marketplace-${actionName.replace(/-/g, '--')}`;
            badges.unshift({
                url: `https://github.com/marketplace/actions/${actionName}`,
                badge: {
                    label: 'Marketplace',
                    url: `https://img.shields.io/badge/${badgeName}-blue?logo=github-actions`
                }
            });
        }

        return badges;
    }

    private getBuildQualityBadges(_manifest: GitHubAction | GitHubWorkflow, _repository: Repository): LinkedBadge[] {
        return [];
    }

    private getSecurityBadges(_manifest: GitHubAction | GitHubWorkflow, _repository: Repository): LinkedBadge[] {
        return [];
    }

    private getComplianceBadges(manifest: GitHubAction | GitHubWorkflow, repository: Repository): LinkedBadge[] {
        return [
            {
                url: `https://img.shields.io/github/license/${repository.fullName}`,
                badge: {
                    label: 'License',
                    url: `https://img.shields.io/github/license/${repository.fullName}`
                }
            }
        ];
    }

    private getCommunityBadges(manifest: GitHubAction | GitHubWorkflow, repository: Repository): LinkedBadge[] {
        return [
            {
                url: `https://img.shields.io/github/stars/${repository.fullName}?style=social`,
                badge: {
                    label: 'Stars',
                    url: `https://img.shields.io/github/stars/${repository.fullName}?style=social`
                }
            }
        ];
    }

    private formatBadgeCollection(linkedBadges: LinkedBadge[], formatterAdapter: FormatterAdapter): Buffer {
        if (linkedBadges.length === 0) {
            return Buffer.from('');
        }

        return linkedBadges.reduce((acc, linkedBadge, index) => {
            const badgeBuffer = formatterAdapter.link(
                formatterAdapter.badge(
                    linkedBadge.badge.label,
                    linkedBadge.badge.url,
                ), linkedBadge.url);
            if (index === 0) return badgeBuffer;
            return Buffer.concat([acc, Buffer.from('\n'), badgeBuffer]);
        }, Buffer.from(''));
    }
}
