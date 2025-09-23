import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  SectionGenerationPayload,
  RepositoryProvider,
} from '@ci-dokumentor/core';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { initTestContainer } from '../container.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { BadgesSectionGenerator } from './badges-section-generator.adapter.js';

describe('BadgesSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: BadgesSectionGenerator;


  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: RepositoryInfoMockFactory.create(),
      getLicense: {
        name: 'MIT',
        spdxId: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      getContributing: {
        url: 'https://github.com/owner/repo/blob/main/CONTRIBUTING.md',
      }
    });

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new BadgesSectionGenerator();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSectionIdentifier', () => {
    it('should return Badges section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Badges);
    });
  });

  describe('getSectionOptions', () => {
    it('should return extraBadges option descriptor', () => {
      // Act
      const result = generator.getSectionOptions();

      // Assert
      expect(result).toEqual({
        extraBadges: {
          flags: '--extra-badges <badges>',
          description: 'Additional badges to include as JSON array of objects with label, url, and linkUrl properties',
        },
      });
    });
  });

  describe('setSectionOptions', () => {
    it('should parse and set extra badges from valid JSON', () => {
      // Arrange
      const extraBadgesJson = JSON.stringify([
        { label: 'Custom Badge', url: 'https://img.shields.io/badge/custom-badge-green', linkUrl: 'https://example.com' },
        { label: 'Another Badge', badgeUrl: 'https://img.shields.io/badge/another-badge-blue', url: 'https://another.com' }
      ]);

      // Act
      generator.setSectionOptions({ extraBadges: extraBadgesJson });

      // Assert - we'll verify this works by testing generateSection output
    });

    it('should handle invalid JSON', () => {
      // Arrange
      const invalidJson = 'invalid json';

      // Act & Assert - should not throw
      expect(() => generator.setSectionOptions({ extraBadges: invalidJson })).toThrow(
        `Unexpected token 'i', "invalid json" is not valid JSON. When using this option in GitHub Actions, ensure the JSON is passed as a single argument or encode it (e.g. base64).`
      );
    });

    it('should handle non-array JSON', () => {
      // Arrange
      const nonArrayJson = JSON.stringify({ notAnArray: true });

      // Act & Assert - should not throw
      expect(() => generator.setSectionOptions({ extraBadges: nonArrayJson })).toThrow('The extra badges option must be a JSON array of badge objects.');
    });

    it('should handle undefined extraBadges', () => {
      // Act & Assert - should not throw
      expect(() => generator.setSectionOptions({ extraBadges: undefined })).not.toThrow();
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

          destination: 'README.md',

        };

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
`
        );
      });

      it('should not generate license badge if not present', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        mockRepositoryProvider.getLicense.mockResolvedValue(undefined);
        const payload: SectionGenerationPayload<GitHubAction> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,

          destination: 'README.md',

        };

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
`
        );
      });

      it('should not generate contributing badge if not present', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        mockRepositoryProvider.getContributing.mockResolvedValue(undefined);
        const payload: SectionGenerationPayload<GitHubAction> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,

          destination: 'README.md',

        };

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
`
        );
      });

      it('should include extra badges when provided', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();
        const payload: SectionGenerationPayload<GitHubAction> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,

          destination: 'README.md',

        };

        const extraBadgesJson = JSON.stringify([
          { label: 'Custom Badge', url: 'https://img.shields.io/badge/custom-badge-green', linkUrl: 'https://example.com' }
        ]);

        generator.setSectionOptions({ extraBadges: extraBadgesJson });

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
[![Custom Badge](https://img.shields.io/badge/custom-badge-green)](https://example.com)
`
        );
      });

      it('should handle badges without linkUrl', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();
        const payload: SectionGenerationPayload<GitHubAction> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,

          destination: 'README.md',

        };

        const extraBadgesJson = JSON.stringify([
          { label: 'Badge without linkUrl', url: 'https://img.shields.io/badge/badge-url-orange' }
        ]);

        generator.setSectionOptions({ extraBadges: extraBadgesJson });

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
![Badge without linkUrl](https://img.shields.io/badge/badge-url-orange)
`);
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

          destination: 'README.md',

        };

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
`
        );
      });

      it('should include extra badges for GitHub Workflow', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create();
        const payload: SectionGenerationPayload<GitHubWorkflow> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,

          destination: 'README.md',

        };

        const extraBadgesJson = JSON.stringify([
          { label: 'Workflow Badge', url: 'https://img.shields.io/badge/workflow-badge-red', linkUrl: 'https://workflow.com' }
        ]);

        generator.setSectionOptions({ extraBadges: extraBadgesJson });

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
[![Workflow Badge](https://img.shields.io/badge/workflow-badge-red)](https://workflow.com)
`
        );
      });
    });

    describe('edge cases', () => {
      it('should work when no extra badges are set', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();
        const payload: SectionGenerationPayload<GitHubAction> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,

          destination: 'README.md',

        };

        // Don't set any extra badges

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
`
        );
      });

      it('should work with empty extra badges array', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();
        const payload: SectionGenerationPayload<GitHubAction> = {
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,

          destination: 'README.md',

        };

        generator.setSectionOptions({ extraBadges: JSON.stringify([]) });

        // Act
        const result = await generator.generateSection(payload);

        // Assert
        expect(result.toString()).toEqual(
          `[![Marketplace](https://img.shields.io/badge/Marketplace-test--action-blue?logo=github-actions)](https://github.com/marketplace/actions/test-action)
[![Release](https://img.shields.io/github/v/release/owner/repo)](https://github.com/owner/repo/releases)
[![License](https://img.shields.io/github/license/owner/repo)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/owner/repo?style=social)](https://img.shields.io/github/stars/owner/repo?style=social)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/owner/repo/blob/main/CONTRIBUTING.md)
`
        );
      });
    });
  });
});
