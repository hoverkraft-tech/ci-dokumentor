import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RepositoryProviderMockFactory } from '../../__tests__/repository-provider-mock.factory.js';
import { RepositoryService } from './repository.service.js';

describe('RepositoryService', () => {
  let repositoryService: RepositoryService;

  beforeEach(() => {
    repositoryService = new RepositoryService();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
      const mockProvider1 = RepositoryProviderMockFactory.create({
        getPlatformName: 'git',
        getPriority: 0
      });

      const mockProvider2 = RepositoryProviderMockFactory.create({
        getPlatformName: 'github',
        getPriority: 100
      });

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

      const lowPriorityProvider = RepositoryProviderMockFactory.create({
        getPlatformName: 'git',
        getPriority: 0,
      });

      lowPriorityProvider.supports.mockImplementation(async () => {
        callOrder.push('git');
        return false;
      });

      const highPriorityProvider = RepositoryProviderMockFactory.create({
        getPlatformName: 'github',
        getPriority: 100,
      });

      highPriorityProvider.supports.mockImplementation(async () => {
        callOrder.push('github');
        return true;
      });

      // Pass providers in reverse priority order to test sorting
      repositoryService = new RepositoryService([lowPriorityProvider, highPriorityProvider]);

      // Act
      const autoDetectedProvider = await repositoryService.autoDetectRepositoryProvider();

      // Assert
      expect(callOrder).toEqual(['github']); // Only github should be called since it supports and has higher priority
      expect(lowPriorityProvider.supports).not.toHaveBeenCalled(); // Should not be called since github already supports
      expect(highPriorityProvider.supports).toHaveBeenCalled();
      expect(autoDetectedProvider).toBe(highPriorityProvider);
    });

    it('should fallback to lower priority provider when higher priority does not support', async () => {
      // Arrange
      const callOrder: string[] = [];

      const lowPriorityProvider = RepositoryProviderMockFactory.create({
        getPlatformName: 'git',
        getPriority: 0,
      });
      lowPriorityProvider.supports.mockImplementation(async () => {
        callOrder.push('git');
        return true;
      });

      const highPriorityProvider = RepositoryProviderMockFactory.create({
        getPlatformName: 'github',
        getPriority: 100,
      });
      highPriorityProvider.supports.mockImplementation(async () => {
        callOrder.push('github');
        return false;
      });

      repositoryService = new RepositoryService([lowPriorityProvider, highPriorityProvider]);

      // Act
      const autoDetectedProvider = await repositoryService.autoDetectRepositoryProvider();

      // Assert
      expect(callOrder).toEqual(['github', 'git']); // github checked first, then git
      expect(autoDetectedProvider).toBe(lowPriorityProvider);
      expect(highPriorityProvider.supports).toHaveBeenCalled();
      expect(lowPriorityProvider.supports).toHaveBeenCalled();
    });

    it('should sort providers by priority during construction', () => {
      // Arrange
      const provider1 = RepositoryProviderMockFactory.create({ getPlatformName: 'git', getPriority: 0 });
      const provider2 = RepositoryProviderMockFactory.create({ getPlatformName: 'github', getPriority: 100 });
      const provider3 = RepositoryProviderMockFactory.create({ getPlatformName: 'gitlab', getPriority: 50 });

      // Pass providers in random order
      repositoryService = new RepositoryService([provider1, provider3, provider2]);

      // Act
      const result = repositoryService.getSupportedRepositoryPlatforms();

      // Assert - should be sorted by priority: github (100), gitlab (50), git (0)
      expect(result).toEqual(['github', 'gitlab', 'git']);
    });
  });
});
