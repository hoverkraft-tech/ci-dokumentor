import {
  RepositoryInfo,
  LicenseInfo,
  ContributingInfo,
  SecurityInfo,
  AbstractRepositoryProvider,
  LicenseService,
  RepositoryOptionsDescriptors,
  ManifestVersion,
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
export class GitHubRepositoryProvider extends AbstractRepositoryProvider<GitHubRepositoryProviderOptions> {
  private githubToken?: string;

  private graphqlClient?: GraphQLClient;

  constructor(
    @inject(GitRepositoryProvider)
    private gitRepositoryProvider: GitRepositoryProvider,
    @inject(LicenseService) private licenseService: LicenseService,
  ) {
    super();
  }

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
      if (!(await this.gitRepositoryProvider.supports())) {
        return false;
      }

      const parsedUrl = await this.gitRepositoryProvider.getRemoteParsedUrl();
      return parsedUrl.source === 'github.com';
    } catch {
      return false;
    }
  }

  protected async fetchRepositoryInfo(): Promise<RepositoryInfo> {
    return this.gitRepositoryProvider.getRepositoryInfo();
  }

  protected async fetchLogo(): Promise<string | undefined> {
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
    const response = await this.graphqlQuery<{
      repository: {
        openGraphImageUrl?: string;
      }
    }>(
      `query getOpenGraphImageUrl($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          openGraphImageUrl
        }
      }`,
    );

    return response?.repository?.openGraphImageUrl ?? undefined;
  }

  protected async fetchLicense(): Promise<LicenseInfo | undefined> {
    const response = await this.graphqlQuery<{
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
      }`
    );

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

  protected async fetchContributing(): Promise<ContributingInfo | undefined> {
    const response = await this.graphqlQuery<{
      repository?: {
        contributingGuidelines?: {
          url: string;
        }
      }
    }>(
      `query getLicense($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          contributingGuidelines {
            url
          }
        }
      }`
    );

    const contributingGuidelines = response?.repository?.contributingGuidelines;
    if (contributingGuidelines) {
      return {
        url: contributingGuidelines.url,
      };
    }
    return undefined;
  }

  protected async fetchSecurity(): Promise<SecurityInfo | undefined> {
    const response = await this.graphqlQuery<{
      repository?: {
        securityPolicyUrl?: string;
      }
    }>(
      `query getSecurity($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          securityPolicyUrl
        }
      }`
    );

    const securityPolicyUrl = response?.repository?.securityPolicyUrl;
    if (securityPolicyUrl) {
      return {
        url: securityPolicyUrl,
      };
    }
    return undefined;
  }

  protected override async fetchLatestVersion(): Promise<ManifestVersion | undefined> {
    return this.gitRepositoryProvider.getLatestVersion();
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

  private async graphqlQuery<Data>(query: string): Promise<Data> {

    const repositoryInfo = await this.getRepositoryInfo();

    const graphqlClient = this.getGraphQLClient();
    return graphqlClient<Data>(
      query,
      {
        owner: repositoryInfo.owner,
        repo: repositoryInfo.name,
      }
    );
  }
}
