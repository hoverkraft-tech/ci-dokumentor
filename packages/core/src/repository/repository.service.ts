
import { simpleGit } from 'simple-git';
import gitUrlParse from 'git-url-parse';

export type Repository = {
    owner: string;
    name: string;
    url: string; // The URL of the repository, without the .git suffix
    fullName: string; // owner/name format
}

export class RepositoryService {
    async getRepository(): Promise<Repository> {
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