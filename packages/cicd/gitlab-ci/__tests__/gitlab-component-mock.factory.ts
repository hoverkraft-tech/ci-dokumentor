import type { GitLabComponent } from '../src/gitlab-ci-parser.js';

export class GitLabComponentMockFactory {
    static create(overrides: Partial<GitLabComponent> = {}): GitLabComponent {
        const base: GitLabComponent = {
            usesName: 'gitlab.com/test-user/test-repo@templates/component/template.yml',
            name: 'Test Component',
            description: 'A test GitLab component',
            spec: {
                inputs: {
                    'test-input': {
                        description: 'Test input parameter',
                        type: 'string',
                        default: 'default-value',
                        required: true
                    }
                }
            }
        };

        return { ...base, ...overrides } as GitLabComponent;
    }
}