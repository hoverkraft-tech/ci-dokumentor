

import type { GitHubAction } from 'src/github-actions-parser.js';

export class GitHubActionMockFactory {
    static create(overrides: Partial<GitHubAction> = {}): GitHubAction {
        const base: GitHubAction = {
            usesName: 'owner/repo',
            name: 'Test Action',
            description: 'A test action',
            runs: { using: 'node20' },
        };

        return { ...base, ...overrides } as GitHubAction;
    }
}
