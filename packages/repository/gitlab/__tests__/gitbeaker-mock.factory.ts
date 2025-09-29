const projectsShowMock = vi.fn();

export class GitBeakerMockFactory {
    static create() {
        const Gitlab = vi.fn().mockImplementation(() => ({
            Projects: {
                show: projectsShowMock
            }
        }))

        vi.mock("@gitbeaker/rest", () => {
            return {
                Gitlab
            };
        });

        return {
            projectsShowMock
        }
    }
}