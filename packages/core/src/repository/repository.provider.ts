import { ManifestVersion } from '../version/version.service.js';
import type { OptionDescriptor } from '../options/options.js';
import { LicenseInfo } from '../license/license.service.js';

export const REPOSITORY_PROVIDER_IDENTIFIER = Symbol.for('RepositoryProvider');

export type RepositoryOptions = Record<string, unknown>;

export type RepositoryOptionsDescriptors<Options extends RepositoryOptions = RepositoryOptions> = Record<keyof Options, OptionDescriptor>;

/**
 * Basic repository information without optional metadata
 */
export interface RepositoryInfo {
  rootDir: string; // Root directory of the repository
  owner: string; // Owner of the repository (user or organization)
  name: string; // Name of the repository
  url: string; // The URL of the repository, without the .git suffix
  fullName: string; // owner/name format
}

/**
 * Contributing guidelines information
 */
export interface ContributingInfo {
  url: string;
}

/**
 * Interface for repository service providers
 */
export interface RepositoryProvider<Options extends RepositoryOptions = RepositoryOptions> {

  /**
   * Get the platform name identifier for this provider
   * @returns string the platform name (e.g., 'git', 'github')
   */
  getPlatformName(): string;

  /**
   * Get the priority of this provider for auto-detection
   * Higher values indicate higher priority and will be checked first
   * @returns number the priority value (default: 0)
   */
  getPriority(): number;

  /**
   * Check if this provider supports the current repository context
   * @returns Promise<boolean> true if this provider can handle the current repository
   */
  supports(): Promise<boolean>;

  /**
   * Get basic repository information
   * @returns Promise<RepositoryInfo> basic repository information
   */
  getRepositoryInfo(): Promise<RepositoryInfo>;

  /**
   * Get repository logo URI
   * @returns Promise<string | undefined> logo URI or undefined if not available
   */
  getLogo(): Promise<string | undefined>;

  /**
   * Get license information for the repository
   * @returns Promise<LicenseInfo | undefined> license information or undefined if not available
   */
  getLicense(): Promise<LicenseInfo | undefined>;

  /**
   * Get contributing guidelines information
   * @returns Promise<ContributingInfo | undefined> contributing information or undefined if not available
   */
  getContributing(): Promise<ContributingInfo | undefined>;

  /**
   * Get the latest version information (e.g., latest tag or commit SHA)
   * @returns Promise<ManifestVersion | undefined> latest version information or undefined if not available
   */
  getLatestVersion(): Promise<ManifestVersion | undefined>;

  /**
   * Optional: provide CLI option descriptors specific to this repository provider
   */
  getOptions(): RepositoryOptionsDescriptors<Options>;

  /**
   * Optional: apply runtime option values to the provider.
   * Implementations should accept a plain record of option values where keys
   * are the canonical option names (e.g. `githubToken`) or environment names
   * and apply them as appropriate. Providers are expected to enforce
   * identity/uniqueness of options on their side if needed.
   */
  setOptions(options: Partial<Options>): void;
}
