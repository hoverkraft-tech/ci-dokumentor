import { RepositoryOptionsDescriptors, AbstractRepositoryProvider, RepositoryInfo, LicenseInfo, ContributingInfo, SecurityInfo, ManifestVersion } from '@ci-dokumentor/core';
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
  private static STABLE_SEMVER_RE = /^(?:v)?\d+\.\d+\.\d+$/; // no pre-release/build
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
  setOptions(options: GitRepositoryProviderOptions): void {
    // No options to set anymore
    void options;
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

  /**
   * Get the parsed remote URL for the repository
   * This is a public method that can be used by other providers
   */
  async getRemoteParsedUrl(): Promise<ParsedRemoteUrl> {
    const remoteUrl = await this.getRemoteUrl();
    return gitUrlParse(remoteUrl);
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
      rootDir: await this.getRootDir(),
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

  protected async fetchSecurity(): Promise<SecurityInfo | undefined> {
    // Basic git provider doesn't provide security functionality
    return undefined;
  }

  protected async fetchLatestVersion(): Promise<ManifestVersion | undefined> {
    const lastTag = await this.getLastStableTagVersion();
    if (lastTag) {
      return lastTag;
    }
    return await this.getCurrentBranchVersion();
  }

  private async getLastStableTagVersion(): Promise<ManifestVersion | undefined> {
    try {
      const git = simpleGit();

      // First try to get the latest stable semver tag
      await git.fetch(['--tags']);

      // Ask Git for tags, version-sorted descending, and only return names.
      // List only tags that look like semantic versions (have at least two dots),
      // sorted by semantic version descending.
      const out = await git.raw([
        'tag',
        '--list',
        '*.*.*', // match tags like 1.2.3 or v1.2.3
        '--sort=-v:refname',
        '--format=%(refname:short)',
      ]);

      for (const line of out.split('\n')) {
        const tag = line.trim();
        if (GitRepositoryProvider.STABLE_SEMVER_RE.test(tag)) {
          const detectedSha = await git.revparse([tag]);
          const detectedRef = tag;
          return { ref: detectedRef, sha: detectedSha };
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private async getCurrentBranchVersion(): Promise<ManifestVersion | undefined> {
    try {
      const git = simpleGit();
      const detectedSha = await git.revparse('HEAD');
      let detectedRef: string | undefined;

      // Fallback to current branch name
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      if (currentBranch && currentBranch !== 'HEAD') {
        detectedRef = currentBranch;
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

  private async getRootDir(): Promise<string> {
    const git = simpleGit();
    return await git.revparse(['--show-toplevel']);
  }
}
