import { Repository } from "@ci-dokumentor/core";
import { GitHubAction, GitHubActionOutput, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

type OutputsTable = {
    headers: Buffer[];
    rows: Buffer[][];
}

export class OutputsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Outputs;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: Repository): Buffer {
        let table: OutputsTable;

        if (this.isGitHubAction(manifest)) {
            table = this.generateActionOutputsTable(formatterAdapter, manifest);
        } else if (this.isGitHubWorkflow(manifest)) {
            // GitHub Workflows don't have outputs at the workflow level for reusable workflows
            // They can only have outputs at the job level, which is not supported by this generator
            table = this.generateEmptyOutputsTable();
        } else {
            throw new Error("Unsupported manifest type for OutputsSectionGenerator");
        }

        return Buffer.concat(
            [
                formatterAdapter.heading(Buffer.from('Outputs'), 2),
                formatterAdapter.lineBreak(),
                formatterAdapter.table(table.headers, table.rows)
            ]
        );
    }

    private generateActionOutputsTable(formatterAdapter: FormatterAdapter, manifest: GitHubAction): OutputsTable {
        const headers = [
            Buffer.from('**Output**'),
            Buffer.from('**Description**'),
        ];

        const rows = Object.entries(manifest.outputs || {}).map(([name, output]) => {
            return [
                this.getOutputName(name, formatterAdapter),
                this.getOutputDescription(output),
            ];
        });

        return { headers, rows };
    }

    private generateEmptyOutputsTable(): OutputsTable {
        const headers = [
            Buffer.from('**Output**'),
            Buffer.from('**Description**'),
        ];

        return { headers, rows: [] };
    }

    private getOutputName(name: string, formatterAdapter: FormatterAdapter): Buffer {
        return formatterAdapter.bold(formatterAdapter.inlineCode(Buffer.from(name)));
    }

    private getOutputDescription(output: GitHubActionOutput): Buffer {
        return Buffer.from(output.description || '');
    }
}
