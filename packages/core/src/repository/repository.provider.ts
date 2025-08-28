import { Repository } from './repository.service.js';

/**
 * Interface for repository service providers
 */
export interface RepositoryProvider {
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
}

export const REPOSITORY_PROVIDER_IDENTIFIER = Symbol.for('RepositoryProvider');
