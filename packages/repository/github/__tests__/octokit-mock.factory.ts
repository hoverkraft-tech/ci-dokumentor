import { Mock, vi } from 'vitest';

const { graphqlMock } = vi.hoisted(() => ({
    graphqlMock: vi.fn(),
}));

vi.mock('@octokit/graphql', () => ({
    graphql: Object.assign(
        vi.fn(() => graphqlMock),
        { defaults: vi.fn(() => graphqlMock) }
    ),
}));

export class OcktokitMockFactory {
    static create(): { graphqlMock: Mock } {
        return {
            graphqlMock,
        };
    }
}