import { Repository } from './repository.service.js';

/**
 * Interface for repository platform adapters
 */
export interface RepositoryAdapter {
    /**
     * Check if this adapter supports the current repository context
     * @returns Promise<boolean> true if this adapter can handle the current repository
     */
    supports(): Promise<boolean>;

    /**
     * Get repository information using this adapter
     * @returns Promise<Repository> repository information
     */
    getRepository(): Promise<Repository>;
}

export const REPOSITORY_ADAPTER_IDENTIFIER = Symbol.for('RepositoryAdapter');