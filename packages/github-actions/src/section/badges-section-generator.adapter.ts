import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class BadgesSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Badges;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        const badges = this.getBadges(manifest);

        if (badges.length === 0) {
            return Buffer.from('');
        }

        const badgeContent = badges.map(badge => formatterAdapter.badge(badge.label, badge.message, badge.color)).join("\n");
        return Buffer.concat([
            formatterAdapter.center(Buffer.from(badgeContent)),
            formatterAdapter.lineBreak(),
            formatterAdapter.lineBreak()
        ]);
    }

    private getBadges(manifest: GitHubAction | GitHubWorkflow): { label: string, message: string, color: string }[] {
        const badges: { label: string, message: string, color: string }[] = [];

        // GitHub Actions Marketplace badge for actions
        if ('runs' in manifest) {
            badges.push({ label: 'GitHub Actions', message: 'Marketplace', color: 'blue' });
        }

        // Version badge
        badges.push({ label: 'Version', message: 'v1.0.0', color: 'green' });

        // License badge
        badges.push({ label: 'License', message: 'MIT', color: 'blue' });

        return badges;
    }
}
