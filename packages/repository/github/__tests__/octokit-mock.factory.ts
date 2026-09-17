import { type Mock, vi } from "vitest";

const graphqlMock: Mock = vi.fn();

vi.mock("@octokit/graphql", () => {
  return {
    graphql: Object.assign(
      vi.fn(() => graphqlMock),
      { defaults: vi.fn(() => graphqlMock) },
    ),
  };
});

export class OcktokitMockFactory {
  static create() {
    return {
      graphqlMock,
    };
  }
}
