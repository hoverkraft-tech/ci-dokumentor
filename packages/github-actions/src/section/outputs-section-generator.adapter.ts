import { GitHubRepository } from "../repository/github-repository.service.js";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class OutputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Outputs;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        // Generate outputs section for GitHub Actions
        if (!('runs' in manifest) || !manifest.outputs || Object.keys(manifest.outputs).length === 0) {
            return Buffer.from('');
        }

        const headers = [
            Buffer.from('**Output**'),
            Buffer.from('**Description**')
        ];

        const rows = Object.entries(manifest.outputs).map(([name, output]) => {
            // Process multiline descriptions similar to inputs
            let description = output.description || 'No description provided';
            const lines = description.split(/\n|<br\s*\/?>/);
            const shortDescription = lines[0].trim();

            // Add continuation if there are more lines
            if (lines.length > 1) {
                const additionalInfo = lines.slice(1).filter((line: string) => line.trim()).join('<br />');
                if (additionalInfo) {
                    description = shortDescription + '<br />' + additionalInfo;
                }
            } else {
                description = shortDescription;
            }

            return [
                formatterAdapter.inlineCode(Buffer.from(name)),
                Buffer.from(description)
            ];
        });

        return formatterAdapter.table(headers, rows);
    }
}
