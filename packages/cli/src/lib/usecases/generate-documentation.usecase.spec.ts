import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import mockFs from 'mock-fs';

import { GenerateDocumentationUseCase } from './generate-documentation.usecase.js';
import { GeneratorService, RepositoryService } from '@ci-dokumentor/core';
import { Logger } from '../interfaces/logger.interface.js';

describe('GenerateDocumentationUseCase', () => {
  let useCase: GenerateDocumentationUseCase;
  let mockLogger: Mocked<Logger>;
  let mockGeneratorService: Mocked<GeneratorService>;
  let mockRepositoryService: Mocked<RepositoryService>;

  beforeEach(() => {
    // Set up mock filesystem for tests. Use mock-fs so imports receive mocked fs behavior.
    mockFs({
      './action.yml': 'name: test-action\n',
      './README.md': '',
    });
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    } as unknown as Mocked<Logger>;

    mockGeneratorService = {
      // Returns destination path when called
      generateDocumentationForPlatform: vi.fn().mockResolvedValue('./README.md'),
      getGeneratorAdapterByPlatform: vi.fn().mockReturnValue({
        getPlatformName: () => 'github-actions',
        supportsSource: () => true,
        getDocumentationPath: () => './README.md',
        generateDocumentation: vi.fn().mockResolvedValue(undefined),
        getSupportedSections: () => ['header', 'overview'],
      }),
      autoDetectCicdPlatform: vi.fn().mockReturnValue('github-actions'),
      autoDetectCicdAdapter: vi.fn().mockReturnValue({
        getPlatformName: () => 'github-actions',
        supportsSource: () => true,
        getDocumentationPath: () => './README.md',
        generateDocumentation: vi.fn().mockResolvedValue(undefined),
        getSupportedSections: () => ['header', 'overview'],
      }),
      getSupportedCicdPlatforms: vi.fn().mockReturnValue(['github-actions']),
    } as unknown as Mocked<GeneratorService>;

    mockRepositoryService = {
      getRepository: vi.fn().mockResolvedValue({
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
        fullName: 'test/repo',
      }),
      autoDetectRepositoryPlatform: vi.fn().mockResolvedValue('github'),
      getSupportedRepositoryPlatforms: vi.fn().mockReturnValue(['git', 'github']),
    } as unknown as Mocked<RepositoryService>;

    useCase = new GenerateDocumentationUseCase(
      mockLogger,
      mockGeneratorService,
      mockRepositoryService
    );
  });

  afterEach(() => {
    // Restore real filesystem after each test
    mockFs.restore();
    vi.resetAllMocks();
  });

  describe('input validation', () => {
    it('should require a source manifest path', async () => {
      await expect(useCase.execute({ source: '' } as any)).rejects.toThrow(
        'Source manifest file path is required'
      );
    });

    it('allows omitted output (adapter auto-detects)', async () => {
      await expect(useCase.execute({ source: './action.yml' })).resolves.toBeDefined();
    });

    it('validates repository platform when provided', async () => {
      await expect(
        useCase.execute({ source: './action.yml', repository: { platform: 'invalid' } } as any)
      ).rejects.toThrow("Invalid repository platform 'invalid'. Valid platforms: git, github");
    });

    it('validates cicd platform when provided', async () => {
      await expect(
        useCase.execute({ source: './action.yml', cicd: { platform: 'invalid' } } as any)
      ).rejects.toThrow("Invalid CI/CD platform 'invalid'. Valid platforms: github-actions");
    });
  });

  describe('happy paths & logging', () => {
    it('logs basic information and returns destination', async () => {
      const result = await useCase.execute({ source: './action.yml' });

      expect(mockLogger.info).toHaveBeenCalledWith('Starting documentation generation...');
      expect(mockLogger.info).toHaveBeenCalledWith('Source manifest: ./action.yml');
      expect(mockLogger.info).toHaveBeenCalledWith('Documentation generated successfully!');
      expect(mockLogger.info).toHaveBeenCalledWith('Output saved to: ./README.md');

      expect(result).toEqual({ success: true, message: 'Documentation generated successfully', outputPath: './README.md' });
    });

    it('uses specified cicd adapter when provided', async () => {
      await useCase.execute({ source: './action.yml', cicd: { platform: 'github-actions' } });

      expect(mockGeneratorService.getGeneratorAdapterByPlatform).toHaveBeenCalledWith('github-actions');
      expect(mockGeneratorService.autoDetectCicdAdapter).not.toHaveBeenCalled();
      expect(mockGeneratorService.generateDocumentationForPlatform).toHaveBeenCalledWith(expect.any(Object), './action.yml', undefined);
    });

    it('auto-detects cicd adapter when not specified', async () => {
      await useCase.execute({ source: './action.yml' });

      expect(mockGeneratorService.autoDetectCicdAdapter).toHaveBeenCalledWith('./action.yml');
      expect(mockGeneratorService.generateDocumentationForPlatform).toHaveBeenCalledWith(expect.any(Object), './action.yml', undefined);
    });

    it('throws when adapter cannot be auto-detected', async () => {
      mockGeneratorService.autoDetectCicdAdapter = vi.fn().mockReturnValue(null) as any;
      await expect(useCase.execute({ source: './action.yml' })).rejects.toThrow(
        "No CI/CD platform could be auto-detected for source './action.yml'. Please specify one using --cicd option."
      );
    });

    it('throws when specified adapter is not found', async () => {
      mockGeneratorService.getSupportedCicdPlatforms = vi.fn().mockReturnValue(['github-actions', 'test-platform']) as any;
      mockGeneratorService.getGeneratorAdapterByPlatform = vi.fn().mockReturnValue(undefined) as any;

      await expect(
        useCase.execute({ source: './action.yml', cicd: { platform: 'test-platform' } })
      ).rejects.toThrow("No generator adapter found for CI/CD platform 'test-platform'");
    });
  });
});
