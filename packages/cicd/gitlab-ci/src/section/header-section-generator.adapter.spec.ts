import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
  ReadableContent,
} from '@ci-dokumentor/core';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import { GitLabComponentMockFactory } from '../../__tests__/gitlab-component-mock.factory.js';
import { GitLabCIPipelineMockFactory } from '../../__tests__/gitlab-pipeline-mock.factory.js';
import { initTestContainer } from '../container.js';
import { HeaderSectionGenerator } from './header-section-generator.adapter.js';

describe('HeaderSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;
  let generator: HeaderSectionGenerator;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create();

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new HeaderSectionGenerator();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSectionIdentifier', () => {
    it('should return Header section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Header);
    });
  });

  describe('generateSection', () => {
    it('should generate header with title only when no logo', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        name: 'Docker Build Component'
      });
      mockRepositoryProvider.getLogo.mockResolvedValue(undefined);

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: 'docs.md'
      });

      // Assert
      expect(result).toBeInstanceOf(ReadableContent);
      const content = result.toString();
      expect(content).toContain('# Docker Build Component');
      expect(content).not.toContain('<div');
      expect(content).not.toContain('---');
    });

    it('should generate header with title and logo when logo exists', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        name: 'Docker Build Component'
      });
      mockRepositoryProvider.getLogo.mockResolvedValue('https://example.com/logo.png');

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: 'docs.md'
      });

      // Assert
      expect(result).toBeInstanceOf(ReadableContent);
      const content = result.toString();
      expect(content).toContain('# Docker Build Component');
      expect(content).toContain('<div align="center">');
      expect(content).toContain('<img src="https://example.com/logo.png"');
      expect(content).toContain('---');
    });

    it('should handle file:// logo URLs correctly', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        name: 'Test Component'
      });
      mockRepositoryProvider.getLogo.mockResolvedValue('file://.gitlab/logo.png');

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: 'templates/component/docs.md'
      });

      // Assert
      expect(result).toBeInstanceOf(ReadableContent);
      const content = result.toString();
      expect(content).toContain('# Test Component');
      expect(content).toContain('<img src="../../.gitlab/logo.png"');
    });

    it('should work with GitLab CI pipeline manifests', async () => {
      // Arrange
      const manifest = GitLabCIPipelineMockFactory.create({
        name: 'CI/CD Pipeline'
      });
      mockRepositoryProvider.getLogo.mockResolvedValue(undefined);

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: 'README.md'
      });

      // Assert
      expect(result).toBeInstanceOf(ReadableContent);
      const content = result.toString();
      expect(content).toContain('# CI/CD Pipeline');
    });

    it('should handle destination being undefined', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        name: 'Test Component'
      });
      mockRepositoryProvider.getLogo.mockResolvedValue('file://.gitlab/logo.png');

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: undefined as any
      });

      // Assert
      expect(result).toBeInstanceOf(ReadableContent);
      const content = result.toString();
      expect(content).toContain('# Test Component');
      expect(content).toContain('<img src=".gitlab/logo.png"');
    });

    it('should generate proper relative paths for nested component docs', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        name: 'Nested Component'
      });
      mockRepositoryProvider.getLogo.mockResolvedValue('file://assets/logo.svg');

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: 'templates/deeply/nested/component/docs.md'
      });

      // Assert
      expect(result).toBeInstanceOf(ReadableContent);
      const content = result.toString();
      expect(content).toContain('# Nested Component');
      expect(content).toContain('<img src="../../../../assets/logo.svg"');
    });
  });
});