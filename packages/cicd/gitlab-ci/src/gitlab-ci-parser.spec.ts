import { describe, it, expect, beforeEach, afterEach, Mocked, vi } from 'vitest';
import { ReadableContent, ReaderAdapter, RepositoryInfo } from '@ci-dokumentor/core';
import { ReaderAdapterMockFactory, RepositoryInfoMockFactory } from '@ci-dokumentor/core/tests';
import {
  GitLabCIParser,
} from './gitlab-ci-parser.js';

describe('GitLabCIParser', () => {
  let mockReaderAdapter: Mocked<ReaderAdapter>;
  let mockRepositoryInfo: Mocked<RepositoryInfo>;
  let parser: GitLabCIParser;

  beforeEach(() => {
    vi.resetAllMocks();

    mockReaderAdapter = ReaderAdapterMockFactory.create();
    mockRepositoryInfo = RepositoryInfoMockFactory.create();

    parser = new GitLabCIParser(mockReaderAdapter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('isGitLabComponentFile', () => {
    it('should return true for component template files', () => {
      // Arrange
      const filePath = 'templates/docker-build/template.yml';

      // Act
      const result = parser.isGitLabComponentFile(filePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for component template files with yaml extension', () => {
      // Arrange
      const filePath = 'templates/test-component/template.yaml';

      // Act
      const result = parser.isGitLabComponentFile(filePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-component files', () => {
      // Arrange
      const filePath = '.gitlab-ci.yml';

      // Act
      const result = parser.isGitLabComponentFile(filePath);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for files not in templates directory', () => {
      // Arrange
      const filePath = 'src/template.yml';

      // Act
      const result = parser.isGitLabComponentFile(filePath);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isGitLabCIFile', () => {
    it('should return true for .gitlab-ci.yml files', () => {
      // Arrange
      const filePath = '.gitlab-ci.yml';

      // Act
      const result = parser.isGitLabCIFile(filePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for .gitlab-ci.yaml files', () => {
      // Arrange
      const filePath = '.gitlab-ci.yaml';

      // Act
      const result = parser.isGitLabCIFile(filePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for files ending with .gitlab-ci.yml', () => {
      // Arrange
      const filePath = 'custom.gitlab-ci.yml';

      // Act
      const result = parser.isGitLabCIFile(filePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for other YAML files', () => {
      // Arrange
      const filePath = 'action.yml';

      // Act
      const result = parser.isGitLabCIFile(filePath);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('parseFile', () => {
    describe('GitLab Components', () => {
      it('should parse a component file', async () => {
        // Arrange
        const filePath = 'templates/docker-build/template.yml';
        const fileContent = `# Docker Build Component
# A reusable component for building Docker images

spec:
  inputs:
    image_name:
      description: 'Name of the Docker image to build'
      type: string
      required: true
    image_tag:
      description: 'Tag for the Docker image'
      type: string
      default: 'latest'

docker-build:
  stage: build
  image: docker:24-dind
  script:
    - docker build -t $[[ inputs.image_name ]]:$[[ inputs.image_tag ]] .`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo);

        // Assert
        expect(result).toMatchObject({
          name: expect.any(String),
          description: 'Docker Build Component\nA reusable component for building Docker images',
          usesName: expect.stringContaining('templates/docker-build/template.yml'),
          spec: {
            inputs: {
              image_name: {
                description: 'Name of the Docker image to build',
                type: 'string',
                required: true
              },
              image_tag: {
                description: 'Tag for the Docker image',
                type: 'string',
                default: 'latest'
              }
            }
          }
        });
      });

      it('should generate name from filename when not provided', async () => {
        // Arrange
        const filePath = 'templates/test-component/template.yml';
        const fileContent = `spec:
  inputs:
    test_input:
      description: 'Test input'
      type: string`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo);

        // Assert
        expect(result.name).toBe('Template');
      });
    });

    describe('GitLab CI Pipelines', () => {
      it('should parse a GitLab CI pipeline file', async () => {
        // Arrange
        const filePath = '.gitlab-ci.yml';
        const fileContent = `# GitLab CI Pipeline
# This pipeline builds and tests the application

stages:
  - build
  - test

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm run build

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm test`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo);

        // Assert
        expect(result).toMatchObject({
          name: expect.any(String),
          description: 'GitLab CI Pipeline\nThis pipeline builds and tests the application',
          usesName: expect.any(String),
          stages: ['build', 'test'],
          variables: {
            NODE_VERSION: '18'
          },
          jobs: {
            build: {
              stage: 'build',
              image: 'node:$NODE_VERSION',
              script: ['npm run build']
            },
            test: {
              stage: 'test',
              image: 'node:$NODE_VERSION',
              script: ['npm test']
            }
          }
        });
      });

      it('should generate name from filename when not provided', async () => {
        // Arrange
        const filePath = '.gitlab-ci.yml';
        const fileContent = `stages:
  - build

build:
  stage: build
  script:
    - echo "Building"`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act
        const result = await parser.parseFile(filePath, mockRepositoryInfo);

        // Assert
        expect(result.name).toBe('.Gitlab Ci');
      });
    });

    describe('Error handling', () => {
      it('should throw error when file does not exist', async () => {
        // Arrange
        const filePath = 'non-existent.yml';
        mockReaderAdapter.resourceExists.mockReturnValue(false);

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo))
          .rejects.toThrow('Source file does not exist: "non-existent.yml"');
      });

      it('should throw error when YAML is invalid', async () => {
        // Arrange
        const filePath = '.gitlab-ci.yml';
        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(''));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo))
          .rejects.toThrow('Unsupported source file: .gitlab-ci.yml');
      });

      it('should throw error when YAML is not an object', async () => {
        // Arrange
        const filePath = '.gitlab-ci.yml';
        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent('[]'));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo))
          .rejects.toThrow('Unsupported GitLab CI file format: .gitlab-ci.yml');
      });

      it('should throw error for unsupported file format', async () => {
        // Arrange
        const filePath = 'unsupported.yml';
        const fileContent = `name: Test
runs:
  using: node20`;

        mockReaderAdapter.resourceExists.mockReturnValue(true);
        mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

        // Act & Assert
        await expect(parser.parseFile(filePath, mockRepositoryInfo))
          .rejects.toThrow('Unsupported source file: unsupported.yml');
      });
    });
  });

  describe('extractDescriptionFromComments', () => {
    it('should extract description from leading comments', async () => {
      // Arrange
      const filePath = '.gitlab-ci.yml';
      const fileContent = `# This is a test pipeline
# It does some testing
# And other things

stages:
  - test`;

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

      // Act
      const result = await parser.parseFile(filePath, mockRepositoryInfo);

      // Assert
      expect(result.description).toBe('This is a test pipeline\nIt does some testing\nAnd other things');
    });

    it('should handle empty lines in comments', async () => {
      // Arrange
      const filePath = '.gitlab-ci.yml';
      const fileContent = `# First line
#
# Third line

stages:
  - test`;

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

      // Act
      const result = await parser.parseFile(filePath, mockRepositoryInfo);

      // Assert
      expect(result.description).toBe('First line\n\nThird line');
    });

    it('should stop at YAML document separator', async () => {
      // Arrange
      const filePath = '.gitlab-ci.yml';
      const fileContent = `# Description line
---
# This should not be included
stages:
  - test`;

      mockReaderAdapter.resourceExists.mockReturnValue(true);
      mockReaderAdapter.readResource.mockResolvedValue(new ReadableContent(fileContent));

      // Act
      const result = await parser.parseFile(filePath, mockRepositoryInfo);

      // Assert
      expect(result.description).toBe('Description line');
    });
  });
});