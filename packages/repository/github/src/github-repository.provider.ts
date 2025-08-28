import {
  Repository,
  RepositoryProvider,
  LicenseService,
  RepositoryOptionsDescriptors,
} from '@ci-dokumentor/core';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { graphql } from "@octokit/graphql";
import { injectable, inject } from 'inversify';
import { existsSync } from 'fs';
import { createTokenAuth, } from '@octokit/auth-token';
import { RequestParameters } from 'node_modules/@octokit/auth-token/dist-types/types.js';

type GraphQLClient = typeof graphql;

type GitHubRepositoryProviderOptions = {
  githubToken?: string;
};

@injectable()
export class GitHubRepositoryProvider implements RepositoryProvider<GitHubRepositoryProviderOptions> {

  private githubToken?: string;

  private graphqlClient?: GraphQLClient;

  constructor(
    @inject(GitRepositoryProvider)
    private gitRepositoryService: GitRepositoryProvider,
    @inject(LicenseService) private licenseService: LicenseService,
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
   * Provide repository-specific CLI option descriptors
   */
  getOptions(): RepositoryOptionsDescriptors<GitHubRepositoryProviderOptions> {
    return {
      githubToken: {
        flags: '--github-token <token>',
        description: 'Optional GitHub token to authenticate GraphQL requests',
        env: 'GITHUB_TOKEN',
      },
    };
  }

  /**
   * Apply runtime options to the provider instance. Supports setting the
   * GitHub token via either the option name `githubToken` or environment
   * variable key `GITHUB_TOKEN`.
   */
  setOptions(options: GitHubRepositoryProviderOptions): void {
    if (!options) {
      return;
    }

    const shouldResetGraphqlClient = options.githubToken !== this.githubToken;
    this.githubToken = options.githubToken;

    // Reset client to pick up new token
    if (shouldResetGraphqlClient) {
      this.graphqlClient = undefined;
    }
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

  /**
   * Create a GraphQL client using optional GITHUB_TOKEN from environment
   */
  private getGraphQLClient(): GraphQLClient {
    if (this.graphqlClient) {
      return this.graphqlClient;
    }

    const requestParameters: RequestParameters = {};

    if (this.githubToken) {
      const auth = createTokenAuth(this.githubToken);
      requestParameters.request = {
        hook: auth.hook,
      };
    }

    this.graphqlClient = graphql.defaults(requestParameters);
    return this.graphqlClient;
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
    const graphqlClient = this.getGraphQLClient();

    const response = await graphqlClient<{
      repository: {
        openGraphImageUrl?: string;
      }
    }>(
      `query getOpenGraphImageUrl($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          openGraphImageUrl
        }
      }`,
      {
        owner: repositoryInfo.owner,
        repo: repositoryInfo.name,
      }
    );

    return response?.repository?.openGraphImageUrl ?? undefined;
  }

  private async getLicenseInfo(
    repositoryInfo: Repository
  ): Promise<
    { name: string; spdxId: string | null; url: string | null } | undefined
  > {
    const graphqlClient = this.getGraphQLClient();

    const response = await graphqlClient<{
      repository?: {
        licenseInfo?: {
          name: string;
          spdxId: string;
          url: string;
        }
      }
    }>(
      `query getLicense($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          licenseInfo {
            name
            spdxId
            url
          }
        }
      }`,
      {
        owner: repositoryInfo.owner,
        repo: repositoryInfo.name,
      });

    const licenseInfo = response?.repository?.licenseInfo;
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
