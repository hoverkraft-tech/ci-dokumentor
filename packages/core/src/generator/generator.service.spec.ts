import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { LinkFormat } from '../formatter/formatter.adapter.js';
import type { FormatterAdapter, FormatterOptions } from '../formatter/formatter.adapter.js';
import type { FormatterService } from '../formatter/formatter.service.js';
import type { RendererFactory } from '../renderer/renderer.factory.js';
import { DiffRendererAdapter } from '../renderer/diff-renderer.adapter.js';
import { FileRendererAdapter } from '../renderer/file-renderer.adapter.js';
import type { RepositoryProvider } from '../repository/repository.provider.js';
import {
  FormatterServiceMockFactory,
  GeneratorAdapterMockFactory,
  RendererAdapterMockFactory,
  RepositoryProviderMockFactory,
} from '../../__tests__/index.js';
import { GeneratorService } from './generator.service.js';
import type { GeneratorAdapter, GenerateSectionsOptions } from './generator.adapter.js';

describe('GeneratorService', () => {
  let generatorService: GeneratorService;
  let formatterService: Mocked<FormatterService>;
  let rendererFactory: RendererFactory;
  let mockFileRenderer: Mocked<FileRendererAdapter>;
  let mockDiffRenderer: Mocked<DiffRendererAdapter>;
  let repositoryProvider: Mocked<RepositoryProvider>;
  let githubAdapter: Mocked<GeneratorAdapter>;
  let gitlabAdapter: Mocked<GeneratorAdapter>;
  let formatterAdapter: FormatterAdapter;

  const formatterOptions: FormatterOptions = { linkFormat: LinkFormat.Auto };
  const sections: GenerateSectionsOptions = { includeSections: ['summary'] };
  const source = '/tmp/source.yml';

  beforeEach(() => {
    formatterAdapter = {
      setOptions: vi.fn(),
    } as unknown as FormatterAdapter;

    formatterService = FormatterServiceMockFactory.create({
      getFormatterAdapterForFile: formatterAdapter,
    });

    mockFileRenderer = RendererAdapterMockFactory.create() as Mocked<FileRendererAdapter>;
    mockDiffRenderer = RendererAdapterMockFactory.create() as Mocked<DiffRendererAdapter>;

    rendererFactory = vi.fn().mockImplementation(
      (dryRun: boolean) => dryRun ? mockDiffRenderer : mockFileRenderer
    );

    githubAdapter = GeneratorAdapterMockFactory.create({
      getPlatformName: 'github-actions',
      getDocumentationPath: '/tmp/README.md',
      supportsSource: false,
    });

    gitlabAdapter = GeneratorAdapterMockFactory.create({
      getPlatformName: 'gitlab-ci',
      getDocumentationPath: '/tmp/GITLAB.md',
      supportsSource: false,
    });

    repositoryProvider = RepositoryProviderMockFactory.create();

    generatorService = new GeneratorService(
      formatterService,
      rendererFactory,
      [githubAdapter, gitlabAdapter]
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupportedCicdPlatforms', () => {
    it('returns supported CI/CD platforms from registered adapters', () => {
      // Act
      const result = generatorService.getSupportedCicdPlatforms();

      // Assert
      expect(result).toEqual(['github-actions', 'gitlab-ci']);
      expect(githubAdapter.getPlatformName).toHaveBeenCalled();
      expect(gitlabAdapter.getPlatformName).toHaveBeenCalled();
    });
  });

  describe('getGeneratorAdapterByPlatform', () => {
    it('returns generator adapter by platform name when it exists', () => {
      // Act
      const adapter = generatorService.getGeneratorAdapterByPlatform('gitlab-ci');

      // Assert
      expect(adapter).toBe(gitlabAdapter);
    });

    it('returns undefined when generator adapter for platform does not exist', () => {
      // Act
      const adapter = generatorService.getGeneratorAdapterByPlatform('bitbucket');

      // Assert
      expect(adapter).toBeUndefined();
    });
  });

  describe('autoDetectCicdPlatform', () => {
    it('auto-detects CI/CD platform when adapter supports the source', () => {
      // Arrange
      githubAdapter.supportsSource.mockReturnValueOnce(true);

      // Act
      const platform = generatorService.autoDetectCicdPlatform(source);

      // Assert
      expect(platform).toBe('github-actions');
      expect(githubAdapter.supportsSource).toHaveBeenCalledWith(source);
      expect(gitlabAdapter.supportsSource).not.toHaveBeenCalled();
    });

    it('returns null when no adapter supports auto-detected platform', () => {
      // Act
      const platform = generatorService.autoDetectCicdPlatform(source);

      // Assert
      expect(platform).toBeNull();
      expect(githubAdapter.supportsSource).toHaveBeenCalledWith(source);
      expect(gitlabAdapter.supportsSource).toHaveBeenCalledWith(source);
    });

    it('auto-detects CI/CD adapter instance when it supports the source', () => {
      // Arrange
      gitlabAdapter.supportsSource.mockReturnValueOnce(true);

      // Act
      const adapter = generatorService.autoDetectCicdAdapter(source);

      // Assert
      expect(adapter).toBe(gitlabAdapter);
      expect(githubAdapter.supportsSource).toHaveBeenCalledWith(source);
      expect(gitlabAdapter.supportsSource).toHaveBeenCalledWith(source);
    });

    it('returns undefined when no adapter supports the source', () => {
      // Act
      const adapter = generatorService.autoDetectCicdAdapter(source);

      // Assert
      expect(adapter).toBeUndefined();
      expect(githubAdapter.supportsSource).toHaveBeenCalledWith(source);
      expect(gitlabAdapter.supportsSource).toHaveBeenCalledWith(source);
    });
  });

  describe('generateDocumentationForPlatform', () => {
    it('generates documentation using adapter default destination when supported', async () => {
      // Arrange
      githubAdapter.supportsSource.mockReturnValue(true);
      mockDiffRenderer.finalize.mockResolvedValueOnce('diff-output');

      // Act
      const result = await generatorService.generateDocumentationForPlatform({
        source,
        dryRun: true,
        sections,
        generatorAdapter: githubAdapter,
        repositoryProvider,
        formatterOptions,
      });

      // Assert
      expect(githubAdapter.getDocumentationPath).toHaveBeenCalledWith(source);
      expect(formatterService.getFormatterAdapterForFile).toHaveBeenCalledWith('/tmp/README.md');
      expect(formatterAdapter.setOptions).toHaveBeenCalledWith(formatterOptions);
      expect(rendererFactory).toHaveBeenCalledWith(true);
      expect(mockDiffRenderer.initialize).toHaveBeenCalledWith('/tmp/README.md', formatterAdapter);
      expect(githubAdapter.generateDocumentation).toHaveBeenCalledWith({
        source,
        sections,
        rendererAdapter: mockDiffRenderer,
        repositoryProvider,
      });
      expect(mockDiffRenderer.finalize).toHaveBeenCalled();
      expect(result).toEqual({ destination: '/tmp/README.md', data: 'diff-output' });
    });

    it('generates documentation using provided destination', async () => {
      // Arrange
      const customDestination = '/tmp/custom.md';
      githubAdapter.supportsSource.mockReturnValue(true);
      mockFileRenderer.finalize.mockResolvedValueOnce('final-content');

      // Act
      const result = await generatorService.generateDocumentationForPlatform({
        source,
        destination: customDestination,
        dryRun: false,
        sections,
        generatorAdapter: githubAdapter,
        repositoryProvider,
        formatterOptions,
      });

      // Assert
      expect(githubAdapter.getDocumentationPath).not.toHaveBeenCalled();
      expect(formatterService.getFormatterAdapterForFile).toHaveBeenCalledWith(customDestination);
      expect(formatterAdapter.setOptions).toHaveBeenCalledWith(formatterOptions);
      expect(rendererFactory).toHaveBeenCalledWith(false);
      expect(mockFileRenderer.initialize).toHaveBeenCalledWith(customDestination, formatterAdapter);
      expect(githubAdapter.generateDocumentation).toHaveBeenCalledWith({
        source,
        sections,
        rendererAdapter: mockFileRenderer,
        repositoryProvider,
      });
      expect(mockFileRenderer.finalize).toHaveBeenCalled();
      expect(result).toEqual({ destination: customDestination, data: 'final-content' });
    });

    it('throws when adapter does not support the provided source', async () => {
      // Act & Assert
      await expect(
        generatorService.generateDocumentationForPlatform({
          source,
          destination: undefined,
          dryRun: false,
          sections,
          generatorAdapter: githubAdapter,
          repositoryProvider,
          formatterOptions,
        })
      ).rejects.toThrow(
        "CI/CD platform 'github-actions' does not support source '/tmp/source.yml'"
      );

      expect(githubAdapter.getDocumentationPath).not.toHaveBeenCalled();
      expect(formatterService.getFormatterAdapterForFile).not.toHaveBeenCalled();
    });
  });
});
