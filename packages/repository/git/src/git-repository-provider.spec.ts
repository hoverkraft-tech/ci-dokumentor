import { describe, it, expect, beforeEach, vi, Mocked, MockInstance } from 'vitest';
import { GitRepositoryProvider } from './git-repository-provider.js';
import { simpleGit } from 'simple-git';
import gitUrlParse from 'git-url-parse';

// Mock the dependencies
vi.mock('simple-git');
vi.mock('git-url-parse');

describe('GitRepositoryProvider', () => {
  let provider: GitRepositoryProvider;
  let mockGit: Mocked<ReturnType<typeof simpleGit>>;
  let mockGitUrlParse: MockInstance<typeof gitUrlParse>;

  beforeEach(() => {
    provider = new GitRepositoryProvider();

    // Create a mock git instance
    mockGit = {
      getRemotes: vi.fn(),
    } as unknown as Mocked<ReturnType<typeof simpleGit>>;

    // Mock simpleGit to return our mock instance
    vi.mocked(simpleGit).mockReturnValue(mockGit);

    // Mock gitUrlParse
    mockGitUrlParse = vi.mocked(gitUrlParse) as unknown as MockInstance<typeof gitUrlParse>;

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
      } as unknown as gitUrlParse.GitUrl;
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
      } as unknown as gitUrlParse.GitUrl;
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
      } as unknown as gitUrlParse.GitUrl;
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
      } as unknown as gitUrlParse.GitUrl;
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
      mockGit.getRemotes.mockResolvedValue([]);

      // Act & Assert
      await expect(provider.getRemoteParsedUrl()).rejects.toThrow(
        'No remote "origin" found'
      );
    });
  });

  describe('setOptions and version handling', () => {
    beforeEach(() => {
      // Mock common git commands for version tests
      mockGit = {
        ...mockGit,
        revparse: vi.fn(),
        tags: vi.fn(),
      } as unknown as Mocked<ReturnType<typeof simpleGit>>;
      vi.mocked(simpleGit).mockReturnValue(mockGit);
    });

    it('should handle user-provided SHA version (40 hex characters)', async () => {
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
        toString: () => 'https://github.com/test-owner/test-repo.git',
      } as unknown as gitUrlParse.GitUrl;
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Set user version as a SHA
      provider.setOptions({ version: '08c6903cd8c0fde910a37f88322edcfb5dd907a8' });

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result.version).toEqual({
        sha: '08c6903cd8c0fde910a37f88322edcfb5dd907a8',
      });
      // Git commands should not be called when user provides version
      expect(mockGit.revparse).not.toHaveBeenCalled();
      expect(mockGit.tags).not.toHaveBeenCalled();
    });

    it('should handle user-provided ref version (non-SHA)', async () => {
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
        toString: () => 'https://github.com/test-owner/test-repo.git',
      } as unknown as gitUrlParse.GitUrl;
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Set user version as a tag/ref
      provider.setOptions({ version: 'v1.0.0' });

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result.version).toEqual({
        ref: 'v1.0.0',
      });
      // Git commands should not be called when user provides version
      expect(mockGit.revparse).not.toHaveBeenCalled();
      expect(mockGit.tags).not.toHaveBeenCalled();
    });

    it('should auto-detect version when no user version provided', async () => {
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
        toString: () => 'https://github.com/test-owner/test-repo.git',
      } as unknown as gitUrlParse.GitUrl;
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Mock git commands for auto-detection
      mockGit.revparse.mockImplementation((args) => {
        if (args === 'HEAD') {
          return Promise.resolve('abc123def456789');
        }
        if (args[0] === '--abbrev-ref' && args[1] === 'HEAD') {
          return Promise.resolve('main');
        }
        return Promise.reject(new Error('Unknown revparse'));
      });

      mockGit.tags.mockResolvedValue({
        latest: 'v2.0.0',
        all: ['v1.0.0', 'v2.0.0'],
      });

      // No user options provided
      provider.setOptions({});

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result.version).toEqual({
        ref: 'v2.0.0',
        sha: 'abc123def456789',
      });
      expect(mockGit.revparse).toHaveBeenCalledWith('HEAD');
      expect(mockGit.tags).toHaveBeenCalledWith(['--points-at', 'HEAD']);
    });

    it('should fallback to branch name when no tag available', async () => {
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
        toString: () => 'https://github.com/test-owner/test-repo.git',
      } as unknown as gitUrlParse.GitUrl;
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Mock git commands - no tags available
      mockGit.revparse.mockImplementation((args) => {
        if (args === 'HEAD') {
          return Promise.resolve('xyz789abc123');
        }
        if (args[0] === '--abbrev-ref' && args[1] === 'HEAD') {
          return Promise.resolve('develop');
        }
        return Promise.reject(new Error('Unknown revparse'));
      });

      mockGit.tags.mockResolvedValue({
        latest: '',
        all: [],
      });

      // No user options provided
      provider.setOptions({});

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result.version).toEqual({
        ref: 'develop',
        sha: 'xyz789abc123',
      });
    });

    it('should return no version info when auto-detection fails', async () => {
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
        toString: () => 'https://github.com/test-owner/test-repo.git',
      } as unknown as gitUrlParse.GitUrl;
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Mock git commands to fail
      mockGit.revparse.mockRejectedValue(new Error('Git not available'));
      mockGit.tags.mockRejectedValue(new Error('Git not available'));

      // No user options provided
      provider.setOptions({});

      // Act
      const result = await provider.getRepository();

      // Assert
      expect(result.version).toBeUndefined();
    });
  });
});
