import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class UsageSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Quickstart;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        // Only generate usage section for GitHub Actions
        if (!('runs' in manifest)) {
            return Buffer.from('');
        }

        const usageExample = this.generateUsageExample(manifest);
        return formatterAdapter.code(Buffer.from(usageExample), 'yaml');
    }

    private generateUsageExample(manifest: GitHubAction): string {
        // Generate example with inputs
        let usageYaml = `- uses: hoverkraft-tech/ci-github-container@0.25.0\n  with:`;

        if (manifest.inputs && Object.keys(manifest.inputs).length > 0) {
            Object.entries(manifest.inputs).forEach(([inputName, input]) => {
                usageYaml += `\n    # Description: ${input.description || 'No description'}`;

                if (input.default) {
                    usageYaml += `\n    #`;
                    usageYaml += `\n    # Default: ${input.default}`;
                }

                usageYaml += `\n    ${inputName}: ""`;
                usageYaml += '\n';
            });
        } else {
            usageYaml += '\n    # No inputs required';
        }

        return usageYaml;
    }
}
