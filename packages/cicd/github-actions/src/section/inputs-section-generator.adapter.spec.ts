import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
} from '@ci-dokumentor/core';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import {
  GitHubAction,
  GitHubWorkflow,
  GitHubActionInput,
  GitHubActionsManifest,
  GitHubWorkflowDispatchInput,
} from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { initTestContainer } from '../container.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { InputsSectionGenerator } from './inputs-section-generator.adapter.js';

describe('InputsSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: InputsSectionGenerator;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: RepositoryInfoMockFactory.create(),
    });

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new InputsSectionGenerator();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `## Inputs

| **Input**            | **Description**            | **Required** | **Default**     |
| -------------------- | -------------------------- | ------------ | --------------- |
| **\`input-name\`**     | Test input description     | **true**     | \`default-value\` |
| **\`optional-input\`** | Optional input description | **false**    | -               |
`
        );
      });

      it('should generate inputs section for GitHub Action with boolean default values', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          inputs: {
            'boolean-true-input': {
              description: 'Input with boolean true default',
              required: false,
              default: true, // YAML parser might return boolean values instead of strings
            },
            'boolean-false-input': {
              description: 'Input with boolean false default',
              required: false,
              default: false,
            },
            'string-input': {
              description: 'Input with string default',
              required: false,
              default: 'string-value',
            },
            'multiline-default-input': {
              description: 'Input with multiline default',
              required: false,
              default: 'line1\nline2\nline with *',
            },
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert
        expect(result.toString()).toEqual(
          `## Inputs

| **Input**                     | **Description**                  | **Required** | **Default**                                                                                              |
| ----------------------------- | -------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| **\`boolean-true-input\`**      | Input with boolean true default  | **false**    | \`true\`                                                                                                   |
| **\`boolean-false-input\`**     | Input with boolean false default | **false**    | \`false\`                                                                                                  |
| **\`string-input\`**            | Input with string default        | **false**    | \`string-value\`                                                                                           |
| **\`multiline-default-input\`** | Input with multiline default     | **false**    | <!-- textlint-disable --><pre lang="text">line1&#13;line2&#13;line with \\*</pre><!-- textlint-enable --> |
`
        );
      });

      it('should generate inputs section for GitHub Action without inputs', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `## Inputs

| **Input** | **Description** | **Required** | **Default** |
| --------- | --------------- | ------------ | ----------- |
`
        );
      });

      it('should generate inputs section for GitHub Action with empty inputs object', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({ inputs: {} });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `## Inputs

| **Input** | **Description** | **Required** | **Default** |
| --------- | --------------- | ------------ | ----------- |
`
        );
      });

      it('should handle inputs with missing optional properties', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          inputs: { 'minimal-input': {} as GitHubActionInput },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `## Inputs

| **Input**           | **Description** | **Required** | **Default** |
| ------------------- | --------------- | ------------ | ----------- |
| **\`minimal-input\`** |                 | **false**    | -           |
`
        );
      });

      it('should correctly render ${{ github.token }} in default value', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          inputs: {
            'github-token': {
              description: 'GitHub Token for deploying to GitHub Pages.',
              default: '${{ github.token }}',
            },
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert
        expect(result.toString()).toEqual(`## Inputs

| **Input**          | **Description**                             | **Required** | **Default**           |
| ------------------ | ------------------------------------------- | ------------ | --------------------- |
| **\`github-token\`** | GitHub Token for deploying to GitHub Pages. | **false**    | \`\${{ github.token }}\` |
`);
        expect(result.toString()).toEqual(
          `## Inputs

| **Input**          | **Description**                             | **Required** | **Default**           |
| ------------------ | ------------------------------------------- | ------------ | --------------------- |
| **\`github-token\`** | GitHub Token for deploying to GitHub Pages. | **false**    | \`\${{ github.token }}\` |
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
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `## Inputs

### Workflow Call Inputs

| **Input**         | **Description**          | **Required** | **Type**   | **Default** |
| ----------------- | ------------------------ | ------------ | ---------- | ----------- |
| **\`environment\`** | Environment to deploy to | **true**     | **string** | \`staging\`   |
| **\`version\`**     | Version to deploy        | **false**    | **string** | -           |
`
        );
      });

      it('should generate inputs section for GitHub Workflow without workflow_dispatch', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: { push: {} },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
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
          , destination: 'README.md'
        });

        // Assert

        expect(result.toString()).toEqual(
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
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `## Inputs

### Workflow Dispatch Inputs

| **Input**           | **Description** | **Required** | **Type**   | **Default** |
| ------------------- | --------------- | ------------ | ---------- | ----------- |
| **\`minimal-input\`** | Minimal input   | **false**    | **string** | -           |
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
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

        // Assert

        expect(result.toString()).toEqual(
          `## Inputs

### Workflow Dispatch Inputs

| **Input**                  | **Description** | **Required** | **Type**   | **Default** |
| -------------------------- | --------------- | ------------ | ---------- | ----------- |
| **\`no-description-input\`** |                 | **false**    | **string** | -           |
`
        );
      });
    });

    describe('error handling', () => {
      it('should throw error for unsupported manifest type', async () => {
        // Arrange
        const invalidManifest = {
          unsupportedType: true,
        } as unknown as GitHubActionsManifest;

        // Act & Assert
        await expect(generator.generateSection({ formatterAdapter, manifest: invalidManifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' })).rejects.toThrow('Unsupported manifest type for InputsSectionGenerator');
      });
    });
  });
});
