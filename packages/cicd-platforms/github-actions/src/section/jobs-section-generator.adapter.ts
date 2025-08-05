import { GitHubRepository } from "@ci-dokumentor/repository-platforms-github";
import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class JobsSectionGenerator extends GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Contents; // Reusing Contents identifier for Jobs
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow, repository: GitHubRepository): Buffer {
        // Only generate for workflows
        if ('runs' in manifest) {
            return Buffer.from('');
        }

        const workflow = manifest;
        const jobEntries = Object.entries(workflow.jobs);

        if (jobEntries.length === 0) {
            return Buffer.from('');
        }

        const headers = [
            Buffer.from('Job'),
            Buffer.from('Runs On'),
            Buffer.from('Steps'),
            Buffer.from('Dependencies')
        ];

        const rows = jobEntries.map(([jobName, job]) => {
            const runsOn = Array.isArray(job['runs-on']) ? job['runs-on'].join(', ') : job['runs-on'];
            const stepCount = job.steps ? job.steps.length.toString() : '0';
            const dependencies = job.needs ? (Array.isArray(job.needs) ? job.needs.join(', ') : job.needs) : 'None';

            return [
                formatterAdapter.inlineCode(Buffer.from(jobName)),
                Buffer.from(runsOn),
                Buffer.from(stepCount),
                Buffer.from(dependencies)
            ];
        });

        let content = Buffer.concat([
            formatterAdapter.table(headers, rows),
            formatterAdapter.lineBreak()
        ]);

        // Add detailed job descriptions
        jobEntries.forEach(([jobName, job]) => {
            let jobDetails = Buffer.concat([
                formatterAdapter.heading(Buffer.from(`Job: ${jobName}`), 3),
                formatterAdapter.lineBreak()
            ]);

            if (job.name) {
                jobDetails = Buffer.concat([
                    jobDetails,
                    formatterAdapter.bold(Buffer.from('Name: ')),
                    Buffer.from(job.name),
                    formatterAdapter.lineBreak()
                ]);
            }

            jobDetails = Buffer.concat([
                jobDetails,
                formatterAdapter.bold(Buffer.from('Runs on: ')),
                Buffer.from(Array.isArray(job['runs-on']) ? job['runs-on'].join(', ') : job['runs-on']),
                formatterAdapter.lineBreak()
            ]);

            if (job.needs) {
                jobDetails = Buffer.concat([
                    jobDetails,
                    formatterAdapter.bold(Buffer.from('Depends on: ')),
                    Buffer.from(Array.isArray(job.needs) ? job.needs.join(', ') : job.needs),
                    formatterAdapter.lineBreak()
                ]);
            }

            if (job.strategy?.matrix) {
                jobDetails = Buffer.concat([
                    jobDetails,
                    formatterAdapter.bold(Buffer.from('Matrix strategy: ')),
                    Buffer.from('Yes'),
                    formatterAdapter.lineBreak()
                ]);
            }

            if (job.environment) {
                const envName = typeof job.environment === 'string' ? job.environment : job.environment.name;
                jobDetails = Buffer.concat([
                    jobDetails,
                    formatterAdapter.bold(Buffer.from('Environment: ')),
                    Buffer.from(envName),
                    formatterAdapter.lineBreak()
                ]);
            }

            // List job steps
            if (job.steps && job.steps.length > 0) {
                jobDetails = Buffer.concat([
                    jobDetails,
                    formatterAdapter.lineBreak(),
                    formatterAdapter.bold(Buffer.from('Steps:')),
                    formatterAdapter.lineBreak()
                ]);

                const stepItems = job.steps.map((step, index) => {
                    let stepDesc = `Step ${index + 1}`;
                    if (step.name) {
                        stepDesc = step.name;
                    } else if (step.uses) {
                        stepDesc = `Use ${step.uses}`;
                    } else if (step.run) {
                        stepDesc = `Run: ${step.run.split('\n')[0].substring(0, 50)}${step.run.length > 50 ? '...' : ''}`;
                    }
                    return Buffer.from(stepDesc);
                });

                jobDetails = Buffer.concat([
                    jobDetails,
                    formatterAdapter.list(stepItems, true),
                    formatterAdapter.lineBreak()
                ]);
            }

            content = Buffer.concat([content, jobDetails, formatterAdapter.lineBreak()]);
        });

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Jobs'), 2),
            formatterAdapter.lineBreak(),
            content,
            formatterAdapter.lineBreak()
        ]);
    }
}
