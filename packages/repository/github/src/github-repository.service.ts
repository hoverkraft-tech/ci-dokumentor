import { Repository, RepositoryProvider } from "@ci-dokumentor/core";
import { GitRepositoryProvider } from "@ci-dokumentor/repository-git";
import { existsSync } from "node:fs";
import { graphql, GraphQlQueryResponseData } from "@octokit/graphql";
import { injectable, inject } from "inversify";
import gitUrlParse from 'git-url-parse';
import { simpleGit } from 'simple-git';

export type GitHubRepository = Repository & {
    logo?: string;
};

@injectable()
export class GitHubRepositoryService implements RepositoryProvider {
    
    constructor(@inject(GitRepositoryProvider) private basicRepositoryService: GitRepositoryProvider) {}
    
    /**
     * Check if this provider supports the current repository context
     * Checks if the repository is hosted on GitHub
     */
    async supports(): Promise<boolean> {
        try {
            const git = simpleGit();
            const remotes = await git.getRemotes(true);
            const originRemote = remotes.find(remote => remote.name === 'origin');

            if (!originRemote || !originRemote.refs.fetch) {
                return false;
            }

            const parsedUrl = gitUrlParse(originRemote.refs.fetch);
            return parsedUrl.source === 'github.com';
        } catch {
            return false;
        }
    }

    async getRepository(): Promise<GitHubRepository> {
        const repositoryInfo = await this.basicRepositoryService.getRepository();
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