const graphqlMock = vi.fn();

export class OcktokitMockFactory {
    static create() {
        vi.mock("@octokit/graphql", () => {
            return {
                graphql: Object.assign(
                    vi.fn(() => graphqlMock), // called by .defaults(...) -> returns a function
                    { defaults: vi.fn(() => graphqlMock) }
                ),
            };
        });

        return {
            graphqlMock
        }
    }
}