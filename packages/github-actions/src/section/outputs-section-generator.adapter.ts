import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class OutputsSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Outputs;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        // Generate outputs section for both Actions and Workflows
        let outputs: Record<string, any> = {};

        if ('runs' in manifest && manifest.outputs) {
            // GitHub Action outputs
            outputs = manifest.outputs;
        } else if ('jobs' in manifest) {
            // GitHub Workflow outputs (from jobs)
            const jobsWithOutputs = Object.entries(manifest.jobs).filter(([_, job]) => job.outputs);
            if (jobsWithOutputs.length === 0) {
                return Buffer.from('');
            }

            // Combine outputs from all jobs
            jobsWithOutputs.forEach(([jobName, job]) => {
                if (job.outputs) {
                    Object.entries(job.outputs).forEach(([key, value]) => {
                        outputs[`${jobName}.${key}`] = { description: `Output from ${jobName} job`, value };
                    });
                }
            });
        }

        if (Object.keys(outputs).length === 0) {
            return Buffer.from('');
        }

        const headers = [
            Buffer.from('Name'),
            Buffer.from('Description'),
            Buffer.from('Value/Expression')
        ];

        const rows = Object.entries(outputs).map(([name, output]) => [
            formatterAdapter.inlineCode(Buffer.from(name)),
            Buffer.from(output.description || 'No description provided'),
            formatterAdapter.inlineCode(Buffer.from(output.value || 'N/A'))
        ]);

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Outputs'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.table(headers, rows),
            formatterAdapter.lineBreak(),
            formatterAdapter.lineBreak()
        ]);
    }
}
