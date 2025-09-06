import { describe, it, expect, Mocked } from 'vitest';
import { LicenseSectionGenerator } from './license-section-generator.adapter.js';
import { FormatterAdapter, MarkdownFormatterAdapter, SectionIdentifier, SectionGenerationPayload, RepositoryProvider } from '@ci-dokumentor/core';
import { GitHubAction } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { initTestContainer } from '@ci-dokumentor/repository-github';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('LicenseSectionGenerator - Enhanced License Support', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: LicenseSectionGenerator;

  beforeEach(() => {
    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: {
        url: 'https://github.com/owner/repo',
        owner: 'owner',
        name: 'repo',
        fullName: 'owner/repo',
      },
    });

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new LicenseSectionGenerator();
  });

  describe('getSectionIdentifier', () => {
    it('should return Outputs section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.License);
    });
  });

  describe('generateSection', () => {
    it('should generate license section with GitHub API license information', async () => {
      // Arrange
      const manifest: GitHubAction = GitHubActionMockFactory.create();

      mockRepositoryProvider.getLicense.mockResolvedValue({
        name: 'Apache License 2.0',
        spdxId: 'Apache-2.0',
        url: 'https://api.github.com/licenses/apache-2.0',
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
        `## License

This project is licensed under the Apache License 2.0.

SPDX-License-Identifier: Apache-2.0

Copyright © 2025 owner

For more details, see the [license](https://api.github.com/licenses/apache-2.0).
`
      );
    });

    it('should return empty buffer when no license information is available', async () => {
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

    it('should return empty buffer when no license information is available', async () => {
      // Arrange
      const manifest: GitHubAction = {
        usesName: 'owner/repo',
        name: 'Test Action',
        description: 'A test action',
        runs: { using: 'node20' },
      };

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
