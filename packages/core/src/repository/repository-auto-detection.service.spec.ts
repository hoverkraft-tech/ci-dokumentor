import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { RepositoryService } from './repository.service.js';
import { RepositoryAdapter } from './repository.adapter.js';
import { simpleGit } from 'simple-git';

// Mock the simple-git module
vi.mock('simple-git');

// Mock adapter classes
class MockGitHubAdapter implements RepositoryAdapter {
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

class MockGitLabAdapter implements RepositoryAdapter {
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

class MockFailingAdapter implements RepositoryAdapter {
    async supports(): Promise<boolean> {
        throw new Error('Adapter failure');
    }

    async getRepository() {
        throw new Error('Should not be called');
    }
}

describe('RepositoryService with adapters', () => {
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

    describe('auto-detection with adapters', () => {
        it('should use the first supporting adapter', async () => {
            // Arrange
            const mockGitHubAdapter = new MockGitHubAdapter();
            const mockGitLabAdapter = new MockGitLabAdapter();
            const adapters = [mockGitHubAdapter, mockGitLabAdapter];
            
            repositoryService = new RepositoryService(adapters);

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

        it('should skip failing adapters and continue to next', async () => {
            // Arrange
            const mockFailingAdapter = new MockFailingAdapter();
            const mockGitHubAdapter = new MockGitHubAdapter();
            const adapters = [mockFailingAdapter, mockGitHubAdapter];
            
            repositoryService = new RepositoryService(adapters);

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

        it('should fall back to basic implementation when no adapters support the context', async () => {
            // Arrange
            const mockGitLabAdapter = new MockGitLabAdapter(); // Returns false for supports()
            const adapters = [mockGitLabAdapter];
            
            repositoryService = new RepositoryService(adapters);

            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: 'https://github.com/fallback-owner/fallback-repo.git',
                        push: 'https://github.com/fallback-owner/fallback-repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await repositoryService.getRepository();

            // Assert
            expect(result).toEqual({
                owner: 'fallback-owner',
                name: 'fallback-repo',
                url: 'https://github.com/fallback-owner/fallback-repo',
                fullName: 'fallback-owner/fallback-repo'
            });
        });

        it('should fall back to basic implementation when no adapters are provided', async () => {
            // Arrange
            repositoryService = new RepositoryService([]);

            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: 'https://github.com/no-adapter/basic-repo.git',
                        push: 'https://github.com/no-adapter/basic-repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await repositoryService.getRepository();

            // Assert
            expect(result).toEqual({
                owner: 'no-adapter',
                name: 'basic-repo',
                url: 'https://github.com/no-adapter/basic-repo',
                fullName: 'no-adapter/basic-repo'
            });
        });

        it('should use basic implementation when adapters is undefined', async () => {
            // Arrange - Constructor will use default empty array
            repositoryService = new RepositoryService();

            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: 'https://github.com/default/repo.git',
                        push: 'https://github.com/default/repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await repositoryService.getRepository();

            // Assert
            expect(result).toEqual({
                owner: 'default',
                name: 'repo',
                url: 'https://github.com/default/repo',
                fullName: 'default/repo'
            });
        });
    });
});