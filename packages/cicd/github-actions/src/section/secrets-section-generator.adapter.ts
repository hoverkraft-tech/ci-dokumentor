import { Repository } from "@ci-dokumentor/core";
import { GitHubAction, GitHubWorkflow, GitHubWorkflowInput } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

type SecretsTable = {
    headers: Buffer[];
    rows: Buffer[][];
}

export class SecretsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Secrets;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: Repository): Buffer {


        if (this.isGitHubAction(manifest)) {
            return Buffer.from("");
        }
        if (!this.isGitHubWorkflow(manifest)) {
            throw new Error("Unsupported manifest type for InputsSectionGenerator");
        }

        const table = this.generateWorkflowSecretsTable(formatterAdapter, manifest);

        return Buffer.concat(
            [
                formatterAdapter.heading(Buffer.from('Secrets'), 2),
                formatterAdapter.lineBreak(),
                formatterAdapter.table(table.headers, table.rows)
            ]
        );
    }

    private generateWorkflowSecretsTable(formatterAdapter: FormatterAdapter, manifest: GitHubWorkflow): SecretsTable {
        const headers = [
            Buffer.from('**Secret**'),
            Buffer.from('**Description**'),
            Buffer.from('**Required**'),
        ];

        const rows = Object.entries(manifest.on?.workflow_dispatch?.inputs || {}).map(([name, input]) => {
            return [
                this.getSecretName(name, formatterAdapter),
                this.getSecretDescription(input),
                this.getSecretRequired(input, formatterAdapter),
            ];
        });

        return { headers, rows };
    }

    private getSecretName(name: string, formatterAdapter: FormatterAdapter): Buffer {
        return formatterAdapter.bold(formatterAdapter.inlineCode(Buffer.from(name)));
    }

    private getSecretDescription(secret: GitHubWorkflowInput): Buffer {
        return Buffer.from(secret.description || '');
    }

    private getSecretRequired(secret: GitHubWorkflowInput, formatterAdapter: FormatterAdapter): Buffer {
        return formatterAdapter.bold(Buffer.from(secret.required ? 'true' : 'false'));
    }
}
