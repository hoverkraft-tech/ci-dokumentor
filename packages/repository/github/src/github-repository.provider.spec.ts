import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { GitRepositoryProvider, ParsedRemoteUrl } from '@ci-dokumentor/repository-git';
import { LicenseService } from '@ci-dokumentor/core';
import { OcktokitMockFactory } from '../__tests__/octokit-mock.factory.js';
import { GitHubRepositoryProvider } from './github-repository.provider.js'

const { graphqlMock } = OcktokitMockFactory.create();

describe('GitHubRepositoryProvider', () => {
  let gitHubRepositoryProvider: GitHubRepositoryProvider;
  let mockGitRepositoryService: Mocked<GitRepositoryProvider>;
  let mockLicenseService: Mocked<LicenseService>;

  beforeEach(async () => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Create a mock git repository service
    mockGitRepositoryService = {
      getPlatformName: vi.fn(),
      supports: vi.fn(),
      getRepository: vi.fn(),
      getRepositoryInfo: vi.fn(),
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
      } as ParsedRemoteUrl;
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
      } as ParsedRemoteUrl;
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
      } as ParsedRemoteUrl;
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
      } as ParsedRemoteUrl;
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

  describe('fetchLicense and logo behavior', () => {
    it('should return openGraphImageUrl from graphql when available', async () => {
      // Arrange
      const repo = { owner: 'owner', name: 'repo', url: 'https://github.com/owner/repo', fullName: 'owner/repo' };
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repo as any);

      // GraphQL mock to return openGraphImageUrl
      vi.mocked(graphqlMock).mockResolvedValue({ repository: { openGraphImageUrl: 'https://img.local/og.png' } });

      // Act
      const logo = await (gitHubRepositoryProvider as any).getOpenGraphImageUrl(repo as any);

      // Assert
      expect(logo).toBe('https://img.local/og.png');
    });

    it('should fallback to licenseService when graphql has no licenseInfo', async () => {
      // Arrange
      const repo = { owner: 'owner', name: 'repo', url: 'https://github.com/owner/repo', fullName: 'owner/repo' };
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repo as any);

      // GraphQL mock returns repository with no licenseInfo
      vi.mocked(graphqlMock).mockResolvedValue({ repository: {} });

      const expected = { name: 'MIT', spdxId: 'MIT', url: 'https://license' };
      mockLicenseService.detectLicenseFromFile.mockResolvedValue(expected as any);

      // Act
      const license = await (gitHubRepositoryProvider as any).getLicenseInfo(repo as any);

      // Assert
      expect(license).toEqual(expected);
    });
  });

});
