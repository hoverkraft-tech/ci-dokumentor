import { describe, it, expect } from 'vitest';
import { initContainer } from './container.js';
import { GitHubRepositoryProvider } from './github-repository.provider.js';
import { initContainer as initGitContainer } from '@ci-dokumentor/repository-git';

describe('GitHub Repository Platform Container', () => {
    it('should initialize container with GitHubRepositoryProvider when base container provided', () => {
        // Create base container with git provider
        const baseContainer = initGitContainer();
        const container = initContainer(baseContainer);
        
        expect(container.isBound(GitHubRepositoryProvider)).toBe(true);
        
        const service = container.get(GitHubRepositoryProvider);
        expect(service).toBeInstanceOf(GitHubRepositoryProvider);
    });

    it('should return same container instance when called multiple times', () => {
        const baseContainer = initGitContainer();
        const container1 = initContainer(baseContainer);
        const container2 = initContainer();
        
        expect(container1).toBe(container2);
    });
});