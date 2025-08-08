import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { GitHubRepositoryProvider } from './github-repository.provider.js';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { LicenseService } from '@ci-dokumentor/core';

// Mock the GitRepositoryProvider
vi.mock('@ci-dokumentor/repository-git', () => ({
  GitRepositoryProvider: vi.fn(),
}));

// Mock the LicenseService
vi.mock('@ci-dokumentor/core', () => ({
  LicenseService: vi.fn(),
}));

// Mock @octokit/graphql
vi.mock('@octokit/graphql', () => ({
  graphql: vi.fn(),
}));

describe('GitHubRepositoryProvider', () => {
  let gitHubRepositoryProvider: GitHubRepositoryProvider;
  let mockGitRepositoryService: Mocked<GitRepositoryProvider>;
  let mockLicenseService: Mocked<LicenseService>;
  let mockGraphql: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Import the mocked graphql function
    const { graphql } = await import('@octokit/graphql');
    mockGraphql = vi.mocked(graphql);

    // Create a mock git repository service
    mockGitRepositoryService = {
      getPlatformName: vi.fn(),
      supports: vi.fn(),
      getRepository: vi.fn(),
      getRemoteParsedUrl: vi.fn(),
    } as unknown as Mocked<GitRepositoryProvider>;

    // Create a mock license service
    mockLicenseService = {
      detectLicenseFromFile: vi.fn(),
    } as unknown as Mocked<LicenseService>;

    gitHubRepositoryProvider = new GitHubRepositoryProvider(
      mockGitRepositoryService,
      mockLicenseService
    );

    // Reset all mocks
    vi.resetAllMocks();
  });

  describe('getPlatformName', () => {
    it('should return "github" as platform name', () => {
      // Act
      const result = gitHubRepositoryProvider.getPlatformName();

      // Assert
      expect(result).toBe('github');
    });
  });

  describe('supports', () => {
    it('should return true for GitHub HTTPS URL', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      const mockParsedUrl = {
        source: 'github.com',
        owner: 'owner',
        name: 'repo',
      };
      mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(
        mockParsedUrl
      );

      // Act
      const result = await gitHubRepositoryProvider.supports();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for GitHub SSH URL', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      const mockParsedUrl = {
        source: 'github.com',
        owner: 'owner',
        name: 'repo',
      };
      mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(
        mockParsedUrl
      );

      // Act
      const result = await gitHubRepositoryProvider.supports();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for GitLab URL', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      const mockParsedUrl = {
        source: 'gitlab.com',
        owner: 'owner',
        name: 'repo',
      };
      mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(
        mockParsedUrl
      );

      // Act
      const result = await gitHubRepositoryProvider.supports();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for Bitbucket URL', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      const mockParsedUrl = {
        source: 'bitbucket.org',
        owner: 'owner',
        name: 'repo',
      };
      mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue(
        mockParsedUrl
      );

      // Act
      const result = await gitHubRepositoryProvider.supports();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when getRemoteParsedUrl throws an error', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      mockGitRepositoryService.getRemoteParsedUrl.mockRejectedValue(
        new Error('Git error')
      );

      // Act
      const result = await gitHubRepositoryProvider.supports();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when git repository provider does not support the context', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(false);

      // Act
      const result = await gitHubRepositoryProvider.supports();

      // Assert
      expect(result).toBe(false);
      expect(
        mockGitRepositoryService.getRemoteParsedUrl
      ).not.toHaveBeenCalled();
    });
  });

  describe('getRepository', () => {
    const mockBaseRepo = {
      owner: 'test-owner',
      name: 'test-repo',
      url: 'https://github.com/test-owner/test-repo',
      fullName: 'test-owner/test-repo',
    };

    beforeEach(() => {
      mockGitRepositoryService.getRepository.mockResolvedValue(mockBaseRepo);
    });

    it('should extend base repository with logo and license information from GitHub API', async () => {
      // Arrange
      mockGraphql
        .mockResolvedValueOnce({
          repository: {
            openGraphImageUrl:
              'https://github.com/test-owner/test-repo/social-preview.png',
          },
        })
        .mockResolvedValueOnce({
          repository: {
            licenseInfo: {
              name: 'MIT License',
              spdxId: 'MIT',
              url: 'https://api.github.com/licenses/mit',
            },
          },
        });

      // Act
      const result = await gitHubRepositoryProvider.getRepository();

      // Assert
      expect(result).toEqual({
        ...mockBaseRepo,
        logo: 'https://github.com/test-owner/test-repo/social-preview.png',
        license: {
          name: 'MIT License',
          spdxId: 'MIT',
          url: 'https://api.github.com/licenses/mit',
        },
      });
      expect(mockLicenseService.detectLicenseFromFile).not.toHaveBeenCalled();
    });

    it('should fallback to license service when GitHub API has no license info', async () => {
      // Arrange
      mockGraphql
        .mockResolvedValueOnce({
          repository: {
            openGraphImageUrl:
              'https://github.com/test-owner/test-repo/social-preview.png',
          },
        })
        .mockResolvedValueOnce({
          repository: {
            licenseInfo: null,
          },
        });

      mockLicenseService.detectLicenseFromFile.mockReturnValue({
        name: 'Apache License 2.0',
        spdxId: 'Apache-2.0',
        url: null,
      });

      // Act
      const result = await gitHubRepositoryProvider.getRepository();

      // Assert
      expect(result).toEqual({
        ...mockBaseRepo,
        logo: 'https://github.com/test-owner/test-repo/social-preview.png',
        license: {
          name: 'Apache License 2.0',
          spdxId: 'Apache-2.0',
          url: null,
        },
      });
      expect(mockLicenseService.detectLicenseFromFile).toHaveBeenCalled();
    });

    it('should handle case when no license info is available from either source', async () => {
      // Arrange
      mockGraphql
        .mockResolvedValueOnce({
          repository: {
            openGraphImageUrl:
              'https://github.com/test-owner/test-repo/social-preview.png',
          },
        })
        .mockResolvedValueOnce({
          repository: {
            licenseInfo: null,
          },
        });

      mockLicenseService.detectLicenseFromFile.mockReturnValue(undefined);

      // Act
      const result = await gitHubRepositoryProvider.getRepository();

      // Assert
      expect(result).toEqual({
        ...mockBaseRepo,
        logo: 'https://github.com/test-owner/test-repo/social-preview.png',
        license: undefined,
      });
      expect(mockLicenseService.detectLicenseFromFile).toHaveBeenCalled();
    });

    it('should let GitHub API errors bubble up when fetching license info', async () => {
      // Arrange
      mockGraphql
        .mockResolvedValueOnce({
          repository: {
            openGraphImageUrl:
              'https://github.com/test-owner/test-repo/social-preview.png',
          },
        })
        .mockRejectedValueOnce(new Error('GitHub API rate limit exceeded'));

      // Act & Assert
      await expect(gitHubRepositoryProvider.getRepository()).rejects.toThrow(
        'GitHub API rate limit exceeded'
      );
      expect(mockLicenseService.detectLicenseFromFile).not.toHaveBeenCalled();
    });

    it('should handle missing repository data from GitHub API', async () => {
      // Arrange
      mockGraphql
        .mockResolvedValueOnce({
          repository: {
            openGraphImageUrl:
              'https://github.com/test-owner/test-repo/social-preview.png',
          },
        })
        .mockResolvedValueOnce({
          repository: null,
        });

      mockLicenseService.detectLicenseFromFile.mockReturnValue({
        name: 'MIT License',
        spdxId: 'MIT',
        url: null,
      });

      // Act
      const result = await gitHubRepositoryProvider.getRepository();

      // Assert
      expect(result).toEqual({
        ...mockBaseRepo,
        logo: 'https://github.com/test-owner/test-repo/social-preview.png',
        license: {
          name: 'MIT License',
          spdxId: 'MIT',
          url: null,
        },
      });
      expect(mockLicenseService.detectLicenseFromFile).toHaveBeenCalled();
    });

    it('should use local license service when GitHub license API returns empty object', async () => {
      // Arrange
      mockGraphql
        .mockResolvedValueOnce({
          repository: {
            openGraphImageUrl:
              'https://github.com/test-owner/test-repo/social-preview.png',
          },
        })
        .mockResolvedValueOnce({
          repository: {
            licenseInfo: {},
          },
        });

      mockLicenseService.detectLicenseFromFile.mockReturnValue({
        name: 'Custom License',
        spdxId: null,
        url: null,
      });

      // Act
      const result = await gitHubRepositoryProvider.getRepository();

      // Assert
      expect(result).toEqual({
        ...mockBaseRepo,
        logo: 'https://github.com/test-owner/test-repo/social-preview.png',
        license: {
          name: 'Custom License',
          spdxId: null,
          url: null,
        },
      });
      expect(mockLicenseService.detectLicenseFromFile).toHaveBeenCalled();
    });
  });
});
