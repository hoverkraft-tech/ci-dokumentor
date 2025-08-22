import { describe, it, expect, beforeEach } from 'vitest';
import { BadgesSectionGenerator } from './badges-section-generator.adapter.js';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import {
  FormatterAdapter,
  SectionIdentifier,
  Repository,
  MarkdownFormatterAdapter,
} from '@ci-dokumentor/core';
import { initTestContainer } from '../container.js';

describe('BadgesSectionGenerator', () => {
  let formatterAdapter: FormatterAdapter;
  let generator: BadgesSectionGenerator;
  let mockRepository: Repository;

  beforeEach(() => {
    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new BadgesSectionGenerator();

    // Create mock repository
    mockRepository = {
      url: 'https://github.com/owner/repo',
      owner: 'owner',
      name: 'repo',
      fullName: 'owner/repo',
    };
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
      it('should generate badges section for GitHub Action', () => {
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
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://img.shields.io/github/license/owner/repo)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)`
        );
      });
    });

    describe('with GitHub Workflow manifest', () => {
      it('should generate badges section for GitHub Workflow', () => {
        // Arrange
        const manifest: GitHubWorkflow = {
          usesName: 'owner/repo/.github/workflows/test-workflow.yml',
          name: 'Test Workflow',
          on: { push: {} },
          jobs: {}
        };

        // Act
        const result = generator.generateSection(
          formatterAdapter,
          manifest,
          mockRepository
        );

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual(
          `[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://img.shields.io/github/license/owner/repo)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)`
        );
      });
    });
  });
});
