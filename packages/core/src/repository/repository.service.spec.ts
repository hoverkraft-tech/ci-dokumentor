import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RepositoryService } from './repository.service.js';
import { RepositoryProvider } from './repository.provider.js';

describe('RepositoryService', () => {
  let repositoryService: RepositoryService;

  beforeEach(() => {
    repositoryService = new RepositoryService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getRepository', () => {
    it('should throw error when no providers are available', async () => {
      // Arrange - service created with no providers

      // Act & Assert
      await expect(repositoryService.getRepository()).rejects.toThrow(
        'No repository provider found that supports the current context'
      );
    });

    it('should use first supporting provider', async () => {
      // Arrange
      const mockProvider1: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn().mockResolvedValue(false),
        getRepository: vi.fn(),
      };

      const mockProvider2: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('github'),
        getPriority: vi.fn().mockReturnValue(100),
        supports: vi.fn().mockResolvedValue(true),
        getRepository: vi.fn().mockResolvedValue({
          owner: 'test-owner',
          name: 'test-repo',
          url: 'https://github.com/test-owner/test-repo',
          fullName: 'test-owner/test-repo',
        }),
      };

      repositoryService = new RepositoryService([mockProvider1, mockProvider2]);

      // Act
      const result = await repositoryService.getRepository();

      // Assert
      expect(result).toEqual({
        owner: 'test-owner',
        name: 'test-repo',
        url: 'https://github.com/test-owner/test-repo',
        fullName: 'test-owner/test-repo',
      });
      // Due to priority sorting, github provider (higher priority) is checked first
      expect(mockProvider2.supports).toHaveBeenCalled();
      expect(mockProvider2.getRepository).toHaveBeenCalled();
      // Since github provider supports the context, git provider is not checked
      expect(mockProvider1.supports).not.toHaveBeenCalled();
      expect(mockProvider1.getRepository).not.toHaveBeenCalled();
    });

    it('should throw error when no provider supports current context', async () => {
      // Arrange
      const mockProvider: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn().mockResolvedValue(false),
        getRepository: vi.fn(),
      };

      repositoryService = new RepositoryService([mockProvider]);

      // Act & Assert
      await expect(repositoryService.getRepository()).rejects.toThrow(
        'No repository provider found that supports the current context'
      );
      expect(mockProvider.supports).toHaveBeenCalled();
      expect(mockProvider.getRepository).not.toHaveBeenCalled();
    });

    it('should propagate provider errors from supports method', async () => {
      // Arrange
      const mockProvider: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn().mockRejectedValue(new Error('Provider error')),
        getRepository: vi.fn(),
      };

      repositoryService = new RepositoryService([mockProvider]);

      // Act & Assert
      await expect(repositoryService.getRepository()).rejects.toThrow(
        'Provider error'
      );
      expect(mockProvider.supports).toHaveBeenCalled();
      expect(mockProvider.getRepository).not.toHaveBeenCalled();
    });

    it('should propagate provider errors from getRepository method', async () => {
      // Arrange
      const mockProvider: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn().mockResolvedValue(true),
        getRepository: vi.fn().mockRejectedValue(new Error('Repository error')),
      };

      repositoryService = new RepositoryService([mockProvider]);

      // Act & Assert
      await expect(repositoryService.getRepository()).rejects.toThrow(
        'Repository error'
      );
      expect(mockProvider.supports).toHaveBeenCalled();
      expect(mockProvider.getRepository).toHaveBeenCalled();
    });
  });

  describe('getSupportedRepositoryPlatforms', () => {
    it('should return empty array when no providers are available', () => {
      // Arrange - service created with no providers

      // Act
      const result = repositoryService.getSupportedRepositoryPlatforms();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return platform names from all providers', () => {
      // Arrange
      const mockProvider1: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn(),
        getRepository: vi.fn(),
      };

      const mockProvider2: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('github'),
        getPriority: vi.fn().mockReturnValue(100),
        supports: vi.fn(),
        getRepository: vi.fn(),
      };

      repositoryService = new RepositoryService([mockProvider1, mockProvider2]);

      // Act
      const result = repositoryService.getSupportedRepositoryPlatforms();

      // Assert
      expect(result).toEqual(['github', 'git']); // Note: should be sorted by priority (github first)
      expect(mockProvider1.getPlatformName).toHaveBeenCalled();
      expect(mockProvider2.getPlatformName).toHaveBeenCalled();
    });
  });

  describe('priority behavior', () => {
    it('should check providers in priority order (highest first)', async () => {
      // Arrange
      const callOrder: string[] = [];
      
      const lowPriorityProvider: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn().mockImplementation(async () => {
          callOrder.push('git');
          return false;
        }),
        getRepository: vi.fn(),
      };

      const highPriorityProvider: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('github'),
        getPriority: vi.fn().mockReturnValue(100),
        supports: vi.fn().mockImplementation(async () => {
          callOrder.push('github');
          return true;
        }),
        getRepository: vi.fn().mockResolvedValue({
          owner: 'test-owner',
          name: 'test-repo',
          url: 'https://github.com/test-owner/test-repo',
          fullName: 'test-owner/test-repo',
        }),
      };

      // Pass providers in reverse priority order to test sorting
      repositoryService = new RepositoryService([lowPriorityProvider, highPriorityProvider]);

      // Act
      await repositoryService.getRepository();

      // Assert
      expect(callOrder).toEqual(['github']); // Only github should be called since it supports and has higher priority
      expect(lowPriorityProvider.supports).not.toHaveBeenCalled(); // Should not be called since github already supports
      expect(highPriorityProvider.supports).toHaveBeenCalled();
      expect(highPriorityProvider.getRepository).toHaveBeenCalled();
    });

    it('should fallback to lower priority provider when higher priority does not support', async () => {
      // Arrange
      const callOrder: string[] = [];
      
      const lowPriorityProvider: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn().mockImplementation(async () => {
          callOrder.push('git');
          return true;
        }),
        getRepository: vi.fn().mockResolvedValue({
          owner: 'test-owner',
          name: 'test-repo',
          url: 'https://example.com/test-owner/test-repo',
          fullName: 'test-owner/test-repo',
        }),
      };

      const highPriorityProvider: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('github'),
        getPriority: vi.fn().mockReturnValue(100),
        supports: vi.fn().mockImplementation(async () => {
          callOrder.push('github');
          return false;
        }),
        getRepository: vi.fn(),
      };

      repositoryService = new RepositoryService([lowPriorityProvider, highPriorityProvider]);

      // Act
      const result = await repositoryService.getRepository();

      // Assert
      expect(callOrder).toEqual(['github', 'git']); // github checked first, then git
      expect(result.url).toBe('https://example.com/test-owner/test-repo');
      expect(highPriorityProvider.supports).toHaveBeenCalled();
      expect(highPriorityProvider.getRepository).not.toHaveBeenCalled();
      expect(lowPriorityProvider.supports).toHaveBeenCalled();
      expect(lowPriorityProvider.getRepository).toHaveBeenCalled();
    });

    it('should sort providers by priority during construction', () => {
      // Arrange
      const provider1: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('git'),
        getPriority: vi.fn().mockReturnValue(0),
        supports: vi.fn(),
        getRepository: vi.fn(),
      };

      const provider2: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('github'),
        getPriority: vi.fn().mockReturnValue(100),
        supports: vi.fn(),
        getRepository: vi.fn(),
      };

      const provider3: RepositoryProvider = {
        getPlatformName: vi.fn().mockReturnValue('gitlab'),
        getPriority: vi.fn().mockReturnValue(50),
        supports: vi.fn(),
        getRepository: vi.fn(),
      };

      // Pass providers in random order
      repositoryService = new RepositoryService([provider1, provider3, provider2]);

      // Act
      const result = repositoryService.getSupportedRepositoryPlatforms();

      // Assert - should be sorted by priority: github (100), gitlab (50), git (0)
      expect(result).toEqual(['github', 'gitlab', 'git']);
    });
  });
});
