import { describe, it, expect } from 'vitest';
import { LicenseSectionGenerator } from './license-section-generator.adapter.js';
import { FormatterAdapter, MarkdownFormatterAdapter, Repository, SectionIdentifier } from '@ci-dokumentor/core';
import { GitHubAction } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../test-utils/github-action-mock.factory.js';
import { initTestContainer } from '@ci-dokumentor/repository-github';

describe('LicenseSectionGenerator - Enhanced License Support', () => {
  let formatterAdapter: FormatterAdapter;
  let generator: LicenseSectionGenerator;
  let mockRepository: Repository;

  beforeEach(() => {
    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new LicenseSectionGenerator();

    // Create mock repository
    mockRepository = {
      url: 'https://github.com/owner/repo',
      owner: 'owner',
      name: 'repo',
      fullName: 'owner/repo',
    } as Repository;
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
    it('should generate license section with GitHub API license information', () => {
      // Arrange
      const manifest: GitHubAction = GitHubActionMockFactory.create();

      // Act
      const result = generator.generateSection(
        formatterAdapter,
        manifest,
        {
          ...mockRepository,
          license: {
            name: 'Apache License 2.0',
            spdxId: 'Apache-2.0',
            url: 'https://api.github.com/licenses/apache-2.0',
          },
        }
      );

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

    it('should return empty buffer when no license information is available', () => {
      // Arrange
      const manifest: GitHubAction = GitHubActionMockFactory.create();

      // Act
      const result = generator.generateSection(
        formatterAdapter,
        manifest,
        mockRepository
      );

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual('');
    });

    it('should return empty buffer when no license information is available', () => {
      // Arrange
      const manifest: GitHubAction = {
        usesName: 'owner/repo',
        name: 'Test Action',
        description: 'A test action',
        runs: { using: 'node20' },
      };

      // Act
      const result = generator.generateSection(
        formatterAdapter,
        manifest,
        mockRepository
      );

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual('');
    });
  });
});
