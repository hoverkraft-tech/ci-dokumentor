import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { InputsSectionGenerator } from './inputs-section-generator.adapter.js';
import {
  GitHubAction,
  GitHubWorkflow,
  GitHubActionInput,
  GitHubActionsManifest,
  GitHubWorkflowDispatchInput,
} from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
} from '@ci-dokumentor/core';
import { initTestContainer } from '../container.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('InputsSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: InputsSectionGenerator;

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

    generator = new InputsSectionGenerator();
  });

  describe('getSectionIdentifier', () => {
    it('should return Inputs section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Inputs);
    });
  });

  describe('generateSection', () => {
    describe('with GitHub Action manifest', () => {
      it('should generate inputs section for GitHub Action with inputs', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          inputs: {
            'input-name': {
              description: 'Test input description',
              required: true,
              default: 'default-value',
            },
            'optional-input': {
              description: 'Optional input description',
              required: false,
            },
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Inputs

| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |
| **\`input-name\`** | Test input description | **true** | \`default-value\` |
| **\`optional-input\`** | Optional input description | **false** | \`\` |
`
        );
      });

      it('should generate inputs section for GitHub Action without inputs', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Inputs

| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |
`
        );
      });

      it('should generate inputs section for GitHub Action with empty inputs object', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({ inputs: {} });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Inputs

| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |
`
        );
      });

      it('should handle inputs with missing optional properties', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          inputs: { 'minimal-input': {} as GitHubActionInput },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Inputs

| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |
| **\`minimal-input\`** |  | **false** | \`\` |
`
        );
      });
    });

    describe('with GitHub Workflow manifest', () => {
      it('should generate inputs section for GitHub Workflow with workflow_call inputs', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: {
            workflow_call: {
              inputs: {
                environment: {
                  description: 'Environment to deploy to',
                  required: true,
                  type: 'string',
                  default: 'staging',
                },
                version: {
                  description: 'Version to deploy',
                  required: false,
                  type: 'string',
                },
              },
            },
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Inputs

### Workflow Call Inputs

| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |
| **\`environment\`** | Environment to deploy to | **true** | **string** | \`staging\` |
| **\`version\`** | Version to deploy | **false** | **string** | \`\` |
`
        );
      });

      it('should generate inputs section for GitHub Workflow without workflow_dispatch', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: { push: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          ``
        );
      });

      it('should generate inputs section for GitHub Workflow with workflow_dispatch but no inputs', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: { workflow_dispatch: {} },
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider
        });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          ``
        );
      });

      it('should handle workflow inputs with missing optional properties', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: {
            workflow_dispatch: {
              inputs: {
                'minimal-input': {
                  description: 'Minimal input',
                  type: 'string',
                } as GitHubWorkflowDispatchInput,
              },
            },
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Inputs

### Workflow Dispatch Inputs

| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |
| **\`minimal-input\`** | Minimal input | **false** | **string** | \`\` |
`
        );
      });

      it('should handle workflow inputs with options but no description', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: {
            workflow_dispatch: {
              inputs: {
                'no-description-input': {
                  description: '',
                  type: 'string',
                },
              },
            },
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Inputs

### Workflow Dispatch Inputs

| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |
| **\`no-description-input\`** |  | **false** | **string** | \`\` |
`
        );
      });
    });

    describe('error handling', () => {
      it('should throw error for unsupported manifest type', () => {
        // Arrange
        const invalidManifest = {
          unsupportedType: true,
        } as unknown as GitHubActionsManifest;

        // Act & Assert
        expect(generator.generateSection({ formatterAdapter, manifest: invalidManifest, repositoryProvider: mockRepositoryProvider })).rejects.toThrow('Unsupported manifest type for InputsSectionGenerator');
      });
    });
  });
});
