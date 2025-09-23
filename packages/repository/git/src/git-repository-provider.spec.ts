import { describe, it, expect, beforeEach, vi, Mocked, MockInstance } from 'vitest';
import { simpleGit, TagResult, Response, FetchResult } from 'simple-git';
import gitUrlParse from 'git-url-parse';
import { GitRepositoryProvider } from './git-repository-provider.js';

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
      revparse: vi.fn(),
      tags: vi.fn(),
      fetch: vi.fn(),
      raw: vi.fn(),
    } as unknown as Mocked<ReturnType<typeof simpleGit>>;

    // Mock simpleGit to return our mock instance
    vi.mocked(simpleGit).mockReturnValue(mockGit);

    // Mock gitUrlParse
    mockGitUrlParse = gitUrlParse as unknown as MockInstance<typeof gitUrlParse>;

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

  describe('getRepositoryInfo', () => {
    it('should return repository info with sanitized url and fullName', async () => {
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
        full_name: 'test-owner/test-repo',
        toString: () => 'https://github.com/test-owner/test-repo.git',
      } as unknown as gitUrlParse.GitUrl;
      mockGitUrlParse.mockReturnValue(mockParsedUrl);

      // Act
      const result = await provider.getRepositoryInfo();

      // Assert
      expect(result).toEqual({
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://github.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo',
      });
    });
  });

  describe('getLatestVersion', () => {
    it('should return ref and sha when tag and sha are detected', async () => {
      // Arrange
      const mockSha = 'abcdef1234567890abcdef1234567890abcdef12';
      const mockTag = 'v1.2.3';

      // Mock fetch (no-op), raw (returns the tag list), and revparse (returns sha for the tag)
      const emptyFetchResult = {} as unknown as FetchResult;
      mockGit.fetch.mockResolvedValue(emptyFetchResult);
      mockGit.raw = vi.fn().mockResolvedValue(`${mockTag}\n`);
      mockGit.revparse.mockImplementation((arg: unknown) => {
        // When revparse is called with the tag array, return the mock SHA
        if (Array.isArray(arg) && arg[0] === mockTag) {
          return Promise.resolve(mockSha) as Response<string>;
        }
        return Promise.resolve(mockSha) as Response<string>;
      });

      // Act
      const result = await provider.getLatestVersion();

      // Assert
      expect(result).toEqual({ ref: mockTag, sha: mockSha });
    });

    it('should return branch name when no tag but branch detected', async () => {
      // Arrange
      const mockSha = 'abcdef1234567890abcdef1234567890abcdef12';
      mockGit.revparse.mockImplementation((arg: unknown) => {
        return Promise.resolve(arg === 'HEAD' ? mockSha : 'feature/x') as Response<string>;
      });
      mockGit.tags.mockResolvedValue({ latest: undefined } as TagResult);

      // Act
      const result = await provider.getLatestVersion();

      // Assert
      expect(result).toEqual({ ref: 'feature/x', sha: mockSha });
    });

    it('should return undefined when nothing can be detected', async () => {
      // Arrange: revparse for HEAD fails, tags empty, branch is HEAD
      mockGit.revparse.mockImplementation((arg: unknown) => {
        if (arg === 'HEAD') return Promise.reject(new Error('no sha')) as Response<string>;
        return Promise.resolve('HEAD') as Response<string>;
      });
      mockGit.tags.mockResolvedValue({ latest: undefined } as TagResult);

      // Act
      const result = await provider.getLatestVersion();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined on unexpected git error', async () => {
      // Arrange: make simpleGit throw
      vi.mocked(simpleGit).mockImplementation(() => {
        throw new Error('git init failed');
      });

      // Act
      const result = await provider.getLatestVersion();

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
