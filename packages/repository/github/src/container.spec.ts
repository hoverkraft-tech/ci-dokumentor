import { describe, it, expect } from 'vitest';
import { initContainer } from './container.js';
import { GitHubRepositoryService } from './github-repository.service.js';

describe('GitHub Repository Platform Container', () => {
    it('should initialize container with GitHubRepositoryService', () => {
        const container = initContainer();
        
        expect(container.isBound(GitHubRepositoryService)).toBe(true);
        
        const service = container.get(GitHubRepositoryService);
        expect(service).toBeInstanceOf(GitHubRepositoryService);
    });

    it('should return same container instance when called multiple times', () => {
        const container1 = initContainer();
        const container2 = initContainer();
        
        expect(container1).toBe(container2);
    });
});