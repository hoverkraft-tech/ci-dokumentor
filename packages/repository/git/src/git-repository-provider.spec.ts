import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { GitRepositoryProvider } from './git-repository-provider.js';
import { simpleGit } from 'simple-git';
import gitUrlParse from 'git-url-parse';

// Mock the dependencies
vi.mock('simple-git');
vi.mock('git-url-parse');

describe('GitRepositoryProvider', () => {
  let provider: GitRepositoryProvider;
  let mockGit: Mocked<ReturnType<typeof simpleGit>>;
  let mockGitUrlParse: Mocked<typeof gitUrlParse>;

  beforeEach(() => {
    provider = new GitRepositoryProvider();

    // Create a mock git instance
    mockGit = {
      getRemotes: vi.fn(),
    } as unknown as Mocked<ReturnType<typeof simpleGit>>;

    // Mock simpleGit to return our mock instance
    vi.mocked(simpleGit).mockReturnValue(mockGit);

    // Mock gitUrlParse
    mockGitUrlParse = vi.mocked(gitUrlParse);
  });

  describe('getPlatformName', () => {
    it('should return "git" as platform name', () => {
      // Act
      const result = provider.getPlatformName();

      // Assert
      expect(result).toBe('git');
    });
  });

  describe('supports', () => {
    it('should return true when origin remote with fetch URL exists', async () => {
      // Arrange
      const mockRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/owner/repo.git',
            push: 'https://github.com/owner/repo.git',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      // Act
      const result = await provider.supports();

      // Assert
      expect(result).toBe(true);
      expect(mockGit.getRemotes).toHaveBeenCalledWith(true);
    });

    it('should return false when no origin remote exists', async () => {
      // Arrange
      const mockRemotes = [
        {
          name: 'upstream',
          refs: {
            fetch: 'https://github.com/owner/repo.git',
            push: 'https://github.com/owner/repo.git',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      // Act
      const result = await provider.supports();

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
            push: 'https://github.com/owner/repo.git',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      // Act
      const result = await provider.supports();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when git operations fail', async () => {
      // Arrange
      mockGit.getRemotes.mockRejectedValue(new Error('Git error'));

      // Act
      const result = await provider.supports();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getRepository', () => {
    it('should return repository information from parsed git URL', async () => {
      // Arrange
      const mockRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/test-owner/test-repo.git',
            push: 'https://github.com/test-owner/test-repo.git',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      const mockParsedUrl = {
        owner: 'test-owner',
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        toString: vi
          .fn()
          .mockReturnValue('https://github.com/test-owner/test-repo.git'),
      };
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result).toEqual({
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://github.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo',
      });
      expect(mockGitUrlParse).toHaveBeenCalledWith(
        'https://github.com/test-owner/test-repo.git'
      );
    });

    it('should handle URL without .git suffix', async () => {
      // Arrange
      const mockRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/test-owner/test-repo',
            push: 'https://github.com/test-owner/test-repo',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      const mockParsedUrl = {
        owner: 'test-owner',
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        toString: vi
          .fn()
          .mockReturnValue('https://github.com/test-owner/test-repo'),
      };
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result).toEqual({
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://github.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo',
      });
    });

    it('should use owner/name format when full_name is not available', async () => {
      // Arrange
      const mockRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/test-owner/test-repo.git',
            push: 'https://github.com/test-owner/test-repo.git',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      const mockParsedUrl = {
        owner: 'test-owner',
        name: 'test-repo',
        full_name: undefined,
        toString: vi
          .fn()
          .mockReturnValue('https://github.com/test-owner/test-repo.git'),
      };
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result.fullName).toBe('test-owner/test-repo');
    });

    it('should throw error when no origin remote found', async () => {
      // Arrange
      const mockRemotes = [
        {
          name: 'upstream',
          refs: {
            fetch: 'https://github.com/owner/repo.git',
            push: 'https://github.com/owner/repo.git',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      // Act & Assert
      await expect(provider.getRepository()).rejects.toThrow(
        'No remote "origin" found'
      );
    });
  });

  describe('getRemoteParsedUrl', () => {
    it('should return parsed URL from git remote', async () => {
      // Arrange
      const mockRemotes = [
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/test-owner/test-repo.git',
            push: 'https://github.com/test-owner/test-repo.git',
          },
        },
      ];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      const mockParsedUrl = {
        owner: 'test-owner',
        name: 'test-repo',
        source: 'github.com',
      };
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Act
      const result = await provider.getRemoteParsedUrl();

      // Assert
      expect(result).toEqual(mockParsedUrl);
      expect(mockGitUrlParse).toHaveBeenCalledWith(
        'https://github.com/test-owner/test-repo.git'
      );
    });

    it('should throw error when no origin remote found', async () => {
      // Arrange
      const mockRemotes: any[] = [];
      mockGit.getRemotes.mockResolvedValue(mockRemotes);

      // Act & Assert
      await expect(provider.getRemoteParsedUrl()).rejects.toThrow(
        'No remote "origin" found'
      );
    });
  });
});
