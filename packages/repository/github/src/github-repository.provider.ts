import {
  Repository,
  RepositoryProvider,
  LicenseService,
} from '@ci-dokumentor/core';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { graphql, GraphQlQueryResponseData } from '@octokit/graphql';
import { injectable, inject } from 'inversify';
import { existsSync } from 'fs';

@injectable()
export class GitHubRepositoryProvider implements RepositoryProvider {
  constructor(
    @inject(GitRepositoryProvider)
    private gitRepositoryService: GitRepositoryProvider,
    @inject(LicenseService) private licenseService: LicenseService
  ) { }

  /**
   * Get the platform name identifier for this provider
   */
  getPlatformName(): string {
    return 'github';
  }

  /**
   * Get the priority of this provider for auto-detection
   * GitHub provider has higher priority than basic git provider
   */
  getPriority(): number {
    return 100;
  }

  /**
   * Check if this provider supports the current repository context
   * Checks if the repository is hosted on GitHub
   */
  async supports(): Promise<boolean> {
    try {
      // First check if the git repository provider supports the context
      if (!(await this.gitRepositoryService.supports())) {
        return false;
      }

      const parsedUrl = await this.gitRepositoryService.getRemoteParsedUrl();
      return parsedUrl.source === 'github.com';
    } catch {
      return false;
    }
  }

  async getRepository(): Promise<Repository> {
    const repositoryInfo = await this.gitRepositoryService.getRepository();
    const logo = await this.getLogoUri(repositoryInfo);
    const license = await this.getLicenseInfo(repositoryInfo);

    return {
      ...repositoryInfo,
      logo, // Optional logo URI
      license, // Optional license information
    };
  }

  private async getLogoUri(
    repositoryInfo: Repository
  ): Promise<string | undefined> {
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

  private async getOpenGraphImageUrl(
    repositoryInfo: Repository
  ): Promise<string | undefined> {
    const result: GraphQlQueryResponseData = await graphql(
      `
        query getOpenGraphImageUrl($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            openGraphImageUrl
          }
        }
      `,
      {
        owner: repositoryInfo.owner,
        repo: repositoryInfo.name,
      }
    );

    const repository = result.repository;
    return repository.openGraphImageUrl;
  }

  private async getLicenseInfo(
    repositoryInfo: Repository
  ): Promise<
    { name: string; spdxId: string | null; url: string | null } | undefined
  > {
    const result: GraphQlQueryResponseData = await graphql(
      `
        query getLicense($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            licenseInfo {
              name
              spdxId
              url
            }
          }
        }
      `,
      {
        owner: repositoryInfo.owner,
        repo: repositoryInfo.name,
      }
    );

    const licenseInfo = result.repository?.licenseInfo;
    if (licenseInfo) {
      return {
        name: licenseInfo.name,
        spdxId: licenseInfo.spdxId,
        url: licenseInfo.url,
      };
    }

    // Fallback to reading license file directly if no license info from GitHub
    return this.licenseService.detectLicenseFromFile();
  }
}
