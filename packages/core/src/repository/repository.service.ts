import { injectable, multiInject, optional } from 'inversify';
import {
  RepositoryProvider,
  REPOSITORY_PROVIDER_IDENTIFIER,
} from './repository.provider.js';

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
