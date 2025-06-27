import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class HeaderSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Header;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        const brandingContent = this.generateBrandingIcon(formatterAdapter, manifest);
        const titleContent = this.generateTitle(manifest);

        const fullTitle = Buffer.concat([brandingContent, titleContent]);
        return formatterAdapter.heading(fullTitle, 1);
    }

    private generateBrandingIcon(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        if (!('branding' in manifest) || !manifest.branding?.icon) {
            return Buffer.from('');
        }

        const brandingPath = `.github/ghadocs/branding.svg`;
        const iconAltText = Buffer.from(`branding<icon:${manifest.branding.icon} color:${manifest.branding.color || 'gray-dark'}`);

        const brandingImage = formatterAdapter.image(iconAltText, brandingPath, {
            width: '60px',
            align: 'center'
        });

        return Buffer.concat([
            brandingImage,
            Buffer.from(' ')
        ]);
    }

    private generateTitle(manifest: GitHubAction | GitHubWorkflow): Buffer {
        const titlePrefix = this.getTitlePrefix(manifest);
        return Buffer.from(titlePrefix + manifest.name);
    }

    private getTitlePrefix(manifest: GitHubAction | GitHubWorkflow): string {
        return 'runs' in manifest ? 'GitHub Action: ' : 'GitHub Workflow: ';
    }
}