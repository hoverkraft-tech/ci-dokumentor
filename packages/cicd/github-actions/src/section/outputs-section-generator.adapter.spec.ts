import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { OutputsSectionGenerator } from './outputs-section-generator.adapter.js';
import {
  GitHubAction,
  GitHubWorkflow,
  GitHubActionOutput,
  GitHubActionsManifest,
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
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('OutputsSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;

  let generator: OutputsSectionGenerator;

  beforeEach(() => {
    mockRepositoryProvider = RepositoryProviderMockFactory.create({
      getRepositoryInfo: RepositoryInfoMockFactory.create(),
    });

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new OutputsSectionGenerator();
  });

  describe('getSectionIdentifier', () => {
    it('should return Outputs section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Outputs);
    });
  });

  describe('generateSection', () => {
    describe('with GitHub Action manifest', () => {
      it('should generate outputs section for GitHub Action with outputs', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          outputs: {
            'output-name': {
              description: 'Test output description',
              value: '${{ steps.test.outputs.result }}',
            },
            'another-output': {
              description: 'Another output description',
              value: 'static-value',
            },
          },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual(
          `## Outputs

| **Output**           | **Description**            |
| -------------------- | -------------------------- |
| **\`output-name\`**    | Test output description    |
| **\`another-output\`** | Another output description |
`
        );
      });

      it('should generate outputs section for GitHub Action without outputs', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create();

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual(
          ``
        );
      });

      it('should generate outputs section for GitHub Action with empty outputs object', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({ outputs: {} });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe("");
      });

      it('should handle outputs with missing optional properties', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          outputs: { 'minimal-output': {} as GitHubActionOutput },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Outputs

| **Output**           | **Description** |
| -------------------- | --------------- |
| **\`minimal-output\`** |                 |
`
        );
      });

      it('should handle outputs with only description', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          outputs: { 'description-only': { description: 'Output with description only' } },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual(
          `## Outputs

| **Output**             | **Description**              |
| ---------------------- | ---------------------------- |
| **\`description-only\`** | Output with description only |
`
        );
      });

      it('should handle outputs with no description', async () => {
        // Arrange
        const manifest: GitHubAction = GitHubActionMockFactory.create({
          outputs: { 'no-description': { value: '${{ steps.build.outputs.version }}' } },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual(
          `## Outputs

| **Output**           | **Description** |
| -------------------- | --------------- |
| **\`no-description\`** |                 |
`
        );
      });
    });

    describe('with GitHub Workflow manifest', () => {
      it('should generate outputs section for GitHub Workflow with outputs', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: { workflow_call: { outputs: { 'workflow-output': { description: 'A workflow output', value: '${{ steps.build.outputs.version }}' } } } },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          `## Outputs

| **Output**            | **Description**   |
| --------------------- | ----------------- |
| **\`workflow-output\`** | A workflow output |
`
        );
      });

      it('should generate empty outputs section for GitHub Workflow', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          on: { workflow_call: { outputs: {} } },
        });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          ``
        );
      });

      it('should generate empty outputs section for GitHub Workflow with push trigger', async () => {
        // Arrange
        const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
          usesName: 'owner/repo/.github/workflows/ci.yml',
          name: 'CI Workflow',
          on: { push: {} },
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider
        , destination: 'README.md' });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(
          ``
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
        await expect(generator.generateSection({
          formatterAdapter, manifest: invalidManifest, repositoryProvider: mockRepositoryProvider
        , destination: 'README.md' })).rejects.toThrow('Unsupported manifest type for OutputsSectionGenerator');
      });
    });
  });
});
