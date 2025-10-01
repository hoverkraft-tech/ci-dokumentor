import { describe, vi, beforeEach, afterEach, Mocked } from 'vitest';

import { GeneratorService, LinkFormat, RepositoryService, ReaderAdapter } from '@ci-dokumentor/core';
import { GeneratorServiceMockFactory, RepositoryServiceMockFactory, RepositoryProviderMockFactory, GeneratorAdapterMockFactory, ReaderAdapterMockFactory } from '@ci-dokumentor/core/tests';
import { LoggerService } from '../logger/logger.service.js';
import { LoggerServiceMockFactory } from '../../../__tests__/logger-service-mock.factory.js';
import { GenerateDocumentationUseCase } from './generate-documentation.usecase.js';

describe('GenerateDocumentationUseCase', () => {
  let generateDocumentationUseCase: GenerateDocumentationUseCase;
  let mockLoggerService: Mocked<LoggerService>;
  let mockGeneratorService: Mocked<GeneratorService>;
  let mockRepositoryService: Mocked<RepositoryService>;
  let mockReaderAdapter: Mocked<ReaderAdapter>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockLoggerService = LoggerServiceMockFactory.create();
    mockGeneratorService = GeneratorServiceMockFactory.create();
    mockRepositoryService = RepositoryServiceMockFactory.create();
    mockReaderAdapter = ReaderAdapterMockFactory.create();

    mockReaderAdapter.resourceExists.mockImplementation((p: string) => {
      return p === './action.yml' || p === './README.md';
    });

    const mockConcurrencyService = {
      executeWithLimit: vi.fn().mockImplementation(async (tasks: any[], _: number) => {
        return Promise.allSettled(tasks.map(task => task()));
      }),
    } as any;

    generateDocumentationUseCase = new GenerateDocumentationUseCase(
      mockLoggerService,
      mockGeneratorService,
      mockRepositoryService,
      mockReaderAdapter,
      mockConcurrencyService
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSupportedRepositoryPlatforms', () => {

    it('returns values from repository service', () => {
      mockRepositoryService.getSupportedRepositoryPlatforms.mockReturnValue([
        'github',
        'gitlab',
      ]);

      const result = generateDocumentationUseCase.getSupportedRepositoryPlatforms();

      expect(result).toEqual(['github', 'gitlab']);
      expect(mockRepositoryService.getSupportedRepositoryPlatforms).toHaveBeenCalled();
    });

  })

  describe('getSupportedCicdPlatforms', () => {

    it('returns values from generator service', () => {
      mockGeneratorService.getSupportedCicdPlatforms.mockReturnValue([
        'github-actions',
      ]);

      const result = generateDocumentationUseCase.getSupportedCicdPlatforms();

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

      const result = await generateDocumentationUseCase.getRepositorySupportedOptions('github');

      expect(result).toEqual({ foo: { flags: '--foo', description: 'x' } });
      expect(mockRepositoryService.getRepositoryProviderByPlatform).toHaveBeenCalledWith('github');
      expect(providerMock.getOptions).toHaveBeenCalled();
    });

    it('auto-detects repository provider and returns its options', async () => {
      const providerMock = RepositoryProviderMockFactory.create({
        getOptions: { auto: { flags: '--auto', description: 'auto' } }
      });
      mockRepositoryService.autoDetectRepositoryProvider.mockResolvedValue(providerMock);

      const result = await generateDocumentationUseCase.getRepositorySupportedOptions();

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
      const adapterMock = GeneratorAdapterMockFactory.create({ getSupportedSections: ['intro', 'usage'] });
      mockGeneratorService.getGeneratorAdapterByPlatform.mockReturnValue(adapterMock);

      const result = generateDocumentationUseCase.getSupportedSections({ cicdPlatform: 'github-actions' });

      expect(result).toEqual(['intro', 'usage']);
      expect(mockGeneratorService.getGeneratorAdapterByPlatform).toHaveBeenCalledWith('github-actions');
      expect(adapterMock.getSupportedSections).toHaveBeenCalled();
    });

    it('auto-detects adapter from source and returns sections', () => {
      const adapterMock = GeneratorAdapterMockFactory.create({ getSupportedSections: ['a', 'b'] });
      mockGeneratorService.autoDetectCicdAdapter.mockReturnValue(adapterMock);

      const result = generateDocumentationUseCase.getSupportedSections({ source: './action.yml' });

      expect(result).toEqual(['a', 'b']);
      expect(mockGeneratorService.autoDetectCicdAdapter).toHaveBeenCalledWith('./action.yml');
      expect(adapterMock.getSupportedSections).toHaveBeenCalled();
    });

    it('returns undefined when no adapter is found', () => {
      mockGeneratorService.getGeneratorAdapterByPlatform.mockReturnValue(undefined);

      const result = generateDocumentationUseCase.getSupportedSections({ cicdPlatform: 'unknown' });

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
      mockGeneratorService.generateDocumentationForPlatform.mockResolvedValue({
        destination: '/tmp/out/README.md',
        data: undefined,
      });

      const result = await generateDocumentationUseCase.execute({
        outputFormat: 'text',
        source: './action.yml',
        dryRun: false,
        sections: {},
        formatterOptions: {
          linkFormat: LinkFormat.Auto
        }
      });

      expect(result.success).toBe(true);
      expect(result.destination).toBe('/tmp/out/README.md');
      expect(mockGeneratorService.generateDocumentationForPlatform).toHaveBeenCalledWith(
        {
          source: './action.yml',
          destination: undefined,
          dryRun: false,
          sections: {},
          generatorAdapter: generatorAdapterMock,
          repositoryProvider: repositoryProviderMock,
          formatterOptions: {
            linkFormat: LinkFormat.Auto
          }
        }
      );
      expect(mockLoggerService.info).toHaveBeenCalled();
    });

    it('throws when source is missing', async () => {
      await expect(generateDocumentationUseCase.execute({
        outputFormat: 'text',
        source: '',
        dryRun: false,
        sections: {},
        formatterOptions: { linkFormat: LinkFormat.Auto }
      })).rejects.toThrow('Source manifest file path is required');
    });

    it('throws when source file does not exist', async () => {
      await expect(generateDocumentationUseCase.execute({
        outputFormat: 'text',
        source: './no-such-file.yml',
        dryRun: false,
        sections: {},
        formatterOptions: { linkFormat: LinkFormat.Auto }
      })).rejects.toThrow('Source manifest file does not exist');
    });

    it('throws when provided repository platform is invalid', async () => {
      mockRepositoryService.getSupportedRepositoryPlatforms.mockReturnValue(['github']);

      await expect(
        generateDocumentationUseCase.execute({
          outputFormat: 'text',
          source: './action.yml',
          repository: { platform: 'unknown' },
          dryRun: false,
          sections: {},
          formatterOptions: { linkFormat: LinkFormat.Auto }
        })
      ).rejects.toThrow("Invalid repository platform 'unknown'");
    });

    it('throws when provided cicd platform is invalid', async () => {
      mockGeneratorService.getSupportedCicdPlatforms.mockReturnValue(['github-actions']);

      await expect(
        generateDocumentationUseCase.execute({
          outputFormat: 'text',
          source: './action.yml',
          cicd: { platform: 'invalid' },
          dryRun: false,
          sections: {},
          formatterOptions: { linkFormat: LinkFormat.Auto }
        })
      ).rejects.toThrow("Invalid CI/CD platform 'invalid'");
    });

    it('throws when repository cannot be auto-detected', async () => {
      mockRepositoryService.autoDetectRepositoryProvider.mockResolvedValue(undefined);

      // Ensure CI/CD adapter auto-detection succeeds so the repository auto-detect error is the one thrown
      const generatorAdapterMock = GeneratorAdapterMockFactory.create({ getPlatformName: 'github-actions' });
      mockGeneratorService.autoDetectCicdAdapter.mockReturnValue(generatorAdapterMock);

      await expect(generateDocumentationUseCase.execute({
        outputFormat: 'text',
        source: './action.yml',
        dryRun: false,
        sections: {},
        formatterOptions: { linkFormat: LinkFormat.Auto }
      })).rejects.toThrow('No repository platform could be auto-detected. Please specify one using --repository option.');
    });

    it('throws when cicd adapter cannot be auto-detected', async () => {
      const repositoryProviderMock = RepositoryProviderMockFactory.create({
        getPlatformName: 'github'
      });

      mockRepositoryService.autoDetectRepositoryProvider.mockResolvedValue(repositoryProviderMock);
      mockGeneratorService.autoDetectCicdAdapter.mockReturnValue(undefined);

      await expect(generateDocumentationUseCase.execute({
        outputFormat: 'text',
        source: './action.yml',
        dryRun: false,
        sections: {},
        formatterOptions: { linkFormat: LinkFormat.Auto }
      })).rejects.toThrow("No CI/CD platform could be auto-detected for source './action.yml'");
    });

  })
});

