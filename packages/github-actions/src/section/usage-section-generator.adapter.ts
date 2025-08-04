import { GitHubRepository } from "../repository/github-repository.service.js";
import { GitHubAction, GitHubActionInput, GitHubWorkflow, GitHubWorkflowInput, GitHubWorkflowSecrets } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";
import { Document } from 'yaml'
import { basename } from "node:path";

export type UsageInput = {
    name: string;
} & (GitHubActionInput | GitHubWorkflowInput | GitHubWorkflowSecrets);
export class UsageSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Usage;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {

        const usageExample = this.generateUsageExample(formatterAdapter, manifest, repository);
        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Usage'), 2),
            formatterAdapter.lineBreak(),
            usageExample,
        ]);
    }

    private generateUsageExample(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        const usageContent = this.isGitHubAction(manifest) ? this.generateActionUsage(manifest, repository) : this.generateWorkflowUsage(manifest, repository);
        return formatterAdapter.code(Buffer.from(usageContent.toString({
            commentString: (comment: string) => comment.split('\n').map(line => `# ${line}`).join('\n')
        })), 'yaml');
    }

    private generateActionUsage(manifest: GitHubAction, repository: GitHubRepository): Document {

        const inputs = manifest.inputs || {};
        const withUsage = this.generateInputsUsage(inputs);

        return new Document([
            {
                uses: manifest.usesName,
                with: withUsage
            }
        ]);
    }

    private generateWorkflowUsage(workflow: GitHubWorkflow, repository: GitHubRepository): Document {

        const filteredOn = Object.keys(workflow.on || {}).filter(key => key !== 'workflow_dispatch').reduce((acc, key) => {
            acc[key] = workflow.on[key as keyof typeof workflow.on] || {};
            return acc;
        }, {} as Record<string, unknown>);

        const onContent = Object.keys(filteredOn).length > 0 ? filteredOn : { push: { branches: ["main"] } };

        const permissions = workflow.permissions || undefined;

        const secrets = workflow.on?.workflow_dispatch?.secrets || {};
        const secretsUsage = this.generateInputsUsage(secrets);

        const inputs = workflow.on?.workflow_dispatch?.inputs || {};
        const withUsage = this.generateInputsUsage(inputs) || undefined;

        const jobName = basename(workflow.usesName);

        return new Document({
            name: `${workflow.name}`,
            on: onContent,
            permissions,
            jobs: {
                [jobName]: {
                    uses: `${workflow.usesName}`,
                    secrets: secretsUsage,
                    with: withUsage,
                }
            }
        });
    }

    private generateInputsUsage(inputs: Record<string, GitHubActionInput | GitHubWorkflowInput | GitHubWorkflowSecrets>): Document | undefined {
        if (!inputs || Object.keys(inputs).length === 0) {
            return undefined;
        }

        const inputsUsageDocument = new Document({});

        // Process inputs using the dedicated method
        const processedInputs: Record<string, unknown> = {};
        const inputComments: Array<{ key: string, comment: string }> = [];

        for (const key in inputs) {
            const input = inputs[key];
            const processed = this.generateInputUsage({ name: key, ...input })
            processedInputs[key] = processed.value;
            if (processed.comment) {
                inputComments.push({ key, comment: processed.comment });
            }
        }

        // Set the document contents
        inputsUsageDocument.contents = inputsUsageDocument.createNode(processedInputs);

        // Add comments to each key using the internal YAML API
        if (inputsUsageDocument.contents && typeof inputsUsageDocument.contents === 'object' && 'items' in inputsUsageDocument.contents) {
            const items = (inputsUsageDocument.contents as any).items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item.key || !item.key.value) {
                    continue;
                }

                const inputData = inputComments.find(c => c.key === item.key.value);
                if (!inputData) {
                    continue;
                }

                item.key.spaceBefore = i > 0;

                if (inputData.comment) {
                    item.key.commentBefore = inputData.comment;
                }
            }
        }

        return inputsUsageDocument;
    }

    private generateInputUsage(input: UsageInput): { value: unknown, comment?: string } {
        let defaultValue: unknown = (input as GitHubActionInput | GitHubWorkflowInput).default;
        const typeValue = (input as GitHubWorkflowInput).type || 'string';
        const optionsValue = (input as GitHubWorkflowInput).options;

        // Define comments for the input
        let commentBefore = ``;
        if (input.description) {
            commentBefore = input.description;
        }

        if (input.required) {
            commentBefore += `\nThis input is required.`;
        }

        if (defaultValue) {
            commentBefore += `\nDefault: \`${defaultValue}\``;
        }

        if (optionsValue && optionsValue.length > 0) {
            commentBefore += `\nOptions:\n${optionsValue.map(option => `- \`${option}\``).join('\n')}`;
        }

        if (!defaultValue) {
            switch (typeValue) {
                case 'number':
                    defaultValue = 0;
                    break;
                case 'boolean':
                    defaultValue = false;
                    break;
                case 'choice':
                    defaultValue = optionsValue ? optionsValue[0] : '';
                    break;
                case 'string':
                default:
                    defaultValue = '';
            }
        } else {
            // Convert default value to appropriate type
            switch (typeValue) {
                case 'number':
                    defaultValue = typeof defaultValue === 'string' ? parseInt(defaultValue, 10) : defaultValue;
                    break;
                case 'boolean':
                    defaultValue = typeof defaultValue === 'string' ? defaultValue === 'true' : defaultValue;
                    break;
            }
        }

        return {
            value: defaultValue,
            comment: commentBefore || undefined
        };
    }
}
