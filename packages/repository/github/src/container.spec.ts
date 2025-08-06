import { describe, it, expect } from 'vitest';
import { initContainer } from './container.js';
import { GitHubRepositoryProvider } from './github-repository.provider.js';
import { Container, initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { initContainer as initGitContainer } from '@ci-dokumentor/repository-git';

describe('GitHub Repository Platform Container', () => {
    it('should initialize container with GitHubRepositoryProvider when base container provided', () => {
        // Create base container with core and git services
        const baseContainer = coreInitContainer();
        initGitContainer(baseContainer);
        const container = initContainer(baseContainer);
        
        expect(container.isBound(GitHubRepositoryProvider)).toBe(true);
        
        const gitHubRepositoryProvider = container.get(GitHubRepositoryProvider);
        expect(gitHubRepositoryProvider).toBeInstanceOf(GitHubRepositoryProvider);
    });
});