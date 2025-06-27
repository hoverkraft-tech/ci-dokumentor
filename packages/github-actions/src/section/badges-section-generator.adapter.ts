import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

type Badge = { label: string; url: string; };
type LinkedBadge = { url: string; badge: Badge; };

export class BadgesSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Badges;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        if (!this.isGitHubAction(manifest)) {
            return Buffer.from('');
        }

        const linkedBadges = this.getAllBadges(manifest);
        return this.formatBadgeCollection(linkedBadges, formatterAdapter);
    }

    private isGitHubAction(manifest: GitHubAction | GitHubWorkflow): boolean {
        return 'runs' in manifest;
    }

    private getAllBadges(manifest: GitHubAction | GitHubWorkflow): LinkedBadge[] {
        return [
            this.getReleaseBadge(manifest),
            this.getReleaseDateBadge(manifest),
            this.getLastCommitBadge(manifest),
            this.getOpenIssuesBadge(manifest),
            this.getDownloadsBadge(manifest)
        ];
    }

    private getReleaseBadge(manifest: GitHubAction | GitHubWorkflow): LinkedBadge {
        const badgeUrl = 'https://img.shields.io/github/v/release/{owner}/{repo}?display_name=tag&sort=semver&logo=github&style=flat-square';
        const releaseUrl = 'https://github.com/{owner}/{repo}/releases/latest';

        return { url: badgeUrl, badge: { label: 'Release', message: 'Latest Release', color: 'blue' } };
    }

    private getReleaseDateBadge(manifest: GitHubAction | GitHubWorkflow): LinkedBadge {
        const badgeUrl = 'https://img.shields.io/github/release-date/{owner}/{repo}?display_name=tag&sort=semver&logo=github&style=flat-square';
        const releaseUrl = 'https://github.com/{owner}/{repo}/releases/latest';

        return { url: badgeUrl, badge: { label: 'Release by date', message: 'Latest Release Date', color: 'blue' } };
    }

    private getLastCommitBadge(manifest: GitHubAction | GitHubWorkflow): LinkedBadge {
        const badgeUrl = 'https://img.shields.io/github/last-commit/{owner}/{repo}?logo=github&style=flat-square';

        return { url: badgeUrl, badge: { label: 'Last Commit', message: 'Latest Commit', color: 'blue' } };
    }

    private getOpenIssuesBadge(manifest: GitHubAction | GitHubWorkflow): LinkedBadge {
        const badgeUrl = 'https://img.shields.io/github/issues/{owner}/{repo}?logo=github&style=flat-square';
        const issuesUrl = 'https://github.com/{owner}/{repo}/issues';

        return { url: badgeUrl, badge: { label: 'Open Issues', message: 'Open Issues', color: 'blue' } };
    }

    private getDownloadsBadge(manifest: GitHubAction | GitHubWorkflow): LinkedBadge {
        const badgeUrl = 'https://img.shields.io/github/downloads/{owner}/{repo}/total?logo=github&style=flat-square';

        return { url: badgeUrl, badge: { label: 'Downloads', message: 'Total Downloads', color: 'blue' } };
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
            return Buffer.concat([acc, badgeBuffer, Buffer.from(' ')]);
        }, Buffer.from(''));
    }
}
