import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RepositoryService } from '@ci-dokumentor/core';
import { GitHubRepositoryService } from './github-repository.service.js';
import { initContainer } from './container.js';

describe('Integration: Auto-detection with real providers', () => {
    beforeEach(() => {
        // Reset any global state
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should auto-detect GitHub repository when using DI container', () => {
        // Arrange
        const container = initContainer();
        
        // Act - Get the repository service which should have GitHub provider registered
        const repositoryService = container.get(RepositoryService);
        const gitHubService = container.get(GitHubRepositoryService);

        // Assert
        expect(repositoryService).toBeInstanceOf(RepositoryService);
        expect(gitHubService).toBeInstanceOf(GitHubRepositoryService);
        
        // Verify that the repository service has providers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((repositoryService as any).providers).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((repositoryService as any).providers.length).toBeGreaterThan(0);
    });
});