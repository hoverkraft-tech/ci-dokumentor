import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { GenerateDocumentationUseCase } from './generate-documentation.usecase.js';
import { LOGGER_IDENTIFIER } from '../interfaces/logger.interface.js';
import { GeneratorService, RepositoryService } from '@ci-dokumentor/core';

describe('GenerateDocumentationUseCase', () => {
    let container: Container;
    let useCase: GenerateDocumentationUseCase;
    let mockLogger: any;
    let mockGeneratorService: any;
    let mockRepositoryService: any;

    beforeEach(() => {
        container = new Container();
        
        // Create mocks
        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn()
        };

        mockGeneratorService = {
            generateDocumentation: vi.fn().mockResolvedValue(undefined),
            getSupportedCicdPlatforms: vi.fn().mockReturnValue(['github-actions'])
        };

        mockRepositoryService = {
            getRepository: vi.fn().mockResolvedValue({
                owner: 'test',
                name: 'repo',
                url: 'https://github.com/test/repo',
                fullName: 'test/repo'
            }),
            getSupportedRepositoryPlatforms: vi.fn().mockReturnValue(['git', 'github'])
        };

        // Bind mocks to container
        container.bind(LOGGER_IDENTIFIER).toConstantValue(mockLogger);
        container.bind(GeneratorService).toConstantValue(mockGeneratorService);
        container.bind(RepositoryService).toConstantValue(mockRepositoryService);
        container.bind(GenerateDocumentationUseCase).to(GenerateDocumentationUseCase);

        // Get the use case instance
        useCase = container.get(GenerateDocumentationUseCase);
    });

    describe('input validation', () => {
        it('should validate required source directory', async () => {
            // Arrange
            const input = {
                source: '',
                output: './docs'
            };

            // Act & Assert
            await expect(useCase.execute(input)).rejects.toThrow('Source directory is required');
        });

        it('should validate required output directory', async () => {
            // Arrange
            const input = {
                source: './src',
                output: ''
            };

            // Act & Assert
            await expect(useCase.execute(input)).rejects.toThrow('Output directory is required');
        });

        it('should validate repository platform', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs',
                repository: {
                    platform: 'invalid-platform' as any
                }
            };

            // Act & Assert
            await expect(useCase.execute(input)).rejects.toThrow('Invalid repository platform \'invalid-platform\'. Valid platforms: git, github');
        });

        it('should validate CI/CD platform', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs',
                cicd: {
                    platform: 'invalid-platform' as any
                }
            };

            // Act & Assert
            await expect(useCase.execute(input)).rejects.toThrow('Invalid CI/CD platform \'invalid-platform\'. Valid platforms: github-actions');
        });

        it('should accept valid repository platforms', async () => {
            // Arrange
            const validPlatforms = ['git', 'github'] as const;

            for (const platform of validPlatforms) {
                const input = {
                    source: './src',
                    output: './docs',
                    repository: { platform }
                };

                // Act & Assert
                await expect(useCase.execute(input)).resolves.toBeDefined();
            }
        });

        it('should accept valid CI/CD platforms', async () => {
            // Arrange
            const validPlatforms = ['github-actions'] as const;

            for (const platform of validPlatforms) {
                const input = {
                    source: './src',
                    output: './docs',
                    cicd: { platform }
                };

                // Act & Assert
                await expect(useCase.execute(input)).resolves.toBeDefined();
            }
        });
    });

    describe('execution logging', () => {
        it('should log basic execution information', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs'
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('Starting documentation generation...');
            expect(mockLogger.info).toHaveBeenCalledWith('Source directory: ./src');
            expect(mockLogger.info).toHaveBeenCalledWith('Output directory: ./docs');
            expect(mockLogger.info).toHaveBeenCalledWith('Documentation generated successfully!');
            expect(mockLogger.info).toHaveBeenCalledWith('Output saved to: ./docs');
        });

        it('should log repository platform when provided', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs',
                repository: {
                    platform: 'github' as const
                }
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('Repository platform: github');
        });

        it('should log CI/CD platform when provided', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs',
                cicd: {
                    platform: 'github-actions' as const
                }
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('CI/CD platform: github-actions');
        });

        it('should log section options when provided', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs',
                sections: {
                    includeSections: ['header', 'overview'],
                    excludeSections: ['license']
                }
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('Including sections: header, overview');
            expect(mockLogger.info).toHaveBeenCalledWith('Excluding sections: license');
        });

        it('should not log empty section arrays', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs',
                sections: {
                    includeSections: [],
                    excludeSections: []
                }
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Including sections:'));
            expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Excluding sections:'));
        });
    });

    describe('generator service integration', () => {
        it('should call generator service with source path', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs'
            };

            // Act
            await useCase.execute(input);

            // Assert
            expect(mockGeneratorService.generateDocumentation).toHaveBeenCalledWith('./src');
        });

        it('should return success response', async () => {
            // Arrange
            const input = {
                source: './src',
                output: './docs'
            };

            // Act
            const result = await useCase.execute(input);

            // Assert
            expect(result).toEqual({
                success: true,
                message: 'Documentation generated successfully',
                outputPath: './docs'
            });
        });
    });

    describe('platform support', () => {
        it('should get supported repository platforms from repository service', () => {
            // Act
            const platforms = useCase.getSupportedRepositoryPlatforms();

            // Assert
            expect(platforms).toEqual(['git', 'github']);
            expect(mockRepositoryService.getSupportedRepositoryPlatforms).toHaveBeenCalled();
        });

        it('should get supported CI/CD platforms from generator service', () => {
            // Act
            const platforms = useCase.getSupportedCicdPlatforms();

            // Assert
            expect(platforms).toEqual(['github-actions']);
            expect(mockGeneratorService.getSupportedCicdPlatforms).toHaveBeenCalled();
        });
    });
});