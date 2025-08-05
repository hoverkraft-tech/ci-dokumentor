import { GitHubRepository } from "@ci-dokumentor/repository-github";
import { GitHubAction, GitHubActionInput, GitHubWorkflow, GitHubWorkflowInput } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

type InputsTable = {
    headers: Buffer[];
    rows: Buffer[][];
}

export class InputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Inputs;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        let table: InputsTable;

        if (this.isGitHubAction(manifest)) {
            table = this.generateActionInputsTable(formatterAdapter, manifest);
        } else if (this.isGitHubWorkflow(manifest)) {
            table = this.generateWorkflowInputsTable(formatterAdapter, manifest);
        } else {
            throw new Error("Unsupported manifest type for InputsSectionGenerator");
        }


        return Buffer.concat(
            [
                formatterAdapter.heading(Buffer.from('Inputs'), 2),
                formatterAdapter.lineBreak(),
                formatterAdapter.table(table.headers, table.rows)
            ]
        );
    }

    private generateActionInputsTable(formatterAdapter: FormatterAdapter, manifest: GitHubAction): InputsTable {
        const headers = [
            Buffer.from('**Input**'),
            Buffer.from('**Description**'),
            Buffer.from('**Required**'),
            Buffer.from('**Default**'),
        ];

        const rows = Object.entries(manifest.inputs || {}).map(([name, input]) => {
            return [
                this.getInputName(name, formatterAdapter),
                this.getInputDescription(input),
                this.getInputRequired(input, formatterAdapter),
                this.getInputDefault(input, formatterAdapter),
            ];
        });

        return { headers, rows };
    }

    private generateWorkflowInputsTable(formatterAdapter: FormatterAdapter, manifest: GitHubWorkflow): InputsTable {
        const headers = [
            Buffer.from('**Input**'),
            Buffer.from('**Description**'),
            Buffer.from('**Required**'),
            Buffer.from('**Type**'),
            Buffer.from('**Default**'),
        ];

        const rows = Object.entries(manifest.on?.workflow_dispatch?.inputs || {}).map(([name, input]) => {
            return [
                this.getInputName(name, formatterAdapter),
                this.getInputDescription(input),
                this.getInputRequired(input, formatterAdapter),
                this.getInputType(input, formatterAdapter),
                this.getInputDefault(input, formatterAdapter),
            ];
        });

        return { headers, rows };
    }

    private getInputName(name: string, formatterAdapter: FormatterAdapter): Buffer {
        return formatterAdapter.bold(formatterAdapter.inlineCode(Buffer.from(name)));
    }

    private getInputDescription(input: GitHubActionInput | GitHubWorkflowInput): Buffer {
        let description = input.description || '';

        if ((input as GitHubWorkflowInput).options) {
            const options = (input as GitHubWorkflowInput).options;
            if (options && options.length > 0) {
                description += `\nOptions: ${options.map(option => `\`${option}\``).join(', ')}`;
            }
        }

        return Buffer.from(description);
    }

    private getInputDefault(input: GitHubActionInput | GitHubWorkflowInput, formatterAdapter: FormatterAdapter): Buffer {
        return formatterAdapter.inlineCode(Buffer.from(input.default || ''));
    }

    private getInputRequired(input: GitHubActionInput | GitHubWorkflowInput, formatterAdapter: FormatterAdapter): Buffer {
        return formatterAdapter.bold(Buffer.from(input.required ? 'true' : 'false'));
    }

    private getInputType(input: GitHubWorkflowInput, formatterAdapter: FormatterAdapter): Buffer {
        return formatterAdapter.bold(Buffer.from(input.type));
    }
}
