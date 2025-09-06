import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { UsageSectionGenerator } from './usage-section-generator.adapter.js';
import {
  GitHubAction,
  GitHubWorkflow,
  GitHubActionInput,
  GitHubWorkflowSecret,
  GitHubWorkflowCallInput,
} from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
  VersionService,
} from '@ci-dokumentor/core';
import { initTestContainer } from '../container.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { RepositoryProviderMockFactory, VersionServiceMockFactory } from '@ci-dokumentor/core/tests';

describe('UsageSectionGenerator', () => {
  let mockVersionService: Mocked<VersionService>;
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: UsageSectionGenerator;

  beforeEach(() => {
    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: {
        url: 'https://github.com/owner/repo',
        owner: 'owner',
        name: 'repo',
        fullName: 'owner/repo',
      },
    });

    mockVersionService = VersionServiceMockFactory.create();

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new UsageSectionGenerator(mockVersionService);
  });

  describe('getSectionIdentifier', () => {
    it('should return Usage section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Usage);
    });
  });

  describe('generateSection', () => {
    describe('with GitHub Action manifest', () => {
      it('should generate usage section for simple GitHub Action without inputs', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
- uses: owner/repo

\`\`\`
`
        );
      });

      it('should generate usage section for GitHub Action with simple inputs', async () => {
        // Arrange
        const inputs: Record<string, GitHubActionInput> = {
          'api-key': {
            description: 'API key for authentication',
            required: true,
          },
          timeout: {
            description: 'Request timeout in seconds',
            default: '30',
          },
        };

        const manifest: GitHubAction = GitHubActionMockFactory.create({ inputs });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
- uses: owner/repo
  with:
    # API key for authentication
    # This input is required.
    api-key: ""

    # Request timeout in seconds
    # Default: \`30\`
    timeout: "30"

\`\`\`
`
        );
      });

      it('should generate usage section for GitHub Action with complex inputs', async () => {
        // Arrange
        const inputs: Record<string, GitHubActionInput> = {
          'boolean-input': {
            description: 'A boolean input',
            default: 'true',
            required: false,
          },
          'number-input': {
            description: 'A number input',
            required: true,
          },
          'optional-input': {
            description: 'An optional input',
          },
        };

        const manifest: GitHubAction = GitHubActionMockFactory.create({ inputs });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
- uses: owner/repo
  with:
    # A boolean input
    # Default: \`true\`
    boolean-input: "true"

    # A number input
    # This input is required.
    number-input: ""

    # An optional input
    optional-input: ""

\`\`\`
`
        );
      });

      it('should generate usage section with version information when available', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();
        const version = {
          ref: 'v1.0.0',
          sha: '08c6903cd8c0fde910a37f88322edcfb5dd907a8',
        };

        // Arrange: mock version resolution
        mockVersionService.getVersion.mockResolvedValue(version);

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
- uses: owner/repo@08c6903cd8c0fde910a37f88322edcfb5dd907a8

\`\`\`
`
        );
      });

      it('should generate usage section with ref when sha not available', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();
        const version = {
          ref: 'v1.0.0',
        };

        // Arrange: mock version resolution
        mockVersionService.getVersion.mockResolvedValue(version);

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
- uses: owner/repo@v1.0.0

\`\`\`
`
        );
      });
    });

    describe('with GitHub Workflow manifest', () => {
      it('should generate usage section for simple workflow without inputs', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/workflow.yml',
          name: 'Test Workflow',
          on: { push: { branches: ['main'] }, workflow_dispatch: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Test Workflow
on:
  push:
    branches:
      - main
jobs:
  workflow.yml:
    uses: owner/repo/.github/workflows/workflow.yml

\`\`\`
`
        );
      });

      it('should generate usage section for workflow with inputs and secrets', async () => {
        // Arrange
        const inputs: Record<string, GitHubWorkflowCallInput> = {
          environment: {
            description: 'Deployment environment',
            type: 'string',
            required: true,
          },
          version: {
            description: 'Version to deploy',
            type: 'string',
            default: 'latest',
          },
          debug: {
            description: 'Enable debug mode',
            type: 'boolean',
            default: 'false',
          },
        };

        const secrets: Record<string, GitHubWorkflowSecret> = {
          DEPLOY_TOKEN: {
            description: 'Token for deployment',
            required: true,
          },
          API_KEY: {
            description: 'Optional API key',
          },
        };

        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/deploy.yml',
          name: 'Deploy Workflow',
          on: { push: { branches: ['main'] }, workflow_call: { inputs, secrets } },
          permissions: { contents: 'read', deployments: 'write' },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Deploy Workflow
on:
  push:
    branches:
      - main
permissions:
  contents: read
  deployments: write
jobs:
  deploy.yml:
    uses: owner/repo/.github/workflows/deploy.yml
    secrets:
      # Token for deployment
      # This input is required.
      DEPLOY_TOKEN: ""

      # Optional API key
      API_KEY: ""
    with:
      # Deployment environment
      # This input is required.
      environment: ""

      # Version to deploy
      # Default: \`latest\`
      version: latest

      # Enable debug mode
      # Default: \`false\`
      debug: false

\`\`\`
`
        );
      });

      it('should generate usage section for workflow with only push trigger', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/ci.yml',
          name: 'CI Workflow',
          on: {
            push: { branches: ['main', 'develop'] },
            pull_request: { branches: ['main'] },
            workflow_dispatch: {},
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: CI Workflow
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
jobs:
  ci.yml:
    uses: owner/repo/.github/workflows/ci.yml

\`\`\`
`
        );
      });

      it('should generate usage section for workflow with complex on triggers', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/release.yml',
          name: 'Release Workflow',
          on: { release: { types: ['published'] }, schedule: [{ cron: '0 0 * * 0' }], workflow_dispatch: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Release Workflow
on:
  release:
    types:
      - published
  schedule:
    - cron: 0 0 * * 0
jobs:
  release.yml:
    uses: owner/repo/.github/workflows/release.yml

\`\`\`
`
        );
      });

      it('should handle workflow with no on triggers gracefully', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/test.yml',
          name: 'Test Workflow',
          on: { workflow_dispatch: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Test Workflow
on:
  push:
    branches:
      - main
jobs:
  test.yml:
    uses: owner/repo/.github/workflows/test.yml

\`\`\`
`
        );
      });

      it('should generate usage section for workflow with version information', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/workflow.yml',
          name: 'Test Workflow',
          on: { push: { branches: ['main'] }, workflow_dispatch: {} },
        });

        const version = {
          ref: 'v2.1.0',
          sha: 'abc123def456',
        };

        // Arrange: mock version resolution
        mockVersionService.getVersion.mockResolvedValue(version);

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Usage

\`\`\`yaml
name: Test Workflow
on:
  push:
    branches:
      - main
jobs:
  workflow.yml:
    uses: owner/repo/.github/workflows/workflow.yml@abc123def456

\`\`\`
`
        );
      });
    });
  });
});
