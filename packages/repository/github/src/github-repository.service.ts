import { Repository, RepositoryProvider } from "@ci-dokumentor/core";
import { GitRepositoryProvider } from "@ci-dokumentor/repository-git";
import { existsSync } from "node:fs";
import { graphql, GraphQlQueryResponseData } from "@octokit/graphql";
import { injectable, inject } from "inversify";

@injectable()
export class GitHubRepositoryProvider implements RepositoryProvider {
    
    constructor(@inject(GitRepositoryProvider) private gitRepositoryService: GitRepositoryProvider) {}
    
    /**
     * Check if this provider supports the current repository context
     * Checks if the repository is hosted on GitHub
     */
    async supports(): Promise<boolean> {
        try {
            const parsedUrl = await this.gitRepositoryService.getRemoteParsedUrl();
            return parsedUrl.source === 'github.com';
        } catch {
            return false;
        }
    }

    async getRepository(): Promise<Repository> {
        const repositoryInfo = await this.gitRepositoryService.getRepository();
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