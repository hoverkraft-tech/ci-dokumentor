import { Repository, RepositoryService } from "@ci-dokumentor/core";
import { existsSync } from "node:fs";
import { graphql, GraphQlQueryResponseData } from "@octokit/graphql";
import { injectable } from "inversify";

export type GitHubRepository = Repository & {
    logo?: string;
};

@injectable()
export class GitHubRepositoryService extends RepositoryService {
    override async getRepository(): Promise<GitHubRepository> {
        const repositoryInfo = await super.getRepository();
        const logo = await this.getLogoUri(repositoryInfo);

        return {
            ...repositoryInfo,
            logo, // Optional logo URI
        };
    }

    private async getLogoUri(repositoryInfo: Repository): Promise<string | undefined> {
        const possibleLogoPaths = [
            '.github/logo.png',
            '.github/logo.jpg',
            '.github/logo.jpeg',
            '.github/logo.svg',
        ];

        for (const path of possibleLogoPaths) {
            if (existsSync(path)) {
                return `file://${path}`;
            }
        }

        // Fallback to Open Graph image if no logo is found
        return this.getOpenGraphImageUrl(repositoryInfo);
    }

    private async getOpenGraphImageUrl(repositoryInfo: Repository): Promise<string | undefined> {
        const result: GraphQlQueryResponseData = await graphql(`
            query getOpenGraphImageUrl($owner: String!, $repo: String!) {
                repository(owner: $owner, name: $repo) {
                    openGraphImageUrl
                }
            }
        `, {
            owner: repositoryInfo.owner,
            repo: repositoryInfo.name
        });

        const repository = result.repository;
        return repository.openGraphImageUrl;
    }
}