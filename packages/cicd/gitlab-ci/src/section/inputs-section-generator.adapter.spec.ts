import { describe, it, expect, beforeEach, afterEach, vi, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
  ReadableContent,
} from '@ci-dokumentor/core';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import { GitLabComponentInput } from '../gitlab-ci-parser.js';
import { GitLabComponentMockFactory } from '../../__tests__/gitlab-component-mock.factory.js';
import { GitLabCIPipelineMockFactory } from '../../__tests__/gitlab-pipeline-mock.factory.js';
import { initTestContainer } from '../container.js';
import { InputsSectionGenerator } from './inputs-section-generator.adapter.js';

describe('InputsSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;
  let generator: InputsSectionGenerator;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create();

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
    describe('with GitLab Component manifest', () => {
      it('should generate inputs table for component with inputs', async () => {
        // Arrange
        const manifest = GitLabComponentMockFactory.create({
          spec: {
            inputs: {
              'image-name': {
                description: 'Name of the Docker image',
                type: 'string',
                required: true
              },
              'image-tag': {
                description: 'Tag for the Docker image',
                type: 'string',
                default: 'latest'
              },
              'push-enabled': {
                description: 'Whether to push the image',
                type: 'boolean',
                default: 'true',
                required: false
              }
            }
          }
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'docs.md'
        });

        // Assert
        expect(result).toBeInstanceOf(ReadableContent);
        const content = result.toString();
        expect(content).toEqual(`## Inputs

| **Input**          | **Description**           | **Required** | **Type**    | **Default** |
| ------------------ | ------------------------- | ------------ | ----------- | ----------- |
| **\`image-name\`**   | Name of the Docker image  | **true**     | **string**  | -           |
| **\`image-tag\`**    | Tag for the Docker image  | **false**    | **string**  | \`latest\`    |
| **\`push-enabled\`** | Whether to push the image | **false**    | **boolean** | \`true\`      |
`);
      });

      it('should return empty content when component has no inputs', async () => {
        // Arrange
        const manifest = GitLabComponentMockFactory.create({
          spec: {
            inputs: {}
          }
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'docs.md'
        });

        // Assert
        expect(result.isEmpty()).toBe(true);
      });

      it('should return empty content when component has no spec', async () => {
        // Arrange
        const manifest = GitLabComponentMockFactory.create({
          spec: undefined
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'docs.md'
        });

        // Assert
        expect(result.isEmpty()).toBe(true);
      });

      it('should handle inputs with minimal information', async () => {
        // Arrange
        const manifest = GitLabComponentMockFactory.create({
          spec: {
            inputs: {
              'minimal-input': {}
            }
          }
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'docs.md'
        });

        // Assert
        expect(result).toBeInstanceOf(ReadableContent);
        const content = result.toString();
        expect(content).toEqual(`## Inputs

| **Input**           | **Description** | **Required** | **Type**   | **Default** |
| ------------------- | --------------- | ------------ | ---------- | ----------- |
| **\`minimal-input\`** |                 | **false**    | **string** | -           |
`);
      });

      it('should use inputs from root level if spec.inputs is not available', async () => {
        // Arrange
        const manifest = GitLabComponentMockFactory.create({
          inputs: {
            'root-input': {
              description: 'Input at root level',
              type: 'string'
            }
          },
          spec: {
            inputs: undefined as unknown as Record<string, GitLabComponentInput>
          }
        });

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'docs.md'
        });

        // Assert
        expect(result).toBeInstanceOf(ReadableContent);
        const content = result.toString();
        expect(content).toEqual(`## Inputs

| **Input**        | **Description**     | **Required** | **Type**   | **Default** |
| ---------------- | ------------------- | ------------ | ---------- | ----------- |
| **\`root-input\`** | Input at root level | **false**    | **string** | -           |
`);
      });
    });

    describe('with GitLab CI Pipeline manifest', () => {
      it('should return empty content for pipelines', async () => {
        // Arrange
        const manifest = GitLabCIPipelineMockFactory.create();

        // Act
        const result = await generator.generateSection({
          formatterAdapter,
          manifest,
          repositoryProvider: mockRepositoryProvider,
          destination: 'README.md'
        });

        // Assert
        expect(result.isEmpty()).toBe(true);
      });
    });
  });
});