import { injectable, multiInject, optional } from 'inversify';
import {
  RepositoryProvider,
  REPOSITORY_PROVIDER_IDENTIFIER,
} from './repository.provider.js';

export type Repository = {
  owner: string;
  name: string;
  url: string; // The URL of the repository, without the .git suffix
  fullName: string; // owner/name format
  logo?: string; // Optional logo URI
  license?: {
    name: string;
    spdxId: string | null;
    url: string | null;
  }; // Optional license information
  contributing?: {
    url: string;
  }; // Optional contributing information
};

@injectable()
export class RepositoryService {
  constructor(
    @multiInject(REPOSITORY_PROVIDER_IDENTIFIER)
    @optional()
    private providers: RepositoryProvider[] = []
  ) {
    // Sort providers by priority in descending order (highest priority first)
    this.providers = this.providers.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Get list of supported repository platforms based on registered providers
   */
  getSupportedRepositoryPlatforms(): string[] {
    return this.providers.map((provider) => provider.getPlatformName());
  }

  async getRepository(): Promise<Repository> {
    // Try to auto-detect using providers first
    const detectedProvider = await this.autoDetectRepositoryProvider();
    if (detectedProvider) {
      return await detectedProvider.getRepository();
    }

    // If no provider supports the current context, throw an error
    throw new Error(
      'No repository provider found that supports the current context'
    );
  }

  /**
   * Auto-detect the appropriate repository provider for the current context
   */
  async autoDetectRepositoryProvider(): Promise<RepositoryProvider | undefined> {
    for (const provider of this.providers) {
      if (await provider.supports()) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Get the repository provider by platform name
   */
  getRepositoryProviderByPlatform(platform: string): RepositoryProvider | undefined {
    return this.providers.find((provider) => provider.getPlatformName() === platform);
  }
}
