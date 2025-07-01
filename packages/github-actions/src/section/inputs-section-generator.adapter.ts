import { GitHubRepository } from "../repository/github-repository.service.js";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class InputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Inputs;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        // Only generate inputs section for GitHub Actions
        if (!('runs' in manifest) || !manifest.inputs || Object.keys(manifest.inputs).length === 0) {
            return Buffer.from('');
        }

        const headers = [
            Buffer.from('**Input**'),
            Buffer.from('**Description**'),
            Buffer.from('**Default**'),
            Buffer.from('**Required**')
        ];

        const rows = Object.entries(manifest.inputs).map(([name, input]) => {
            // Process multiline descriptions - take first line or split at <br />
            let description = input.description || 'No description provided';
            const lines = description.split(/\n|<br\s*\/?>/);
            const shortDescription = lines[0].trim();

            // Add continuation if there are more lines
            if (lines.length > 1) {
                const additionalInfo = lines.slice(1).filter(line => line.trim()).join('<br />');
                if (additionalInfo) {
                    description = shortDescription + '<br />' + additionalInfo;
                }
            } else {
                description = shortDescription;
            }

            return [
                formatterAdapter.inlineCode(Buffer.from(name)),
                Buffer.from(description),
                formatterAdapter.inlineCode(Buffer.from(input.default || '')),
                Buffer.from(input.required ? '**true**' : '**false**')
            ];
        });

        return formatterAdapter.table(headers, rows);
    }
}
