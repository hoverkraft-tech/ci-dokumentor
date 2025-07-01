import { GitHubRepository } from "../repository/github-repository.service.js";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";
import { icons } from 'feather-icons';

export class HeaderSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Header;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const logoContent = this.generateLogo(formatterAdapter, manifest, repository);
        const titleContent = this.generateTitle(formatterAdapter, manifest, repository);

        let sectionContent = titleContent;

        if (logoContent) {
            sectionContent = Buffer.concat([logoContent, Buffer.from('\n'), titleContent]);
        }

        return Buffer.concat([formatterAdapter.center(sectionContent)]);
    }

    private generateLogo(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer | null {
        const logoPath = repository.logo;
        if (!logoPath) {
            return null;
        }

        const logoAltText = this.getDisplayName(manifest, repository);
        const logoImage = formatterAdapter.image(logoPath, logoAltText, {
            width: '60px',
            align: 'center'
        });

        return logoImage;
    }

    private getDisplayName(manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const name = (manifest.name || repository.name);
        // Convert to pascal case
        return Buffer.from(name.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase()));
    }

    private generateTitle(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const title = Buffer.from(this.getTitlePrefix(manifest) + this.getDisplayName(manifest, repository));
        const branchingIcon = this.generateBrandingIcon(formatterAdapter, manifest);

        const headingContent = branchingIcon ? Buffer.concat([branchingIcon, Buffer.from(' '), title]) : title;

        return formatterAdapter.heading(headingContent, 1);
    }

    private getTitlePrefix(manifest: GitHubAction | GitHubWorkflow): string {
        return 'runs' in manifest ? 'GitHub Action: ' : 'GitHub Workflow: ';
    }

    private generateBrandingIcon(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer | null {
        if (!('branding' in manifest) || !manifest.branding?.icon) {
            return null;
        }

        const icon = manifest.branding.icon as keyof typeof icons;

        const featherIcon = icons[icon]?.toSvg({ color: manifest.branding.color || 'gray-dark' });
        if (!featherIcon) {
            return null;
        }

        // Get data URI for the icon
        const data = `data:image/svg+xml;base64,${Buffer.from(featherIcon).toString('base64')}`;

        return formatterAdapter.image(data, Buffer.from('Icon'));
    }
}