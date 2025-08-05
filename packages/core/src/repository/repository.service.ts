
import { simpleGit } from 'simple-git';
import gitUrlParse from 'git-url-parse';
import { injectable, multiInject, optional } from 'inversify';
import { RepositoryAdapter, REPOSITORY_ADAPTER_IDENTIFIER } from './repository.adapter.js';

export type Repository = {
    owner: string;
    name: string;
    url: string; // The URL of the repository, without the .git suffix
    fullName: string; // owner/name format
}

@injectable()
export class RepositoryService {
    constructor(
        @multiInject(REPOSITORY_ADAPTER_IDENTIFIER) @optional() private adapters: RepositoryAdapter[] = []
    ) {}

    async getRepository(): Promise<Repository> {
        // Try to auto-detect using adapters first
        const detectedAdapter = await this.autoDetectAdapter();
        if (detectedAdapter) {
            return await detectedAdapter.getRepository();
        }

        // Fallback to basic implementation
        return this.getBasicRepository();
    }

    /**
     * Auto-detect the appropriate repository adapter for the current context
     */
    private async autoDetectAdapter(): Promise<RepositoryAdapter | null> {
        for (const adapter of this.adapters) {
            try {
                if (await adapter.supports()) {
                    return adapter;
                }
            } catch (error) {
                // Continue to next adapter if this one fails
                console.warn(`Repository adapter failed to check support: ${String(error)}`);
            }
        }
        return null;
    }

    /**
     * Basic repository information extraction (fallback)
     */
    private async getBasicRepository(): Promise<Repository> {
        const remoteUrl = await this.getRemoteUrl();

        const parsedUrl = gitUrlParse(remoteUrl);

        let url = parsedUrl.toString('https');
        // Remove the .git suffix if present
        if (url.endsWith('.git')) {
            url = url.slice(0, -4);
        }

        const fullName = parsedUrl.full_name || `${parsedUrl.owner}/${parsedUrl.name}`;

        return {
            owner: parsedUrl.owner,
            name: parsedUrl.name,
            url,
            fullName,
        };
    }

    private async getRemoteUrl(): Promise<string> {
        const git = simpleGit();
        const remotes = await git.getRemotes(true);
        const originRemote = remotes.find(remote => remote.name === 'origin');

        if (!originRemote || !originRemote.refs.fetch) {
            throw new Error('No remote "origin" found');
        }

        return originRemote.refs.fetch;
    }
}