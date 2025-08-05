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
            await expect(repositoryService.getRepository()).rejects.toThrow('No repository provider found that supports the current context');
        });

        it('should use first supporting provider', async () => {
            // Arrange
            const mockProvider1: RepositoryProvider = {
                supports: vi.fn().mockResolvedValue(false),
                getRepository: vi.fn()
            };

            const mockProvider2: RepositoryProvider = {
                supports: vi.fn().mockResolvedValue(true),
                getRepository: vi.fn().mockResolvedValue({
                    owner: 'test-owner',
                    name: 'test-repo', 
                    url: 'https://github.com/test-owner/test-repo',
                    fullName: 'test-owner/test-repo'
                })
            };

            repositoryService = new RepositoryService([mockProvider1, mockProvider2]);

            // Act
            const result = await repositoryService.getRepository();

            // Assert
            expect(result).toEqual({
                owner: 'test-owner',
                name: 'test-repo',
                url: 'https://github.com/test-owner/test-repo',
                fullName: 'test-owner/test-repo'
            });
            expect(mockProvider1.supports).toHaveBeenCalled();
            expect(mockProvider1.getRepository).not.toHaveBeenCalled();
            expect(mockProvider2.supports).toHaveBeenCalled();
            expect(mockProvider2.getRepository).toHaveBeenCalled();
        });

        it('should throw error when no provider supports current context', async () => {
            // Arrange
            const mockProvider: RepositoryProvider = {
                supports: vi.fn().mockResolvedValue(false),
                getRepository: vi.fn()
            };

            repositoryService = new RepositoryService([mockProvider]);

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('No repository provider found that supports the current context');
            expect(mockProvider.supports).toHaveBeenCalled();
            expect(mockProvider.getRepository).not.toHaveBeenCalled();
        });

        it('should propagate provider errors from supports method', async () => {
            // Arrange
            const mockProvider: RepositoryProvider = {
                supports: vi.fn().mockRejectedValue(new Error('Provider error')),
                getRepository: vi.fn()
            };

            repositoryService = new RepositoryService([mockProvider]);

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('Provider error');
            expect(mockProvider.supports).toHaveBeenCalled();
            expect(mockProvider.getRepository).not.toHaveBeenCalled();
        });

        it('should propagate provider errors from getRepository method', async () => {
            // Arrange
            const mockProvider: RepositoryProvider = {
                supports: vi.fn().mockResolvedValue(true),
                getRepository: vi.fn().mockRejectedValue(new Error('Repository error'))
            };

            repositoryService = new RepositoryService([mockProvider]);

            // Act & Assert
            await expect(repositoryService.getRepository()).rejects.toThrow('Repository error');
            expect(mockProvider.supports).toHaveBeenCalled();
            expect(mockProvider.getRepository).toHaveBeenCalled();
        });
    });
});
