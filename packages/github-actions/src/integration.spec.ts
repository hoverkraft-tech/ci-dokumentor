import { describe, it, expect } from 'vitest';
import { GitHubRepositoryService, initGitHubActionsContainer } from './index.js';

describe('GitHub Actions Package Integration', () => {
    it('should export all necessary components', () => {
        expect(GitHubRepositoryService).toBeDefined();
        expect(initGitHubActionsContainer).toBeDefined();
    });

    it('should initialize container with all services', () => {
        const container = initGitHubActionsContainer();
        
        expect(container.isBound(GitHubRepositoryService)).toBe(true);
        
        const service = container.get(GitHubRepositoryService);
        expect(service).toBeInstanceOf(GitHubRepositoryService);
    });
});