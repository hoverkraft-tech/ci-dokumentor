import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { GitRepositoryProvider, ParsedRemoteUrl } from '@ci-dokumentor/repository-git';
import { LicenseService, LicenseInfo, ManifestVersion, ReaderAdapter } from '@ci-dokumentor/core';
import { LicenseServiceMockFactory, RepositoryInfoMockFactory, ReaderAdapterMockFactory } from '@ci-dokumentor/core/tests';
import { OcktokitMockFactory } from '../__tests__/octokit-mock.factory.js';
import { GitHubRepositoryProvider } from './github-repository.provider.js'

const { graphqlMock } = OcktokitMockFactory.create();

describe('GitHubRepositoryProvider', () => {
  let gitHubRepositoryProvider: GitHubRepositoryProvider;
  let mockGitRepositoryService: Mocked<GitRepositoryProvider>;
  let mockLicenseService: Mocked<LicenseService>;
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  beforeEach(async () => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Create a mock git repository service
    mockGitRepositoryService = {
      getPlatformName: vi.fn() as Mocked<GitRepositoryProvider['getPlatformName']>,
      supports: vi.fn() as Mocked<GitRepositoryProvider['supports']>,
      getRepositoryInfo: vi.fn() as Mocked<GitRepositoryProvider['getRepositoryInfo']>,
      getRemoteParsedUrl: vi.fn() as Mocked<GitRepositoryProvider['getRemoteParsedUrl']>,
    } as Mocked<GitRepositoryProvider>;

    // Create a mock license service
    mockLicenseService = LicenseServiceMockFactory.create();

    // Create a mock reader adapter
    mockReaderAdapter = ReaderAdapterMockFactory.create();

    gitHubRepositoryProvider = new GitHubRepositoryProvider(
      mockGitRepositoryService,
      mockLicenseService,
      mockReaderAdapter
    );
  });

  afterEach(() => {
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

  describe('getRepositoryInfo', () => {
    it('should return repository info from git provider', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);

      // Act
      const result = await gitHubRepositoryProvider.getRepositoryInfo();

      // Assert
      expect(result).toEqual(repositoryInfo);
    });
  });

  describe('getLogo', () => {
    it('should return file uri when logo exists in .github', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);
      mockReaderAdapter.resourceExists.mockImplementation((path: string) => {
        return path === '.github/logo.png';
      });

      // Act
      const uri = await gitHubRepositoryProvider.getLogo();

      // Assert
      expect(uri).toBe('file://.github/logo.png');
    });

    it('should fallback to openGraph image when no local logo', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);
      // Ensure no local files
      mockReaderAdapter.resourceExists.mockReturnValue(false);

      // Mock graphql to return openGraphImageUrl
      graphqlMock.mockResolvedValue({ repository: { openGraphImageUrl: 'https://img.local/og.png' } });

      // Act
      const uri = await gitHubRepositoryProvider.getLogo();

      // Assert
      expect(uri).toBe('https://img.local/og.png');
    });
  });

  describe('getLicense', () => {
    it('should return license info from graphql when present', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);

      graphqlMock.mockResolvedValue({ repository: { licenseInfo: { name: 'MIT', spdxId: 'MIT', url: 'https://license' } } });

      // Act
      const license = await gitHubRepositoryProvider.getLicense();

      // Assert
      expect(license).toEqual({ name: 'MIT', spdxId: 'MIT', url: 'https://license' });
    });

    it('should fallback to licenseService when graphql has no licenseInfo', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);

      graphqlMock.mockResolvedValue({ repository: {} });

      const expected: LicenseInfo = { name: 'MIT', spdxId: 'MIT', url: 'https://license' };
      mockLicenseService.detectLicenseFromFile.mockResolvedValue(expected);

      // Act
      const license = await gitHubRepositoryProvider.getLicense();

      // Assert
      expect(license).toEqual(expected);
    });
  });

  describe('getContributing', () => {
    it('should return contributing url when available via graphql', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);

      graphqlMock.mockResolvedValue({ repository: { contributingGuidelines: { url: 'https://github.com/owner/repo/CONTRIBUTING' } } });

      // Act
      const contributing = await gitHubRepositoryProvider.getContributing();

      // Assert
      expect(contributing).toEqual({ url: 'https://github.com/owner/repo/CONTRIBUTING' });
    });
  });

  describe('getSecurity', () => {
    it('should return security policy url when available via graphql', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);

      graphqlMock.mockResolvedValue({ repository: { securityPolicyUrl: 'https://github.com/owner/repo/security/policy' } });

      // Act
      const security = await gitHubRepositoryProvider.getSecurity();

      // Assert
      expect(security).toEqual({ url: 'https://github.com/owner/repo/security/policy' });
    });

    it('should return undefined when no security policy is available', async () => {
      // Arrange
      const repositoryInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(repositoryInfo);

      graphqlMock.mockResolvedValue({ repository: {} });

      // Act
      const security = await gitHubRepositoryProvider.getSecurity();

      // Assert
      expect(security).toBeUndefined();
    });
  });

  describe('getLatestVersion', () => {
    it('should delegate to gitRepositoryProvider.getLatestVersion', async () => {
      // Arrange
      const expected: ManifestVersion = { version: '1.2.3' } as ManifestVersion;
      (mockGitRepositoryService as unknown as { getLatestVersion?: () => Promise<ManifestVersion> }).getLatestVersion = vi.fn().mockResolvedValue(expected);

      // Act
      const result = await gitHubRepositoryProvider.getLatestVersion();

      // Assert
      expect(result).toBe(expected);
    });
  });
});
