import { describe, it, expect, Mocked } from 'vitest';
import { SecuritySectionGenerator } from './security-section-generator.adapter.js';
import { FormatterAdapter, MarkdownFormatterAdapter, SectionIdentifier, SectionGenerationPayload, RepositoryProvider } from '@ci-dokumentor/core';
import { GitHubAction } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { initTestContainer } from '@ci-dokumentor/repository-github';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('SecuritySectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: SecuritySectionGenerator;

  beforeEach(() => {
    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: RepositoryInfoMockFactory.create(),
    });

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new SecuritySectionGenerator();
  });

  describe('getSectionIdentifier', () => {
    it('should return Security section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Security);
    });
  });

  describe('generateSection', () => {
    it('should generate security section with security policy information', async () => {
      // Arrange
      const manifest: GitHubAction = GitHubActionMockFactory.create();

      mockRepositoryProvider.getSecurity.mockResolvedValue({
        url: 'https://github.com/owner/repo/security/policy',
      });

      const payload: SectionGenerationPayload<GitHubAction> = {
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
      };

      // Act
      const result = await generator.generateSection(payload);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual(
        `## Security

We take security seriously. Please see our [security policy](https://github.com/owner/repo/security/policy) for information on how to report security vulnerabilities.
`
      );
    });

    it('should return empty buffer when no security information is available', async () => {
      // Arrange
      const manifest: GitHubAction = GitHubActionMockFactory.create();
      const payload: SectionGenerationPayload<GitHubAction> = {
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
      };

      // Act
      const result = await generator.generateSection(payload);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual('');
    });

    it('should return empty buffer when security info url is undefined', async () => {
      // Arrange
      const manifest: GitHubAction = GitHubActionMockFactory.create();

      mockRepositoryProvider.getSecurity.mockResolvedValue({
        url: undefined as any,
      });

      const payload: SectionGenerationPayload<GitHubAction> = {
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
      };

      // Act
      const result = await generator.generateSection(payload);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual('');
    });
  });
});