import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FileRendererAdapter,
  RepositoryProvider,
  RendererAdapter,
  MarkdownFormatterAdapter,
  FormatterAdapter,
} from '@ci-dokumentor/core';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { sanitizeSnapshotContent } from '@ci-dokumentor/core/tests';
import mockFs, { restore } from 'mock-fs';
import { initTestContainer } from './container.js';
import { GitLabCIGeneratorAdapter } from './gitlab-ci-generator.adapter.js';

const rootPath = join(__dirname, '../../../..');

describe('GitLabCIGeneratorAdapter', () => {
  let repositoryProvider: RepositoryProvider;
  let formatterAdapter: FormatterAdapter;
  let rendererAdapter: RendererAdapter;
  let gitLabCIGeneratorAdapter: GitLabCIGeneratorAdapter;

  beforeEach(async () => {
    // Use real dependencies from the container
    const container = initTestContainer();

    repositoryProvider = container.get(GitRepositoryProvider);
    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);

    gitLabCIGeneratorAdapter = container.get(GitLabCIGeneratorAdapter);
  });

  afterEach(() => {
    // Restore real file system
    restore();
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('getPlatformName', () => {
    it('should return "gitlab-ci" as platform name', () => {
      // Act
      const result = gitLabCIGeneratorAdapter.getPlatformName();

      // Assert
      expect(result).toBe('gitlab-ci');
    });
  });

  describe('supportsSource', () => {
    it.each([
      'templates/test/template.yml',
      'templates/test/template.yaml',
      'templates/test.yml',
      'templates/test.yaml',
    ])('should correctly identify supported GitLab Component files', (file) => {

      expect(gitLabCIGeneratorAdapter.supportsSource(file)).toBe(true);
    });

    it.each([
      '.gitlab-ci.yml',
      '.gitlab-ci.yaml',
    ])('should correctly identify supported GitLab CI files', (file) => {
      expect(gitLabCIGeneratorAdapter.supportsSource(file)).toBe(true);
    });

    it.each([
      'package.json',
      'README.md',
      'config.yml',
      'action.yml',
      '.github/workflows/ci.yml',
      'docker-compose.yml',
    ])('should reject unsupported files', (file) => {
      expect(gitLabCIGeneratorAdapter.supportsSource(file)).toBe(false);
    });
  });

  describe('getDocumentationPath', () => {
    it.each([
      { input: 'templates/test/template.yml', expected: 'templates/test/docs.md' },
      { input: 'templates/test/template.yaml', expected: 'templates/test/docs.md' },
      { input: 'templates/test.yml', expected: 'templates/test.md' },
      { input: 'templates/test.yaml', expected: 'templates/test.md' },
    ])('should generate correct paths for GitLab Components', ({ input, expected }) => {
      expect(gitLabCIGeneratorAdapter.getDocumentationPath(input)).toBe(
        expected
      );
    });

    it.each([
      {
        input: '.gitlab-ci.yml',
        expected: '.gitlab-ci.md',
      },
      {
        input: '.gitlab-ci.yaml',
        expected: '.gitlab-ci.md',
      },
    ])('should generate correct paths for GitLab CI files', ({ input, expected }) => {
      expect(gitLabCIGeneratorAdapter.getDocumentationPath(input)).toBe(
        expected
      );
    });
  });

  describe('generateDocumentation', () => {
    it('should generate complete documentation for a GitLab Component', async () => {
      // Arrange
      const componentYaml = `
# Docker Build Component
# A reusable component for building and pushing Docker images

spec:
  inputs:
    image_name:
      description: 'Name of the Docker image to build'
      type: string
      required: true
    platforms:
      description: 'Target platforms for multi-arch builds'
      type: string
      default: 'linux/amd64,linux/arm64'
    dockerfile_path:
      description: 'Path to the Dockerfile'
      type: string
      default: 'Dockerfile'
    build_context:
      description: 'Build context directory'
      type: string
      default: '.'

docker-build:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker info
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  script:
    - |
      docker buildx create --use --driver docker-container
      docker buildx build \\
        --platform $[[ inputs.platforms ]] \\
        --file $[[ inputs.dockerfile_path ]] \\
        --tag $[[ inputs.image_name ]] \\
        --push \\
        $[[ inputs.build_context ]]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
`;

      const sourcePath = join(rootPath, 'templates/docker-build/template.yml');
      const destinationPath = join(rootPath, 'templates/docker-build/docs.md');

      // Setup mock file with the component YAML content
      mockFs({
        [sourcePath]: componentYaml,
      });

      // Act
      await rendererAdapter.initialize(
        destinationPath,
        formatterAdapter,
      );

      await gitLabCIGeneratorAdapter.generateDocumentation({
        source: sourcePath,
        sections: {},
        rendererAdapter,
        repositoryProvider,
      });

      await rendererAdapter.finalize();

      // Assert
      // Verify that the docs.md file was created and has content
      expect(existsSync(destinationPath)).toBe(true);

      const generatedContent = readFileSync(destinationPath, 'utf-8');
      expect(generatedContent).toBeDefined();
      expect(generatedContent.length).toBeGreaterThan(0);

      // Snapshot test the generated content      
      const sanitizedContent = sanitizeSnapshotContent(generatedContent);
      expect(sanitizedContent).toMatchSnapshot('gitlab-component-documentation');
    });

    it('should generate documentation for a GitLab CI Pipeline', async () => {
      // Arrange
      const pipelineYaml = `
# GitLab CI Pipeline for Node.js Application
# This pipeline builds, tests, and deploys a Node.js application

stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"
  REGISTRY: $CI_REGISTRY

workflow:
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_TAG

.node_template: &node_template
  image: node:\${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  before_script:
    - npm ci

build:
  <<: *node_template
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

test:
  <<: *node_template
  stage: test
  script:
    - npm run test:coverage
  coverage: '/Lines\\s*:\\s*(\\d+\\.?\\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    expire_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

lint:
  <<: *node_template
  stage: test
  script:
    - npm run lint
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

deploy:
  stage: deploy
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  script:
    - docker build -t $REGISTRY/$CI_PROJECT_PATH:$CI_COMMIT_SHA .
    - docker push $REGISTRY/$CI_PROJECT_PATH:$CI_COMMIT_SHA
    - docker tag $REGISTRY/$CI_PROJECT_PATH:$CI_COMMIT_SHA $REGISTRY/$CI_PROJECT_PATH:latest
    - docker push $REGISTRY/$CI_PROJECT_PATH:latest
  environment:
    name: production
    url: https://app.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
`;
      const sourcePath = join(rootPath, '.gitlab-ci.yml');
      const destinationPath = join(rootPath, '.gitlab-ci.md');

      // Setup mock file with the pipeline YAML content
      mockFs({
        [sourcePath]: pipelineYaml,
      });

      // Act
      await rendererAdapter.initialize(
        destinationPath,
        formatterAdapter,
      );

      await gitLabCIGeneratorAdapter.generateDocumentation({
        source: sourcePath,
        sections: {},
        rendererAdapter,
        repositoryProvider,
      });

      await rendererAdapter.finalize();

      // Assert
      // Verify that the .gitlab-ci.md file was created and has content
      expect(existsSync(destinationPath)).toBe(true);

      const generatedContent = readFileSync(destinationPath, 'utf-8');
      expect(generatedContent).toBeDefined();
      expect(generatedContent.length).toBeGreaterThan(0);

      // Snapshot test the generated content
      const sanitizedContent = sanitizeSnapshotContent(generatedContent);
      expect(sanitizedContent).toMatchSnapshot('gitlab-pipeline-documentation');
    });


    it('should handle empty YAML files', async () => {
      // Arrange
      // Setup mock file with empty content
      mockFs({
        '/test/.gitlab-ci.yml': '',
      });

      // Act
      await rendererAdapter.initialize(
        '/test/.gitlab-ci.md',
        formatterAdapter,
      );

      await expect(
        gitLabCIGeneratorAdapter.generateDocumentation({
          source: '/test/.gitlab-ci.yml',
          sections: {},
          rendererAdapter,
          repositoryProvider,
        })
      ).rejects.toThrow('Unsupported source file: /test/.gitlab-ci.yml');

      await rendererAdapter.finalize();
    });
  });
});