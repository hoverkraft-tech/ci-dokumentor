import { ManifestVersion } from '../version/version.service.js';
import { LicenseInfo } from '../license/license.service.js';
import { RepositoryProvider, RepositoryInfo, ContributingInfo, SecurityInfo, RepositoryOptions, RepositoryOptionsDescriptors } from './repository.provider.js';

/**
 * Abstract base class that provides caching for repository providers
 * Subclasses should implement the fetch* methods to retrieve data
 */
export abstract class AbstractRepositoryProvider<Options extends RepositoryOptions = RepositoryOptions> implements RepositoryProvider<Options> {
  private cache = new Map<string, unknown>();

  abstract getPlatformName(): string;
  abstract getPriority(): number;
  abstract supports(): Promise<boolean>;
  abstract getOptions(): RepositoryOptionsDescriptors<Options>;
  abstract setOptions(options: Partial<Options>): void;

  /**
   * Fetch basic repository information (to be implemented by subclasses)
   */
  protected abstract fetchRepositoryInfo(): Promise<RepositoryInfo>;

  /**
   * Fetch repository logo URI (to be implemented by subclasses)
   */
  protected abstract fetchLogo(): Promise<string | undefined>;

  /**
   * Fetch license information (to be implemented by subclasses)
   */
  protected abstract fetchLicense(): Promise<LicenseInfo | undefined>;

  /**
   * Fetch the latest version information (to be implemented by subclasses)
   */
  protected abstract fetchLatestVersion(): Promise<ManifestVersion | undefined>;

  /**
   * Fetch contributing guidelines information (to be implemented by subclasses)
   */
  protected abstract fetchContributing(): Promise<ContributingInfo | undefined>;

  /**
   * Fetch security policy information (to be implemented by subclasses)
   */
  protected abstract fetchSecurity(): Promise<SecurityInfo | undefined>;

  /**
   * Get basic repository information with caching
   */
  async getRepositoryInfo(): Promise<RepositoryInfo> {
    return this.getCached('repositoryInfo', () => this.fetchRepositoryInfo());
  }

  /**
   * Get repository logo URI with caching
   */
  async getLogo(): Promise<string | undefined> {
    return this.getCached('logo', () => this.fetchLogo());
  }

  /**
   * Get license information with caching
   */
  async getLicense(): Promise<LicenseInfo | undefined> {
    return this.getCached('license', () => this.fetchLicense());
  }

  /**
   * Get contributing guidelines information with caching
   */
  async getContributing(): Promise<ContributingInfo | undefined> {
    return this.getCached('contributing', () => this.fetchContributing());
  }

  /**
   * Get security policy information with caching
   */
  async getSecurity(): Promise<SecurityInfo | undefined> {
    return this.getCached('security', () => this.fetchSecurity());
  }

  /**
   * Get the latest version information with caching
   */
  async getLatestVersion(): Promise<ManifestVersion | undefined> {
    return this.getCached('latestVersion', async () => this.fetchLatestVersion());
  }

  /**
   * Generic caching helper
   */
  private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const result = await fetcher();
    this.cache.set(key, result);
    return result;
  }

  /**
   * Clear all cached data (useful for testing)
   */
  protected clearCache(): void {
    this.cache.clear();
  }
}