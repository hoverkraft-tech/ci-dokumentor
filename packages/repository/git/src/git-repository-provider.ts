import { RepositoryOptionsDescriptors, AbstractRepositoryProvider, RepositoryInfo, LicenseInfo, ContributingInfo, ManifestVersion } from '@ci-dokumentor/core';
import { injectable } from 'inversify';
import gitUrlParse from 'git-url-parse';
import { simpleGit } from 'simple-git';

export type ParsedRemoteUrl = {
  source: string;
  owner: string;
  name: string;
  full_name: string;
  toString: (format?: string) => string;
};

type GitRepositoryProviderOptions = Record<string, never>;

@injectable()
export class GitRepositoryProvider extends AbstractRepositoryProvider<GitRepositoryProviderOptions> {

  /**
   * Get the platform name identifier for this provider
   */
  getPlatformName(): string {
    return 'git';
  }

  getOptions(): RepositoryOptionsDescriptors<GitRepositoryProviderOptions> {
    return {
      // No version option anymore
    };
  }

  /**
   * Apply runtime options to the provider instance.
   */
  setOptions(_options: GitRepositoryProviderOptions): void {
    // No options to set anymore
  }

  /**
   * Get the priority of this provider for auto-detection
   * Basic git provider has default priority
   */
  getPriority(): number {
    return 0;
  }

  /**
   * Check if this provider supports the current repository context
   * This basic provider supports any git repository
   */
  async supports(): Promise<boolean> {
    try {
      await this.getOriginRemote();
      return true;
    } catch {
      return false;
    }
  }

  protected async fetchRepositoryInfo(): Promise<RepositoryInfo> {
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

  protected async fetchLogo(): Promise<string | undefined> {
    // Basic git provider doesn't provide logo functionality
    return undefined;
  }

  protected async fetchLicense(): Promise<LicenseInfo | undefined> {
    // Basic git provider doesn't provide license functionality
    return undefined;
  }

  protected async fetchContributing(): Promise<ContributingInfo | undefined> {
    // Basic git provider doesn't provide contributing functionality
    return undefined;
  }

  protected async fetchLatestVersion(): Promise<ManifestVersion | undefined> {
    try {
      const git = simpleGit();

      // Auto-detect version information
      let detectedRef: string | undefined;
      let detectedSha: string | undefined;

      // Get current commit SHA
      try {
        detectedSha = await git.revparse('HEAD');
      } catch {
        // If we can't get SHA, that's ok
      }

      // Get latest tag
      try {
        // Try to get the latest tag pointing to current commit
        const tags = await git.tags(['--points-at', 'HEAD']);
        if (tags.latest) {
          detectedRef = tags.latest;
        } else {
          // Fallback to current branch name
          const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
          if (currentBranch && currentBranch !== 'HEAD') {
            detectedRef = currentBranch;
          }
        }
      } catch {
        // If we can't detect ref, that's ok
      }

      // Return version info if we have at least one piece of information
      if (detectedRef || detectedSha) {
        return { ref: detectedRef, sha: detectedSha };
      }

      return undefined;
    } catch {
      // If anything goes wrong, return undefined (no version info)
      return undefined;
    }
  }

  /**
   * Get the parsed remote URL for the repository
   * This is a public method that can be used by other providers
   */
  async getRemoteParsedUrl(): Promise<ParsedRemoteUrl> {
    const remoteUrl = await this.getRemoteUrl();
    return gitUrlParse(remoteUrl);
  }

  private async getOriginRemote() {
    const git = simpleGit();
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin');

    if (!originRemote || !originRemote.refs.fetch) {
      throw new Error('No remote "origin" found');
    }

    return originRemote;
  }

  private async getRemoteUrl(): Promise<string> {
    const originRemote = await this.getOriginRemote();
    return originRemote.refs.fetch;
  }
}
