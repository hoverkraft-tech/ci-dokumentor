import { Repository, RepositoryProvider } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import gitUrlParse from 'git-url-parse';
import { simpleGit } from 'simple-git';

@injectable()
export class GitRepositoryProvider implements RepositoryProvider {
  /**
   * Get the platform name identifier for this provider
   */
  getPlatformName(): string {
    return 'git';
  }

  /**
   * Check if this provider supports the current repository context
   * This basic provider supports any git repository
   */
  async supports(): Promise<boolean> {
    try {
      const git = simpleGit();
      const remotes = await git.getRemotes(true);
      const originRemote = remotes.find((remote) => remote.name === 'origin');

      return !!(originRemote && originRemote.refs.fetch);
    } catch {
      return false;
    }
  }

  async getRepository(): Promise<Repository> {
    const parsedUrl = await this.getRemoteParsedUrl();

    let url = parsedUrl.toString('https');
    // Remove the .git suffix if present
    if (url.endsWith('.git')) {
      url = url.slice(0, -4);
    }

    const fullName =
      parsedUrl.full_name || `${parsedUrl.owner}/${parsedUrl.name}`;

    return {
      owner: parsedUrl.owner,
      name: parsedUrl.name,
      url,
      fullName,
    };
  }

  /**
   * Get the parsed remote URL for the repository
   * This is a public method that can be used by other providers
   */
  async getRemoteParsedUrl(): Promise<any> {
    const remoteUrl = await this.getRemoteUrl();
    return gitUrlParse(remoteUrl);
  }

  private async getRemoteUrl(): Promise<string> {
    const git = simpleGit();
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin');

    if (!originRemote || !originRemote.refs.fetch) {
      throw new Error('No remote "origin" found');
    }

    return originRemote.refs.fetch;
  }
}
