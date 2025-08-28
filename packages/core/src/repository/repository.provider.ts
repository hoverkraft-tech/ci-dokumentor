import { Repository } from './repository.service.js';
import type { OptionDescriptor } from '../options/options.js';

export const REPOSITORY_PROVIDER_IDENTIFIER = Symbol.for('RepositoryProvider');

export type RepositoryOptions = Record<string, unknown>;

export type RepositoryOptionsDescriptors<Options extends RepositoryOptions> = Record<keyof Options, OptionDescriptor>;

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
   * Get repository information using this provider
   * @returns Promise<Repository> repository information
   */
  getRepository(): Promise<Repository>;

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
