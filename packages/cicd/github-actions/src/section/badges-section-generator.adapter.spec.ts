import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { BadgesSectionGenerator } from './badges-section-generator.adapter.js';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  SectionGenerationPayload,
  RepositoryProvider,
} from '@ci-dokumentor/core';
import { initTestContainer } from '../container.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('BadgesSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: BadgesSectionGenerator;


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

    generator = new BadgesSectionGenerator();
  });

  describe('getSectionIdentifier', () => {
    it('should return Badges section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Badges);
    });
  });

  describe('generateSection', () => {
    describe('with GitHub Action manifest', () => {
      it('should generate badges section for GitHub Action', async () => {
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
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://img.shields.io/github/license/owner/repo)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
`
        );
      });
    });

    describe('with GitHub Workflow manifest', () => {
      it('should generate badges section for GitHub Workflow', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create();
        const payload: SectionGenerationPayload<GitHubWorkflow> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
        };

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual(
          `[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://img.shields.io/github/license/owner/repo)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
`
        );
      });
    });
  });
});
