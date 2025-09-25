import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
} from '@ci-dokumentor/core';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { initTestContainer } from '../container.js';
import { HeaderSectionGenerator } from './header-section-generator.adapter.js';

describe('HeaderSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: HeaderSectionGenerator;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: RepositoryInfoMockFactory.create()
    });

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
      expect(result).toEqual(SectionIdentifier.Header);
    });
  });

  describe('generateSection', () => {
    describe('with GitHub Action manifest', () => {
      it('should generate header section for GitHub Action without logo', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `# GitHub Action: Test Action
`
        );
      });

      it('should generate header section for GitHub Action with logo', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        mockRepositoryProvider.getLogo.mockResolvedValue('https://example.com/logo.png');

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `# GitHub Action: Test Action

<div align="center">
  <img src="https://example.com/logo.png" width="60px" align="center" alt="Test Action" />
</div>

---

`
        );
      });

      it('should generate header section with relative path for local logo file', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        mockRepositoryProvider.getLogo.mockResolvedValue('file://.github/logo.png');

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'README.md'
        });

        // Assert

        expect(result.toString()).toEqual(
          `# GitHub Action: Test Action

<div align="center">
  <img src=".github/logo.png" width="60px" align="center" alt="Test Action" />
</div>

---

`
        );
      });

      it('should generate header section with correct relative path for nested destination', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        mockRepositoryProvider.getLogo.mockResolvedValue('file://.github/logo.png');

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'docs/actions/README.md'
        });

        // Assert

        expect(result.toString()).toEqual(
          `# GitHub Action: Test Action

<div align="center">
  <img src="../../.github/logo.png" width="60px" align="center" alt="Test Action" />
</div>

---

`
        );
      });

      it('should generate header section for GitHub Action with branding icon', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          branding: { icon: 'activity', color: 'blue' },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYWN0aXZpdHkiIGNvbG9yPSJibHVlIj48cG9seWxpbmUgcG9pbnRzPSIyMiAxMiAxOCAxMiAxNSAyMSA5IDMgNiAxMiAyIDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==) GitHub Action: Test Action
`
        );
      });

      it('should generate header section for GitHub Action with branding icon and default color', async () => {
        // Arrange
        const manifest: GitHubAction = {
          usesName: 'owner/repo',
          name: 'Test Action',
          description: 'A test action',
          runs: { using: 'node20' },
          branding: {
            icon: 'activity',
          },
        };

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYWN0aXZpdHkiIGNvbG9yPSJncmF5LWRhcmsiPjxwb2x5bGluZSBwb2ludHM9IjIyIDEyIDE4IDEyIDE1IDIxIDkgMyA2IDEyIDIgMTIiPjwvcG9seWxpbmU+PC9zdmc+) GitHub Action: Test Action
`
        );
      });

      it('should generate header section for GitHub Action with invalid branding icon', async () => {
        // Arrange
        const manifest: GitHubAction = {
          usesName: 'owner/repo',
          name: 'Test Action',
          description: 'A test action',
          runs: { using: 'node20' },
          branding: {
            icon: 'nonexistent-icon',
            color: 'blue',
          },
        };

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `# GitHub Action: Test Action
`
        );
      });

      it('should generate header section for GitHub Action with logo and branding icon', async () => {
        // Arrange
        const manifest: GitHubAction = {
          usesName: 'owner/repo',
          name: 'Test Action',
          description: 'A test action',
          runs: { using: 'node20' },
          branding: {
            icon: 'activity',
            color: 'blue',
          },
        };

        mockRepositoryProvider.getLogo.mockResolvedValue('https://example.com/logo.png');

        // Act        
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYWN0aXZpdHkiIGNvbG9yPSJibHVlIj48cG9seWxpbmUgcG9pbnRzPSIyMiAxMiAxOCAxMiAxNSAyMSA5IDMgNiAxMiAyIDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==) GitHub Action: Test Action

<div align="center">
  <img src="https://example.com/logo.png" width="60px" align="center" alt="Test Action" />
</div>

---

`
        );
      });
    });

    describe('with GitHub Workflow manifest', () => {
      it('should generate header section for GitHub Workflow without logo', async () => {
        // Arrange
        const manifest: GitHubWorkflow = {
          usesName: 'owner/repo/.github/workflows/test-workflow.yml',
          name: 'Test Workflow',
          on: { push: {} },
          jobs: {},
        };

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString())
          .toEqual(`# GitHub Workflow: Test Workflow
`);
      });

      it('should generate header section for GitHub Workflow with logo', async () => {
        // Arrange
        const manifest: GitHubWorkflow = {
          usesName: 'owner/repo/.github/workflows/test-workflow.yml',
          name: 'Test Workflow',
          on: { push: {} },
          jobs: {},
        };

        mockRepositoryProvider.getLogo.mockResolvedValue('https://example.com/logo.png');

        // Act        
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString())
          .toEqual(`# GitHub Workflow: Test Workflow

<div align="center">
  <img src="https://example.com/logo.png" width="60px" align="center" alt="Test Workflow" />
</div>

---

`);
      });

      it('should generate header section with relative path for workflow with local logo', async () => {
        // Arrange
        const manifest: GitHubWorkflow = {
          usesName: 'owner/repo/.github/workflows/test-workflow.yml',
          name: 'Test Workflow',
          on: { push: {} },
          jobs: {},
        };

        mockRepositoryProvider.getLogo.mockResolvedValue('file://.github/logo.png');

        // Act        
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: '.github/workflows/test-workflow.md'
        });

        // Assert

        expect(result.toString())
          .toEqual(`# GitHub Workflow: Test Workflow

<div align="center">
  <img src="../logo.png" width="60px" align="center" alt="Test Workflow" />
</div>

---

`);
      });

      it('should not generate branding icon for GitHub Workflow', async () => {
        // Arrange
        const manifest: GitHubWorkflow = {
          usesName: 'owner/repo/.github/workflows/test-workflow.yml',
          name: 'Test Workflow',
          on: { push: {} },
          jobs: {}
        };

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString())
          .toEqual(`# GitHub Workflow: Test Workflow
`);
      });
    });

    it('should handle empty manifest name', async () => {
      // Arrange
      const manifest: GitHubAction = {
        usesName: 'owner/repo',
        name: '',
        description: 'A test action',
        runs: { using: 'node20' },
      };

      // Act
      const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

      // Assert

      expect(result.toString()).toEqual(
        `# GitHub Action: Repo
`
      );
    });

    it('should handle manifest with special characters in name', async () => {
      // Arrange
      const manifest: GitHubAction = {
        usesName: 'owner/repo',
        name: 'Test & Action <script>',
        description: 'A test action',
        runs: { using: 'node20' },
      };

      // Act
      const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

      // Assert

      expect(result.toString()).toEqual(
        `# GitHub Action: Test & Action <script>
`
      );
    });

    it('should handle repository without logo property', async () => {
      // Arrange
      const manifest: GitHubAction = {
        usesName: 'owner/repo',
        name: 'Test Action',
        description: 'A test action',
        runs: { using: 'node20' },
      };


      // Act
      const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

      // Assert

      expect(result.toString()).toEqual(
        `# GitHub Action: Test Action
`
      );
    });

    it('should not modify external URLs even with destination', async () => {
      // Arrange
      const manifest: GitHubAction = GitHubActionMockFactory.create();

      mockRepositoryProvider.getLogo.mockResolvedValue('https://example.com/logo.png');

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: 'docs/nested/README.md'
      });

      // Assert

      expect(result.toString()).toEqual(
        `# GitHub Action: Test Action

<div align="center">
  <img src="https://example.com/logo.png" width="60px" align="center" alt="Test Action" />
</div>

---

`
      );
    });
  });
});
