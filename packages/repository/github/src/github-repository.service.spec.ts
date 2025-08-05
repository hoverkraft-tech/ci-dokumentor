import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { GitHubRepositoryService } from './github-repository.service.js';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { simpleGit } from 'simple-git';

// Mock the simple-git module
vi.mock('simple-git');

// Mock the GitRepositoryProvider
vi.mock('@ci-dokumentor/repository-git', () => ({
    GitRepositoryProvider: vi.fn()
}));

describe('GitHubRepositoryService', () => {
    let service: GitHubRepositoryService;
    let mockGit: Mocked<ReturnType<typeof simpleGit>>;
    let mockBasicRepositoryService: Mocked<GitRepositoryProvider>;

    beforeEach(() => {
        // Create a mock basic repository service
        mockBasicRepositoryService = {
            supports: vi.fn(),
            getRepository: vi.fn(),
        } as unknown as Mocked<GitRepositoryProvider>;

        service = new GitHubRepositoryService(mockBasicRepositoryService);

        // Create a mock git instance
        mockGit = {
            getRemotes: vi.fn(),
        } as unknown as Mocked<ReturnType<typeof simpleGit>>;

        // Mock simpleGit to return our mock instance
        vi.mocked(simpleGit).mockReturnValue(mockGit);
    });

    describe('supports', () => {
        it('should return true for GitHub HTTPS URL', async () => {
            // Arrange
            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: 'https://github.com/owner/repo.git',
                        push: 'https://github.com/owner/repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await service.supports();

            // Assert
            expect(result).toBe(true);
        });

        it('should return true for GitHub SSH URL', async () => {
            // Arrange
            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: 'git@github.com:owner/repo.git',
                        push: 'git@github.com:owner/repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await service.supports();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false for GitLab URL', async () => {
            // Arrange
            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: 'https://gitlab.com/owner/repo.git',
                        push: 'https://gitlab.com/owner/repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await service.supports();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false for Bitbucket URL', async () => {
            // Arrange
            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: 'https://bitbucket.org/owner/repo.git',
                        push: 'https://bitbucket.org/owner/repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await service.supports();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when no origin remote exists', async () => {
            // Arrange
            const mockRemotes = [
                {
                    name: 'upstream',
                    refs: {
                        fetch: 'https://github.com/owner/repo.git',
                        push: 'https://github.com/owner/repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await service.supports();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when origin remote has no fetch URL', async () => {
            // Arrange
            const mockRemotes = [
                {
                    name: 'origin',
                    refs: {
                        fetch: '',
                        push: 'https://github.com/owner/repo.git'
                    }
                }
            ];
            mockGit.getRemotes.mockResolvedValue(mockRemotes);

            // Act
            const result = await service.supports();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when git operations fail', async () => {
            // Arrange
            mockGit.getRemotes.mockRejectedValue(new Error('Git error'));

            // Act
            const result = await service.supports();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('getRepository', () => {
        it('should extend base repository with logo information', async () => {
            // Mock the basic repository service method
            const mockBaseRepo = {
                owner: 'test-owner',
                name: 'test-repo',
                url: 'https://github.com/test-owner/test-repo',
                fullName: 'test-owner/test-repo'
            };

            mockBasicRepositoryService.getRepository.mockResolvedValue(mockBaseRepo);

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

            const result = await service.getRepository();

            expect(result).toEqual({
                ...mockBaseRepo,
                logo: 'https://github.com/test-owner/test-repo/social-preview.png'
            });
        });
    });
});