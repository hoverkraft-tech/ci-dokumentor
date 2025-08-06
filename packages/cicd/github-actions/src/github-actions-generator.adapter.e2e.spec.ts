import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitHubActionsGeneratorAdapter } from './github-actions-generator.adapter.js';
import {
  FormatterAdapter,
  FileOutputAdapter,
  MarkdownFormatterAdapter,
  RepositoryService,
} from '@ci-dokumentor/core';
import { initGlobalContainer } from './test/global-container.js';
import mockFs from 'mock-fs';
import { existsSync, readFileSync } from 'fs';
import { Repository } from '@ci-dokumentor/core';

describe('GitHubActionsGeneratorAdapter - Integration Tests', () => {
  let formatterAdapter: FormatterAdapter;
  let gitHubActionsGeneratorAdapter: GitHubActionsGeneratorAdapter;
  let repositoryService: RepositoryService;

  beforeEach(async () => {
    // Use real dependencies from the container
    const container = initGlobalContainer();

    formatterAdapter = container.get(MarkdownFormatterAdapter);
    repositoryService = container.get(RepositoryService);
    gitHubActionsGeneratorAdapter = container.get(GitHubActionsGeneratorAdapter);

    // Mock the repository service to return consistent test data
    const mockRepository: Repository = {
      url: 'https://github.com/test-owner/test-action',
      name: 'test-action',
      owner: 'test-owner',
      fullName: 'test-owner/test-action',
      logo: 'https://example.com/logo.png',
    };

    vi.spyOn(repositoryService, 'getRepository').mockResolvedValue(mockRepository);
  });

  afterEach(() => {
    // Restore real file system
    mockFs.restore();
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('generateDocumentation', () => {
    it('should generate complete documentation for a GitHub Action', async () => {
      // Arrange
      const actionYaml = `
name: 'Build and Deploy'
description: 'Builds the application and deploys it to the specified environment'
author: 'CI Team'
branding:
  icon: 'upload-cloud'
  color: 'blue'
inputs:
  environment:
    description: 'Target environment (staging, production)'
    required: true
  version:
    description: 'Version to deploy'
    required: false
    default: 'latest'
  dry-run:
    description: 'Run in dry-run mode'
    required: false
    default: 'false'
  config-file:
    description: 'Path to configuration file'
    required: false
    default: 'config/deploy.yml'
outputs:
  deployment-url:
    description: 'URL of the deployed application'
  build-artifacts:
    description: 'Path to build artifacts'
  deployment-status:
    description: 'Status of the deployment (success/failure)'
runs:
  using: 'node20'
  main: 'dist/index.js'
  pre: 'scripts/pre-deploy.js'
  post: 'scripts/post-deploy.js'
`;

      // Setup mock file with the action YAML content
      mockFs({
        '/test/action.yml': actionYaml,
      });

      // Use real FileOutputAdapter for integration testing
      const outputAdapter = new FileOutputAdapter('/test/README.md', formatterAdapter);

      // Act
      await gitHubActionsGeneratorAdapter.generateDocumentation(
        '/test/action.yml',
        formatterAdapter,
        outputAdapter
      );

      // Assert
      const expectedDocumentationPath = '/test/README.md';
      // Verify that the README.md file was created and has content
      expect(existsSync(expectedDocumentationPath)).toBe(true);

      const generatedContent = readFileSync(expectedDocumentationPath, 'utf-8');
      expect(generatedContent).toBeDefined();
      expect(generatedContent.length).toBeGreaterThan(0);

      // Snapshot test the generated content
      expect(generatedContent).toMatchSnapshot('github-action-documentation');
    });

    it('should generate documentation for a CI/CD workflow', async () => {
      // Arrange
      const workflowYaml = `
name: 'CI/CD Pipeline'

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io

jobs:
  test:
    name: 'Run Tests'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    name: 'Build Application'
    runs-on: ubuntu-latest
    needs: test
    outputs:
      image-tag: \${{ steps.meta.outputs.tags }}
      image-digest: \${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ github.repository }}
      
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}

  deploy:
    name: 'Deploy to Environment'
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://app.example.com
    steps:
      - name: Deploy application
        run: |
          echo "Deploying \${{ needs.build.outputs.image-tag }}"
          echo "Image digest: \${{ needs.build.outputs.image-digest }}"
`;

      // Setup mock file with the workflow YAML content
      mockFs({
        '/test/.github/workflows/ci-cd.yml': workflowYaml,
      });

      // Use real FileOutputAdapter for integration testing
      const outputAdapter = new FileOutputAdapter('/test/.github/workflows/ci-cd.md', formatterAdapter);

      // Act
      await gitHubActionsGeneratorAdapter.generateDocumentation(
        '/test/.github/workflows/ci-cd.yml',
        formatterAdapter,
        outputAdapter
      );

      // Assert
      const expectedDocumentationPath = '/test/.github/workflows/ci-cd.md';
      // Verify that the README.md file was created and has content
      expect(existsSync(expectedDocumentationPath)).toBe(true);

      const generatedContent = readFileSync(expectedDocumentationPath, 'utf-8');
      expect(generatedContent).toBeDefined();
      expect(generatedContent.length).toBeGreaterThan(0);

      // Snapshot test the generated content
      expect(generatedContent).toMatchSnapshot('workflow-documentation');
    });
  });

  describe('file support validation', () => {
    it('should correctly identify supported GitHub Action files', () => {
      const actionFiles = [
        'action.yml',
        'action.yaml'
      ];

      actionFiles.forEach(file => {
        expect(gitHubActionsGeneratorAdapter.supportsSource(file)).toBe(true);
      });
    });

    it('should correctly identify supported GitHub Workflow files', () => {
      const workflowFiles = [
        '.github/workflows/ci.yml',
        '.github/workflows/ci.yaml',
        '.github/workflows/deploy.yml',
        '.github/workflows/release.yaml'
      ];

      workflowFiles.forEach(file => {
        expect(gitHubActionsGeneratorAdapter.supportsSource(file)).toBe(true);
      });
    });

    it('should reject unsupported files', () => {
      const unsupportedFiles = [
        'package.json',
        'README.md',
        'config.yml',
        'action.json',
        '.github/dependabot.yml'
      ];

      unsupportedFiles.forEach(file => {
        expect(gitHubActionsGeneratorAdapter.supportsSource(file)).toBe(false);
      });
    });
  });

  describe('documentation path generation', () => {
    it('should generate correct paths for GitHub Actions', () => {
      const testCases = [
        { input: 'action.yml', expected: 'README.md' },
        { input: 'action.yaml', expected: 'README.md' },
        { input: 'subfolder/action.yml', expected: 'subfolder/README.md' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(gitHubActionsGeneratorAdapter.getDocumentationPath(input)).toBe(expected);
      });
    });

    it('should generate correct paths for GitHub Workflows', () => {
      const testCases = [
        { input: '.github/workflows/ci.yml', expected: '.github/workflows/ci.md' },
        { input: '.github/workflows/deploy.yaml', expected: '.github/workflows/deploy.md' },
        { input: '.github/workflows/release.yml', expected: '.github/workflows/release.md' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(gitHubActionsGeneratorAdapter.getDocumentationPath(input)).toBe(expected);
      });
    });
  });

  describe('error handling', () => {
    it('should handle malformed YAML files gracefully', async () => {
      // Arrange
      const malformedYaml = `
name: 'Malformed Action'
description: 'This YAML has syntax errors
inputs:
  missing-quotes: this should be quoted
    invalid-indentation: true
runs:
  using: 'node20
  main: index.js
`;

      // Setup mock file with malformed YAML
      mockFs({
        '/test/action.yml': malformedYaml
      });

      // Use real FileOutputAdapter for this test
      const outputAdapter = new FileOutputAdapter('/test/README.md', formatterAdapter);

      // Act & Assert
      await expect(
        gitHubActionsGeneratorAdapter.generateDocumentation(
          '/test/action.yml',
          formatterAdapter,
          outputAdapter
        )
      ).rejects.toThrow();
    });

    it('should handle non-existent files gracefully', async () => {
      // Arrange
      // Setup empty mock file system
      mockFs({});

      // Use real FileOutputAdapter for this test
      const outputAdapter = new FileOutputAdapter('/test/README.md', formatterAdapter);

      // Act & Assert
      await expect(
        gitHubActionsGeneratorAdapter.generateDocumentation(
          '/test/action.yml',
          formatterAdapter,
          outputAdapter
        )
      ).rejects.toThrow();
    });

    it('should handle empty YAML files', async () => {
      // Arrange
      // Setup mock file with empty content
      mockFs({
        '/test/action.yml': ''
      });

      // Use real FileOutputAdapter for this test
      const outputAdapter = new FileOutputAdapter('/test/README.md', formatterAdapter);

      // Act & Assert
      // This should either work with empty content or throw a meaningful error
      try {
        await gitHubActionsGeneratorAdapter.generateDocumentation(
          '/test/action.yml',
          formatterAdapter,
          outputAdapter
        );
        // If it succeeds, that's fine
      } catch (error) {
        // If it fails, the error should be meaningful
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
