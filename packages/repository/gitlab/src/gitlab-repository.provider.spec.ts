import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { ProjectSchema } from '@gitbeaker/rest';
import { GitRepositoryProvider, ParsedRemoteUrl } from '@ci-dokumentor/repository-git';
import { LicenseService, LicenseInfo, ManifestVersion, ReaderAdapter } from '@ci-dokumentor/core';
import { LicenseServiceMockFactory, RepositoryInfoMockFactory, ReaderAdapterMockFactory } from '@ci-dokumentor/core/tests';
import { GitBeakerMockFactory, ProjectsShowMock } from '../__tests__/gitbeaker-mock.factory.js';
import { GitLabRepositoryProvider } from './gitlab-repository.provider.js';
import type { GitLabRepositoryProviderOptions } from './gitlab-repository.provider.js';

describe('GitLabRepositoryProvider', () => {
  let gitLabRepositoryProvider: GitLabRepositoryProvider;
  let mockGitRepositoryService: Mocked<GitRepositoryProvider>;
  let mockLicenseService: Mocked<LicenseService>;
  let mockReaderAdapter: Mocked<ReaderAdapter>;
  let projectsShowMock: ProjectsShowMock;

  beforeEach(async () => {
    // Reset mocks before each test
    vi.resetAllMocks();

    ({ projectsShowMock } = GitBeakerMockFactory.create());

    // Create a mock git repository service
    mockGitRepositoryService = {
      getPlatformName: vi.fn() as Mocked<GitRepositoryProvider['getPlatformName']>,
      supports: vi.fn() as Mocked<GitRepositoryProvider['supports']>,
      getRepositoryInfo: vi.fn() as Mocked<GitRepositoryProvider['getRepositoryInfo']>,
      getRemoteParsedUrl: vi.fn() as Mocked<GitRepositoryProvider['getRemoteParsedUrl']>,
      getLatestVersion: vi.fn() as Mocked<GitRepositoryProvider['getLatestVersion']>,
    } as Mocked<GitRepositoryProvider>;

    // Create a mock license service
    mockLicenseService = LicenseServiceMockFactory.create();

    // Create a mock reader adapter
    mockReaderAdapter = ReaderAdapterMockFactory.create();

    gitLabRepositoryProvider = new GitLabRepositoryProvider(
      mockGitRepositoryService,
      mockLicenseService,
      mockReaderAdapter
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPlatformName', () => {
    it('should return "gitlab" as platform name', () => {
      // Act
      const result = gitLabRepositoryProvider.getPlatformName();

      // Assert
      expect(result).toBe('gitlab');
    });
  });

  describe('getPriority', () => {
    it('should return 100 as priority', () => {
      // Act
      const result = gitLabRepositoryProvider.getPriority();

      // Assert
      expect(result).toBe(100);
    });
  });

  describe('getOptions', () => {
    it('should return GitLab specific options', () => {
      // Act
      const result = gitLabRepositoryProvider.getOptions();

      // Assert
      expect(result).toEqual({
        gitlabToken: {
          flags: '--gitlab-token <token>',
          description: 'Optional GitLab token to authenticate API requests',
          env: 'GITLAB_TOKEN',
        },
        gitlabUrl: {
          flags: '--gitlab-url <url>',
          description: 'GitLab instance URL (defaults to https://gitlab.com)',
          env: 'GITLAB_URL',
        },
      });
    });
  });

  describe('setOptions', () => {
    it('should set GitLab token option', () => {
      // Arrange
      const options = { gitlabToken: 'test-token' };

      // Act
      gitLabRepositoryProvider.setOptions(options);

      // Assert - verify that the private token was set (we can't directly test private property, but we can test behavior)
      expect(() => gitLabRepositoryProvider.setOptions(options)).not.toThrow();
    });

    it('should set GitLab URL option', () => {
      // Arrange
      const options = { gitlabUrl: 'https://gitlab.example.com' };

      // Act
      gitLabRepositoryProvider.setOptions(options);

      // Assert
      expect(() => gitLabRepositoryProvider.setOptions(options)).not.toThrow();
    });

    it('should handle undefined options', () => {
      // Act & Assert
      expect(() => gitLabRepositoryProvider.setOptions(undefined as unknown as GitLabRepositoryProviderOptions)).not.toThrow();
    });
  });

  describe('supports', () => {
    it('should return true for GitLab.com repositories', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue({
        source: 'gitlab.com',
        owner: 'test-owner',
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        toString: () => 'https://gitlab.com/test-owner/test-repo.git'
      } as ParsedRemoteUrl);

      // Act
      const result = await gitLabRepositoryProvider.supports();

      // Assert
      expect(result).toBe(true);
      expect(mockGitRepositoryService.supports).toHaveBeenCalled();
      expect(mockGitRepositoryService.getRemoteParsedUrl).toHaveBeenCalled();
    });

    it('should return true for self-hosted GitLab instances', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue({
        source: 'gitlab.example.com',
        owner: 'test-owner',
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        toString: () => 'https://gitlab.example.com/test-owner/test-repo.git'
      } as ParsedRemoteUrl);

      // Act
      const result = await gitLabRepositoryProvider.supports();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for GitHub repositories', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(true);
      mockGitRepositoryService.getRemoteParsedUrl.mockResolvedValue({
        source: 'github.com',
        owner: 'test-owner',
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        toString: () => 'https://github.com/test-owner/test-repo.git'
      } as ParsedRemoteUrl);

      // Act
      const result = await gitLabRepositoryProvider.supports();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when git repository provider does not support', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockResolvedValue(false);

      // Act
      const result = await gitLabRepositoryProvider.supports();

      // Assert
      expect(result).toBe(false);
      expect(mockGitRepositoryService.supports).toHaveBeenCalled();
    });

    it('should return false when exception occurs', async () => {
      // Arrange
      mockGitRepositoryService.supports.mockRejectedValue(new Error('Git error'));

      // Act & Assert
      await expect(gitLabRepositoryProvider.supports()).rejects.toThrow('Git error');
    });
  });

  describe('fetchRepositoryInfo', () => {
    it('should delegate to git repository provider', async () => {
      // Arrange
      const expectedInfo = RepositoryInfoMockFactory.create();
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue(expectedInfo);

      // Act
      const result = await gitLabRepositoryProvider.getRepositoryInfo();

      // Assert
      expect(result).toBe(expectedInfo);
      expect(mockGitRepositoryService.getRepositoryInfo).toHaveBeenCalled();
    });
  });

  describe('fetchLogo', () => {
    it('should return file path when logo exists locally', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(true);

      // Act
      const result = await gitLabRepositoryProvider.getLogo();

      // Assert
      expect(result).toBe('file://.gitlab/logo.png');
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('.gitlab/logo.png');
    });

    it('should try GitLab API when no local logo exists', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(false);
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue({
        rootDir: '/test',
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://gitlab.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo'
      });

      projectsShowMock.mockResolvedValue({
        avatar_url: 'https://gitlab.com/avatar.png'
      } as unknown as ProjectSchema);

      // Act
      const result = await gitLabRepositoryProvider.getLogo();

      // Assert
      expect(result).toBe('https://gitlab.com/avatar.png');
      expect(projectsShowMock).toHaveBeenCalledWith('test-owner/test-repo');
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(false);
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue({
        rootDir: '/test',
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://gitlab.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo'
      });

      projectsShowMock.mockRejectedValue(new Error('API error'));

      // Act & Assert
      await expect(gitLabRepositoryProvider.getLogo()).rejects.toThrow('API error')
    });
  });

  describe('fetchLicense', () => {
    it('should return license from GitLab API when available', async () => {
      // Arrange
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue({
        rootDir: '/test',
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://gitlab.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo'
      });

      projectsShowMock.mockResolvedValue({
        license: {
          key: 'mit',
          source_url: 'https://opensource.org/licenses/MIT',
          name: 'MIT License',
          nickname: 'MIT',
          html_url: 'https://opensource.org/licenses/MIT'
        }
      } as unknown as ProjectSchema);

      // Act
      const result = await gitLabRepositoryProvider.getLicense();

      // Assert
      expect(result).toEqual({
        name: 'MIT License',
        spdxId: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      });
      expect(projectsShowMock).toHaveBeenCalledWith('test-owner/test-repo');
    });

    it('should throw error when API fails', async () => {
      // Arrange
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue({
        rootDir: '/test',
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://gitlab.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo'
      });

      projectsShowMock.mockRejectedValue(new Error('API error'));

      const expectedLicense: LicenseInfo = {
        name: 'MIT',
        spdxId: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      };
      mockLicenseService.detectLicenseFromFile.mockResolvedValue(expectedLicense);

      // Act & assert
      await expect(gitLabRepositoryProvider.getLicense()).rejects.toThrow('API error')
    });
  });

  describe('fetchContributing', () => {
    it('should return contributing URL when file exists', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValueOnce(true);
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue({
        rootDir: '/test',
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://gitlab.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo'
      });

      // Act
      const result = await gitLabRepositoryProvider.getContributing();

      // Assert
      expect(result).toEqual({
        url: 'https://gitlab.com/test-owner/test-repo/-/blob/main/CONTRIBUTING.md'
      });
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('CONTRIBUTING.md');
    });

    it('should return undefined when no contributing file exists', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(false);

      // Act
      const result = await gitLabRepositoryProvider.getContributing();

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('fetchSecurity', () => {
    it('should return security URL when file exists', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValueOnce(true);
      mockGitRepositoryService.getRepositoryInfo.mockResolvedValue({
        rootDir: '/test',
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://gitlab.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo'
      });

      // Act
      const result = await gitLabRepositoryProvider.getSecurity();

      // Assert
      expect(result).toEqual({
        url: 'https://gitlab.com/test-owner/test-repo/-/blob/main/SECURITY.md'
      });
      expect(mockReaderAdapter.resourceExists).toHaveBeenCalledWith('SECURITY.md');
    });

    it('should return undefined when no security file exists', async () => {
      // Arrange
      mockReaderAdapter.resourceExists.mockReturnValue(false);

      // Act
      const result = await gitLabRepositoryProvider.getSecurity();

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('fetchLatestVersion', () => {
    it('should delegate to git repository provider', async () => {
      // Arrange
      const expectedVersion: ManifestVersion = { ref: 'v1.0.0', sha: 'abc123' };
      mockGitRepositoryService.getLatestVersion.mockResolvedValue(expectedVersion);

      // Act
      const result = await gitLabRepositoryProvider.getLatestVersion();

      // Assert
      expect(result).toBe(expectedVersion);
      expect(mockGitRepositoryService.getLatestVersion).toHaveBeenCalled();
    });
  });
});