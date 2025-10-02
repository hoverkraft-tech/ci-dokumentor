import {
  RepositoryInfo,
  LicenseInfo,
  ContributingInfo,
  SecurityInfo,
  AbstractRepositoryProvider,
  LicenseService,
  RepositoryOptionsDescriptors,
  ManifestVersion,
  FileReaderAdapter,
} from '@ci-dokumentor/core';
import type { ReaderAdapter } from '@ci-dokumentor/core';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { Gitlab, ProjectLicenseSchema, SimpleProjectSchema } from '@gitbeaker/rest';
import { injectable, inject } from 'inversify';

export type GitLabRepositoryProviderOptions = {
  gitlabToken?: string;
  gitlabUrl?: string;
};

export type GitlabClient = InstanceType<typeof Gitlab<false>>;

@injectable()
export class GitLabRepositoryProvider extends AbstractRepositoryProvider<GitLabRepositoryProviderOptions> {
  private gitlabToken?: string;
  private gitlabUrl?: string;
  private gitlabClient?: GitlabClient;

  constructor(
    @inject(GitRepositoryProvider)
    private gitRepositoryProvider: GitRepositoryProvider,
    @inject(LicenseService) private licenseService: LicenseService,
    @inject(FileReaderAdapter) private readerAdapter: ReaderAdapter,
  ) {
    super();
  }

  /**
   * Get the platform name identifier for this provider
   */
  getPlatformName(): string {
    return 'gitlab';
  }

  /**
   * Get the priority of this provider for auto-detection
   * GitLab provider has higher priority than basic git provider
   */
  getPriority(): number {
    return 100;
  }

  /**
   * Provide repository-specific CLI option descriptors
   */
  getOptions(): RepositoryOptionsDescriptors<GitLabRepositoryProviderOptions> {
    return {
      gitlabToken: {
        flags: '--gitlab-token <token>',
        description: 'Optional GitLab token to authenticate API requests',
        env: 'GITLAB_TOKEN',
      },
      gitlabUrl: {
        flags: '--gitlab-url <url>',
        description: 'GitLab instance URL (defaults to https://gitlab.com)',
        env: 'GITLAB_URL',
      },
    };
  }

  /**
   * Apply runtime options to the provider instance. Supports setting the
   * GitLab token via either the option name `gitlabToken` or environment
   * variable key `GITLAB_TOKEN`, and GitLab URL via `gitlabUrl` or `GITLAB_URL`.
   */
  setOptions(options: GitLabRepositoryProviderOptions): void {
    if (!options) {
      return;
    }

    const shouldResetClient =
      options.gitlabToken !== this.gitlabToken ||
      options.gitlabUrl !== this.gitlabUrl;

    this.gitlabToken = options.gitlabToken;
    this.gitlabUrl = options.gitlabUrl;

    // Reset client to pick up new token/URL
    if (shouldResetClient) {
      this.gitlabClient = undefined;
    }
  }

  /**
   * Check if this provider supports the current repository context
   * Checks if the repository is hosted on GitLab
   */
  async supports(): Promise<boolean> {
    // First check if the git repository provider supports the context
    if (!(await this.gitRepositoryProvider.supports())) {
      return false;
    }

    const parsedUrl = await this.gitRepositoryProvider.getRemoteParsedUrl();
    return parsedUrl.source === 'gitlab.com' ||
      parsedUrl.source.includes('gitlab') ||
      (!!this.gitlabUrl && parsedUrl.source === new URL(this.gitlabUrl).hostname);
  }

  protected async fetchRepositoryInfo(): Promise<RepositoryInfo> {
    return this.gitRepositoryProvider.getRepositoryInfo();
  }

  protected async fetchLogo(): Promise<string | undefined> {
    const possibleLogoPaths = [
      '.gitlab/logo.png',
      '.gitlab/logo.jpg',
      '.gitlab/logo.jpeg',
      '.gitlab/logo.svg',
    ];

    for (const path of possibleLogoPaths) {
      if (this.readerAdapter.resourceExists(path)) {
        return `file://${path}`;
      }
    }

    const project = await this.getProjectInfo();
    return project.avatar_url || undefined;
  }

  protected async fetchLicense(): Promise<LicenseInfo | undefined> {
    const project = await this.getProjectInfo();

    const license = project.license as ProjectLicenseSchema;
    if (license?.name) {
      return {
        name: license.name,
        spdxId: license.nickname ?? undefined,
        url: license.html_url ?? undefined,
      };
    }

    // Fallback to reading license file directly if no license info from GitLab
    return await this.licenseService.detectLicenseFromFile();
  }

  protected async fetchContributing(): Promise<ContributingInfo | undefined> {
    // Check for common contributing file paths
    const contributingPaths = [
      'CONTRIBUTING.md',
      'CONTRIBUTING.rst',
      'CONTRIBUTING.txt',
      '.gitlab/CONTRIBUTING.md',
      'docs/CONTRIBUTING.md',
    ];

    for (const path of contributingPaths) {
      if (this.readerAdapter.resourceExists(path)) {
        const repositoryInfo = await this.getRepositoryInfo();
        return {
          url: `${repositoryInfo.url}/-/blob/main/${path}`,
        };
      }
    }

    return undefined;
  }

  protected async fetchSecurity(): Promise<SecurityInfo | undefined> {
    // Check for common security policy file paths
    const securityPaths = [
      'SECURITY.md',
      'SECURITY.rst',
      'SECURITY.txt',
      '.gitlab/SECURITY.md',
      'docs/SECURITY.md',
    ];

    for (const path of securityPaths) {
      if (this.readerAdapter.resourceExists(path)) {
        const repositoryInfo = await this.getRepositoryInfo();
        return {
          url: `${repositoryInfo.url}/-/blob/main/${path}`,
        };
      }
    }

    return undefined;
  }

  protected override async fetchLatestVersion(): Promise<ManifestVersion | undefined> {
    return this.gitRepositoryProvider.getLatestVersion();
  }

  private async getProjectInfo(): Promise<SimpleProjectSchema> {
    return this.getCached('projectInfo', async () => {
      const repositoryInfo = await this.getRepositoryInfo();
      const client = this.getGitLabClient();

      const project = await client.Projects.show(`${repositoryInfo.owner}/${repositoryInfo.name}`);
      return project as SimpleProjectSchema;
    });
  }

  /**
   * Create a GitLab client using optional GITLAB_TOKEN from environment
   */
  private getGitLabClient(): GitlabClient {
    if (this.gitlabClient) {
      return this.gitlabClient;
    }

    const options: ConstructorParameters<typeof Gitlab>[0] & { token?: string } = {
      camelize: false,
    };

    if (this.gitlabToken) {
      options.token = this.gitlabToken;
    }

    if (this.gitlabUrl) {
      options.host = this.gitlabUrl;
    }

    this.gitlabClient = new Gitlab(options) as GitlabClient;
    return this.gitlabClient;
  }
}