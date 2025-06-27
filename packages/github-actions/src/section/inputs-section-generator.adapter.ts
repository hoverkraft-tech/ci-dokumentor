import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class InputsSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Inputs;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        // Only generate inputs section for GitHub Actions
        if (!('runs' in manifest) || !manifest.inputs || Object.keys(manifest.inputs).length === 0) {
            return Buffer.from('');
        }

        const headers = [
            Buffer.from('Name'),
            Buffer.from('Description'),
            Buffer.from('Required'),
            Buffer.from('Default'),
            Buffer.from('Type')
        ];

        const rows = Object.entries(manifest.inputs).map(([name, input]) => [
            formatterAdapter.inlineCode(Buffer.from(name)),
            Buffer.from(input.description || 'No description provided'),
            Buffer.from(input.required ? 'Yes' : 'No'),
            Buffer.from(input.default || 'N/A'),
            Buffer.from(input.type || 'string')
        ]);

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Inputs'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.table(headers, rows),
            formatterAdapter.lineBreak(),
            formatterAdapter.lineBreak()
        ]);
    }
}
