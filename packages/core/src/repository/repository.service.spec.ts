import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import { RepositoryService } from './repository.service.js';
import { simpleGit } from 'simple-git';

// Mock the simple-git module
vi.mock('simple-git');

describe('RepositoryService', () => {
    let repositoryService: RepositoryService;
    let mockGit: Mocked<ReturnType<typeof simpleGit>>;

    beforeEach(() => {
        repositoryService = new RepositoryService();

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

    describe('getRepository', () => {
        it.each([
            {
                description: 'HTTPS remote URL',
                remote: 'https://github.com/owner/repo.git',
                url: 'https://github.com/owner/repo',
                owner: 'owner',
                name: 'repo',
                fullName: 'owner/repo',
            },
            {
                description: 'SSH remote URL',
                remote: 'git@github.com:owner/repo.git',
                url: 'https://github.com/owner/repo',
                owner: 'owner',
                name: 'repo',
                fullName: 'owner/repo',
            },
            {
                description: 'remote without .git suffix',
                remote: 'https://github.com/owner/repo',
                url: 'https://github.com/owner/repo',
                owner: 'owner',
                name: 'repo',
                fullName: 'owner/repo',
            },
            {
                description: 'repository with complex name structure',
                remote: 'https://github.com/owner/repo-name.git',
                url: 'https://github.com/owner/repo-name',
                owner: 'owner',
                name: 'repo-name',
                fullName: 'owner/repo-name',
            },
            {
                description: 'GitLab repository',
                remote: 'https://gitlab.com/owner/repo.git',
                url: 'https://gitlab.com/owner/repo',
                owner: 'owner',
                name: 'repo',
                fullName: 'owner/repo',
            },
            {
                description: 'Bitbucket repository',
                remote: 'https://bitbucket.org/owner/repo.git',
                url: 'https://bitbucket.org/owner/repo',
                owner: 'owner',
                name: 'repo',
                fullName: 'owner/repo',
            }
        ])
            ('should return repository information for $description', async ({ remote, url, fullName, owner, name }) => {
                // Arrange
                const mockRemotes = [
                    {
                        name: 'origin',
                        refs: {
                            fetch: remote,
                            push: remote
                        }
                    }
                ];
                mockGit.getRemotes.mockResolvedValue(mockRemotes);

                // Act
                const result = await repositoryService.getRepository();

                // Assert
                expect(result).toEqual({
                    url,
                    fullName,
                    owner,
                    name,
                });
                expect(mockGit.getRemotes).toHaveBeenCalledWith(true);
            });

        it('should throw error when no origin remote is found', async () => {
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

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('No remote "origin" found');
        });

        it('should throw error when origin remote has no fetch URL', async () => {
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

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('No remote "origin" found');
        });

        it('should throw error when remotes array is empty', async () => {
            // Arrange
            mockGit.getRemotes.mockResolvedValue([]);

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('No remote "origin" found');
        });
    });
});
