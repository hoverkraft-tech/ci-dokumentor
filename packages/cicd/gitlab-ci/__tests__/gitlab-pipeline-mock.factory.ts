import type { GitLabCIPipeline } from '../src/gitlab-ci-parser.js';

export class GitLabCIPipelineMockFactory {
    static create(overrides: Partial<GitLabCIPipeline> = {}): GitLabCIPipeline {
        const base: GitLabCIPipeline = {
            usesName: 'gitlab.com/test-user/test-repo',
            name: 'Test Pipeline',
            description: 'A test GitLab CI pipeline',
            stages: ['build', 'test', 'deploy'],
            variables: {
                NODE_VERSION: '18'
            },
            jobs: {
                build: {
                    stage: 'build',
                    image: 'node:18',
                    script: ['npm run build']
                },
                test: {
                    stage: 'test',
                    image: 'node:18',
                    script: ['npm test']
                }
            }
        };

        return { ...base, ...overrides } as GitLabCIPipeline;
    }
}