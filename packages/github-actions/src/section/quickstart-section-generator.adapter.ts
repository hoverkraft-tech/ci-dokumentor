import { GitHubAction, GitHubWorkflow } from "../github-actions-parser.js";
import { GitHubActionsSectionGeneratorAdapter } from "./github-actions-section-generator.adapter.js";
import { FormatterAdapter, SectionIdentifier } from "@ci-dokumentor/core";

export class QuickstartSectionGenerator implements GitHubActionsSectionGeneratorAdapter {
    getSectionIdentifier(): SectionIdentifier {
        return SectionIdentifier.Quickstart;
    }

    generateSection(formatterAdapter: FormatterAdapter, manifest: GitHubAction | GitHubWorkflow): Buffer {
        let example = '';

        if ('runs' in manifest) {
            // GitHub Action quickstart
            example = `- name: ${manifest.name}
  uses: owner/repo@v1
  with:
    # Add your inputs here`;

            if (manifest.inputs) {
                const inputExamples = Object.entries(manifest.inputs).slice(0, 2).map(([key, input]) => {
                    const defaultValue = input.default || 'your-value';
                    return `    ${key}: ${defaultValue}`;
                }).join('\n');

                if (inputExamples) {
                    example = `- name: ${manifest.name}
  uses: owner/repo@v1
  with:
${inputExamples}`;
                }
            }
        } else {
            // GitHub Workflow quickstart
            example = `name: ${manifest.name}

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  ${Object.keys(manifest.jobs)[0] || 'build'}:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: echo "Add your setup steps here"`;
        }

        return Buffer.concat([
            formatterAdapter.heading(Buffer.from('Usage'), 2),
            formatterAdapter.lineBreak(),
            formatterAdapter.code(Buffer.from(example), 'yaml'),
            formatterAdapter.lineBreak(),
            formatterAdapter.lineBreak()
        ]);
    }
}
