import { describe, vi, beforeEach, afterEach, Mocked } from 'vitest';
import mockFs from 'mock-fs';

import { GenerateDocumentationUseCase } from './generate-documentation.usecase.js';
import { GeneratorService, RepositoryService } from '@ci-dokumentor/core';
import { Logger } from '../interfaces/logger.interface.js';
import { LoggerMockFactory } from '../../../__tests__/logger-mock.factory.js';
import { GeneratorServiceMockFactory, RepositoryServiceMockFactory, RepositoryProviderMockFactory, GeneratorAdapterMockFactory } from '@ci-dokumentor/core/tests';

describe('GenerateDocumentationUseCase', () => {
  let useCase: GenerateDocumentationUseCase;
  let mockLogger: Mocked<Logger>;
  let mockGeneratorService: Mocked<GeneratorService>;
  let mockRepositoryService: Mocked<RepositoryService>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockFs({
      './action.yml': 'name: test-action\n',
      './README.md': '',
    });

    mockLogger = LoggerMockFactory.create();
    mockGeneratorService = GeneratorServiceMockFactory.create();

    mockRepositoryService = RepositoryServiceMockFactory.create({
      getRepository: {
        owner: 'test',
        name: 'repo',
        url: 'https://github.com/test/repo',
        fullName: 'test/repo',
      }
    });

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

  describe('getSupportedRepositoryPlatforms', () => {

    it('returns values from repository service', () => {
      mockRepositoryService.getSupportedRepositoryPlatforms.mockReturnValue([
        'github',
        'gitlab',
      ]);

      const result = useCase.getSupportedRepositoryPlatforms();

      expect(result).toEqual(['github', 'gitlab']);
      expect(mockRepositoryService.getSupportedRepositoryPlatforms).toHaveBeenCalled();
    });

  })

  describe('getSupportedCicdPlatforms', () => {

    it('returns values from generator service', () => {
      mockGeneratorService.getSupportedCicdPlatforms.mockReturnValue([
        'github-actions',
      ]);

      const result = useCase.getSupportedCicdPlatforms();

      expect(result).toEqual(['github-actions']);
      expect(mockGeneratorService.getSupportedCicdPlatforms).toHaveBeenCalled();
    });

  })

  describe('getSupportedOptions', () => {

    it('returns options for an explicit repository platform', async () => {
      const providerMock = RepositoryProviderMockFactory.create({
        getOptions: { foo: { flags: '--foo', description: 'x' } }
      });

      mockRepositoryService.getRepositoryProviderByPlatform.mockReturnValue(providerMock);

      const result = await useCase.getRepositorySupportedOptions('github');

      expect(result).toEqual({ foo: { flags: '--foo', description: 'x' } });
      expect(mockRepositoryService.getRepositoryProviderByPlatform).toHaveBeenCalledWith('github');
      expect(providerMock.getOptions).toHaveBeenCalled();
    });

    it('auto-detects repository provider and returns its options', async () => {
      const providerMock = RepositoryProviderMockFactory.create({
        getOptions: { auto: { flags: '--auto', description: 'auto' } }
      });
      mockRepositoryService.autoDetectRepositoryProvider.mockResolvedValue(providerMock);

      const result = await useCase.getRepositorySupportedOptions();

      expect(result).toEqual({
        auto: {
          description: 'auto',
          flags: '--auto',
        },
      });
      expect(mockRepositoryService.autoDetectRepositoryProvider).toHaveBeenCalled();
      expect(providerMock.getOptions).toHaveBeenCalled();
    });

  })

  describe('getSupportedSectionsForCicdPlatform', () => {

    it('returns sections for explicit cicd platform', () => {
      const adapterMock: any = { getSupportedSections: vi.fn().mockReturnValue(['intro', 'usage']) };
      mockGeneratorService.getGeneratorAdapterByPlatform.mockReturnValue(adapterMock);

      const result = useCase.getSupportedSections({ cicdPlatform: 'github-actions' });

      expect(result).toEqual(['intro', 'usage']);
      expect(mockGeneratorService.getGeneratorAdapterByPlatform).toHaveBeenCalledWith('github-actions');
      expect(adapterMock.getSupportedSections).toHaveBeenCalled();
    });

    it('auto-detects adapter from source and returns sections', () => {
      const adapterMock: any = { getSupportedSections: vi.fn().mockReturnValue(['a', 'b']) };
      mockGeneratorService.autoDetectCicdAdapter.mockReturnValue(adapterMock);

      const result = useCase.getSupportedSections({ source: './action.yml' });

      expect(result).toEqual(['a', 'b']);
      expect(mockGeneratorService.autoDetectCicdAdapter).toHaveBeenCalledWith('./action.yml');
      expect(adapterMock.getSupportedSections).toHaveBeenCalled();
    });

    it('returns undefined when no adapter is found', () => {
      mockGeneratorService.getGeneratorAdapterByPlatform.mockReturnValue(undefined);

      const result = useCase.getSupportedSections({ cicdPlatform: 'unknown' });

      expect(result).toBeUndefined();
    });

  })

  describe('execute', () => {

    it('successfully generates documentation when adapters are found', async () => {
      const repositoryProviderMock = RepositoryProviderMockFactory.create({
        getPlatformName: 'github'
      });

      const generatorAdapterMock = GeneratorAdapterMockFactory.create({
        getPlatformName: 'github-actions',
      });

      mockRepositoryService.autoDetectRepositoryProvider.mockResolvedValue(repositoryProviderMock);
      mockGeneratorService.autoDetectCicdAdapter.mockReturnValue(generatorAdapterMock);
      mockGeneratorService.generateDocumentationForPlatform.mockResolvedValue('/tmp/out/README.md');

      const result = await useCase.execute({ source: './action.yml' });

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('/tmp/out/README.md');
      expect(mockGeneratorService.generateDocumentationForPlatform).toHaveBeenCalledWith(
        generatorAdapterMock,
        './action.yml',
        undefined
      );
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('throws when source is missing', async () => {
      await expect(useCase.execute({ source: '' })).rejects.toThrow('Source manifest file path is required');
    });

    it('throws when source file does not exist', async () => {
      await expect(useCase.execute({ source: './no-such-file.yml' })).rejects.toThrow('Source manifest file does not exist');
    });

    it('throws when provided repository platform is invalid', async () => {
      mockRepositoryService.getSupportedRepositoryPlatforms.mockReturnValue(['github']);

      await expect(
        useCase.execute({ source: './action.yml', repository: { platform: 'unknown' } })
      ).rejects.toThrow("Invalid repository platform 'unknown'");
    });

    it('throws when provided cicd platform is invalid', async () => {
      mockGeneratorService.getSupportedCicdPlatforms.mockReturnValue(['github-actions']);

      await expect(
        useCase.execute({ source: './action.yml', cicd: { platform: 'invalid' } })
      ).rejects.toThrow("Invalid CI/CD platform 'invalid'");
    });

    it('throws when repository cannot be auto-detected', async () => {
      mockRepositoryService.autoDetectRepositoryProvider.mockResolvedValue(undefined);

      await expect(useCase.execute({ source: './action.yml' })).rejects.toThrow('No repository platform could be auto-detected');
    });

    it('throws when cicd adapter cannot be auto-detected', async () => {
      const repositoryProviderMock = RepositoryProviderMockFactory.create({
        getPlatformName: 'github'
      });

      mockRepositoryService.autoDetectRepositoryProvider.mockResolvedValue(repositoryProviderMock);
      mockGeneratorService.autoDetectCicdAdapter.mockReturnValue(undefined);

      await expect(useCase.execute({ source: './action.yml' })).rejects.toThrow("No CI/CD platform could be auto-detected for source './action.yml'");
    });

  })
});

