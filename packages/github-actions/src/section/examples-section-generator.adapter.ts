import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class ExamplesSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Examples;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        let content = Buffer.from('');

        if ('runs' in manifest) {
            // GitHub Action examples
            content = this.generateActionExamples(formatterAdapter, manifest);
        } else {
            // GitHub Workflow examples
            content = this.generateWorkflowExamples(formatterAdapter, manifest);
        }

        if (content.length === 0) {
            return Buffer.from('');
        }

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Examples'), 2),
            formatterAdapter.lineBreak(),
            content,
            formatterAdapter.lineBreak()
        ]);
    }

    private generateActionExamples(formatterAdapter: FormatterAdapter, action: GitHubAction): Buffer {
        const examples: Buffer[] = [];

        // Basic example
        let basicExample = `- name: Run ${action.name}
  uses: owner/repo@v1`;

        if (action.inputs && Object.keys(action.inputs).length > 0) {
            basicExample += '\n  with:';
            Object.entries(action.inputs).slice(0, 3).forEach(([key, input]) => {
                const value = input.default || (input.type === 'boolean' ? 'true' : 'example-value');
                basicExample += `\n    ${key}: ${value}`;
            });
        }

        examples.push(Buffer.concat([
            formatterAdapter.heading(Buffer.from('Basic Usage'), 3),
            formatterAdapter.lineBreak(),
            formatterAdapter.code(Buffer.from(basicExample), 'yaml'),
            formatterAdapter.lineBreak()
        ]));

        // Advanced example with all inputs
        if (action.inputs && Object.keys(action.inputs).length > 3) {
            let advancedExample = `- name: Advanced ${action.name}
  uses: owner/repo@v1
  with:`;

            Object.entries(action.inputs).forEach(([key, input]) => {
                const value = input.default || (input.type === 'boolean' ? 'false' : 'custom-value');
                advancedExample += `\n    ${key}: ${value}`;
            });

            examples.push(Buffer.concat([
                formatterAdapter.heading(Buffer.from('Advanced Usage'), 3),
                formatterAdapter.lineBreak(),
                formatterAdapter.code(Buffer.from(advancedExample), 'yaml'),
                formatterAdapter.lineBreak()
            ]));
        }

        // Example with outputs
        if (action.outputs && Object.keys(action.outputs).length > 0) {
            const outputExample = `- name: Use ${action.name}
  id: my-action
  uses: owner/repo@v1

- name: Use outputs
  run: |
    echo "Output: \${{ steps.my-action.outputs.${Object.keys(action.outputs)[0]} }}"`;

            examples.push(Buffer.concat([
                formatterAdapter.heading(Buffer.from('Using Outputs'), 3),
                formatterAdapter.lineBreak(),
                formatterAdapter.code(Buffer.from(outputExample), 'yaml'),
                formatterAdapter.lineBreak()
            ]));
        }

        return Buffer.concat(examples);
    }

    private generateWorkflowExamples(formatterAdapter: FormatterAdapter, workflow: GitHubWorkflow): Buffer {
        const examples: Buffer[] = [];

        // Basic workflow structure
        const jobNames = Object.keys(workflow.jobs);
        const firstJob = workflow.jobs[jobNames[0]];

        let basicExample = `name: ${workflow.name}

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  ${jobNames[0]}:
    runs-on: ${Array.isArray(firstJob['runs-on']) ? firstJob['runs-on'][0] : firstJob['runs-on']}
    steps:`;

        if (firstJob.steps && firstJob.steps.length > 0) {
            firstJob.steps.slice(0, 3).forEach(step => {
                if (step.uses) {
                    basicExample += `\n      - name: ${step.name || 'Step'}
        uses: ${step.uses}`;
                } else if (step.run) {
                    basicExample += `\n      - name: ${step.name || 'Run command'}
        run: ${step.run}`;
                }
            });
        } else {
            basicExample += `\n      - uses: actions/checkout@v4
      - name: Run workflow
        run: echo "Add your commands here"`;
        }

        examples.push(Buffer.concat([
            formatterAdapter.heading(Buffer.from('Basic Workflow'), 3),
            formatterAdapter.lineBreak(),
            formatterAdapter.code(Buffer.from(basicExample), 'yaml'),
            formatterAdapter.lineBreak()
        ]));

        // Multi-job example if multiple jobs exist
        if (jobNames.length > 1) {
            let multiJobExample = `name: ${workflow.name}

on: [push, pull_request]

jobs:`;

            jobNames.slice(0, 2).forEach(jobName => {
                const job = workflow.jobs[jobName];
                multiJobExample += `
  ${jobName}:
    runs-on: ${Array.isArray(job['runs-on']) ? job['runs-on'][0] : job['runs-on']}
    steps:
      - uses: actions/checkout@v4
      - name: ${jobName} task
        run: echo "Running ${jobName}"`;
            });

            examples.push(Buffer.concat([
                formatterAdapter.heading(Buffer.from('Multi-Job Workflow'), 3),
                formatterAdapter.lineBreak(),
                formatterAdapter.code(Buffer.from(multiJobExample), 'yaml'),
                formatterAdapter.lineBreak()
            ]));
        }

        return Buffer.concat(examples);
    }
}
