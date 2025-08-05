import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { GitHubRepositoryProvider } from './github-repository.provider.js';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';

// Mock the GitRepositoryProvider
vi.mock('@ci-dokumentor/repository-git', () => ({
    GitRepositoryProvider: vi.fn()
}));

describe('GitHubRepositoryProvider', () => {
    let gitHubRepositoryProvider: GitHubRepositoryProvider;
    let mockGitRepositoryService: Mocked<GitRepositoryProvider>;

    beforeEach(() => {
        // Create a mock git repository service
        mockGitRepositoryService = {
            supports: vi.fn(),
            getRepository: vi.fn(),
            getRemoteParsedUrl: vi.fn(),
        } as unknown as Mocked<GitRepositoryProvider>;

        gitHubRepositoryProvider = new GitHubRepositoryProvider(mockGitRepositoryService);
    });

    describe('supports', () => {
        it('should return true for GitHub HTTPS URL', async () => {
            // Arrange
            const mockParsedUrl = {
                source: 'github.com',
                owner: 'owner',
                name: 'repo'
            };
            mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(mockParsedUrl);

            // Act
            const result = await gitHubRepositoryProvider.supports();

            // Assert
            expect(result).toBe(true);
        });

        it('should return true for GitHub SSH URL', async () => {
            // Arrange
            const mockParsedUrl = {
                source: 'github.com',
                owner: 'owner',
                name: 'repo'
            };
            mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(mockParsedUrl);

            // Act
            const result = await gitHubRepositoryProvider.supports();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false for GitLab URL', async () => {
            // Arrange
            const mockParsedUrl = {
                source: 'gitlab.com',
                owner: 'owner',
                name: 'repo'
            };
            mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(mockParsedUrl);

            // Act
            const result = await gitHubRepositoryProvider.supports();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false for Bitbucket URL', async () => {
            // Arrange
            const mockParsedUrl = {
                source: 'bitbucket.org',
                owner: 'owner',
                name: 'repo'
            };
            mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(mockParsedUrl);

            // Act
            const result = await gitHubRepositoryProvider.supports();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when getRemoteParsedUrl throws an error', async () => {
            // Arrange
            mockGitRepositoryService.getRemoteParsedUrl.mockRejectedValue(new Error('Git error'));

            // Act
            const result = await gitHubRepositoryProvider.supports();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('getRepository', () => {
        it('should extend base repository with logo information', async () => {
            // Mock the git repository service method
            const mockBaseRepo = {
                owner: 'test-owner',
                name: 'test-repo',
                url: 'https://github.com/test-owner/test-repo',
                fullName: 'test-owner/test-repo'
            };

            mockGitRepositoryService.getRepository.mockResolvedValue(mockBaseRepo);

            // Mock file system check
            vi.mock('node:fs', () => ({
                existsSync: vi.fn().mockReturnValue(false)
            }));

            // Mock GitHub API
            vi.mock('@octokit/graphql', () => ({
                graphql: vi.fn().mockResolvedValue({
                    repository: {
                        openGraphImageUrl: 'https://github.com/test-owner/test-repo/social-preview.png'
                    }
                })
            }));

            const result = await gitHubRepositoryProvider.getRepository();

            expect(result).toEqual({
                ...mockBaseRepo,
                logo: 'https://github.com/test-owner/test-repo/social-preview.png'
            });
        });
    });
});