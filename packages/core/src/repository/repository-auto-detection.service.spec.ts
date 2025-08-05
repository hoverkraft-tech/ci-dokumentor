import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { RepositoryService } from './repository.service.js';
import { RepositoryProvider } from './repository.provider.js';
import { simpleGit } from 'simple-git';

// Mock the simple-git module
vi.mock('simple-git');

// Mock provider classes
class MockGitHubProvider implements RepositoryProvider {
    async supports(): Promise<boolean> {
        return true;
    }

    async getRepository() {
        return {
            owner: 'github-owner',
            name: 'github-repo',
            url: 'https://github.com/github-owner/github-repo',
            fullName: 'github-owner/github-repo',
            logo: 'https://github.com/github-owner/github-repo/logo.png'
        };
    }
}

class MockGitLabProvider implements RepositoryProvider {
    async supports(): Promise<boolean> {
        return false; // Will not be selected in our tests
    }

    async getRepository() {
        return {
            owner: 'gitlab-owner',
            name: 'gitlab-repo',
            url: 'https://gitlab.com/gitlab-owner/gitlab-repo',
            fullName: 'gitlab-owner/gitlab-repo'
        };
    }
}

class MockFailingProvider implements RepositoryProvider {
    async supports(): Promise<boolean> {
        throw new Error('Provider failure');
    }

    async getRepository() {
        throw new Error('Should not be called');
    }
}

describe('RepositoryService with providers', () => {
    let repositoryService: RepositoryService;
    let mockGit: Mocked<ReturnType<typeof simpleGit>>;

    beforeEach(() => {
        // Create a mock git instance
        mockGit = {
            getRemotes: vi.fn(),
        } as unknown as Mocked<ReturnType<typeof simpleGit>>;

        // Mock simpleGit to return our mock instance
        vi.mocked(simpleGit).mockReturnValue(mockGit);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('auto-detection with providers', () => {
        it('should use the first supporting provider', async () => {
            // Arrange
            const mockGitHubProvider = new MockGitHubProvider();
            const mockGitLabProvider = new MockGitLabProvider();
            const providers = [mockGitHubProvider, mockGitLabProvider];
            
            repositoryService = new RepositoryService(providers);

            // Act
            const result = await repositoryService.getRepository();

            // Assert
            expect(result).toEqual({
                owner: 'github-owner',
                name: 'github-repo',
                url: 'https://github.com/github-owner/github-repo',
                fullName: 'github-owner/github-repo',
                logo: 'https://github.com/github-owner/github-repo/logo.png'
            });
        });

        it('should throw error when failing providers are encountered', async () => {
            // Arrange
            const mockFailingProvider = new MockFailingProvider();
            const providers = [mockFailingProvider];
            
            repositoryService = new RepositoryService(providers);

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('Provider failure');
        });

        it('should throw error when no providers support the context', async () => {
            // Arrange
            const mockGitLabProvider = new MockGitLabProvider(); // Returns false for supports()
            const providers = [mockGitLabProvider];
            
            repositoryService = new RepositoryService(providers);

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('No repository provider found that supports the current context');
        });

        it('should throw error when no providers are provided', async () => {
            // Arrange
            repositoryService = new RepositoryService([]);

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('No repository provider found that supports the current context');
        });

        it('should throw error when providers is undefined', async () => {
            // Arrange - Constructor will use default empty array
            repositoryService = new RepositoryService();

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('No repository provider found that supports the current context');
        });
    });
});