import { MockedFunction, vi } from 'vitest';

const { projectsShowMock, gitlabConstructorMock } = vi.hoisted(() => ({
    projectsShowMock: vi.fn(),
    gitlabConstructorMock: vi.fn(),
}));

vi.mock('@gitbeaker/rest', () => ({
    Gitlab: vi.fn(),
}));

import { Gitlab } from '@gitbeaker/rest';
import { GitlabClient } from '../src/gitlab-repository.provider.js';

export type ProjectsShowMock = MockedFunction<GitlabClient['Projects']['show']>;

export class GitBeakerMockFactory {
    static create(): {
        projectsShowMock: ProjectsShowMock;
    } {

        vi.mocked(Gitlab).mockImplementation((...args: unknown[]) => {
            gitlabConstructorMock(...args);

            return {
                Projects: {
                    show: projectsShowMock,
                },
            } as unknown as InstanceType<typeof Gitlab>;
        });

        return {
            projectsShowMock,
        };
    }
}