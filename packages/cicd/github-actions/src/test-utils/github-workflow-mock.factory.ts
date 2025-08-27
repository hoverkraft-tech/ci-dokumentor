

import type { GitHubWorkflow } from 'src/github-actions-parser.js';

export class GitHubWorkflowMockFactory {

    static create(overrides: Partial<GitHubWorkflow> = {}): GitHubWorkflow {
        const base: GitHubWorkflow = {
            usesName: 'owner/repo/.github/workflows/test-workflow.yml',
            name: 'Test Workflow',
            on: { push: {} },
            jobs: {},
        };

        return { ...base, ...overrides } as GitHubWorkflow;
    }
}
