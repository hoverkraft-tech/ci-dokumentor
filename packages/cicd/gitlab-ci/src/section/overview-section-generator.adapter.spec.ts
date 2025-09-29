import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import {
  FormatterAdapter,
  SectionIdentifier,
  MarkdownFormatterAdapter,
  RepositoryProvider,
  ReadableContent,
} from '@ci-dokumentor/core';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import { GitLabComponentMockFactory } from '../../__tests__/gitlab-component-mock.factory.js';
import { GitLabCIPipelineMockFactory } from '../../__tests__/gitlab-pipeline-mock.factory.js';
import { initTestContainer } from '../container.js';
import { OverviewSectionGenerator } from './overview-section-generator.adapter.js';

describe('OverviewSectionGenerator', () => {
  let mockRepositoryProvider: Mocked<RepositoryProvider>;
  let formatterAdapter: FormatterAdapter;
  let generator: OverviewSectionGenerator;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRepositoryProvider = RepositoryProviderMockFactory.create();

    const container = initTestContainer();
    formatterAdapter = container.get(MarkdownFormatterAdapter);

    generator = new OverviewSectionGenerator();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSectionIdentifier', () => {
    it('should return Overview section identifier', () => {
      // Act
      const result = generator.getSectionIdentifier();

      // Assert
      expect(result).toBe(SectionIdentifier.Overview);
    });
  });

  describe('generateSection', () => {
    it('should return description as paragraph when present', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        description: 'This is a test GitLab component that builds Docker images'
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
      expect(content).toEqual(`## Overview

This is a test GitLab component that builds Docker images
`);
    });

    it('should return empty content when description is not present', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        description: undefined
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

    it('should return empty content when description is empty string', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        description: ''
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

    it('should work with GitLab CI pipeline manifests', async () => {
      // Arrange
      const manifest = GitLabCIPipelineMockFactory.create({
        description: 'This is a CI/CD pipeline for Node.js applications'
      });

      // Act
      const result = await generator.generateSection({
        formatterAdapter,
        manifest,
        repositoryProvider: mockRepositoryProvider,
        destination: 'README.md'
      });

      // Assert
      expect(result).toBeInstanceOf(ReadableContent);
      const content = result.toString();
      expect(content).toEqual(`## Overview

This is a CI/CD pipeline for Node.js applications
`);
    });

    it('should handle multiline descriptions', async () => {
      // Arrange
      const manifest = GitLabComponentMockFactory.create({
        description: 'This is a multiline description\nWith multiple paragraphs\nAnd different content'
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
      expect(content).toEqual(`## Overview

This is a multiline description
With multiple paragraphs
And different content
`);
    });
  });
});