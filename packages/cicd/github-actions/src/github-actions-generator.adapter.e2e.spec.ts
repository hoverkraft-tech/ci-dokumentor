import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitHubActionsGeneratorAdapter } from './github-actions-generator.adapter.js';
import {
  FileRendererAdapter,
  RepositoryProvider,
  RendererAdapter,
  MarkdownFormatterAdapter,
  FormatterAdapter,
} from '@ci-dokumentor/core';
import { initTestContainer } from './container.js';
import mockFs from 'mock-fs';
import { existsSync, readFileSync } from 'node:fs';
import { GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { sanitizeSnapshotContent } from '@ci-dokumentor/core/tests';
import { join } from 'node:path';

const rootPath = join(__dirname, '../../../..');

describe('GitHubActionsGeneratorAdapter - Integration Tests', () => {
  let repositoryProvider: RepositoryProvider;
  let formatterAdapter: FormatterAdapter;
  let rendererAdapter: RendererAdapter;
  let gitHubActionsGeneratorAdapter: GitHubActionsGeneratorAdapter;

  beforeEach(async () => {
    // Use real dependencies from the container
    const container = initTestContainer();

    repositoryProvider = container.get(GitRepositoryProvider);
    formatterAdapter = container.get(MarkdownFormatterAdapter);
    rendererAdapter = container.get(FileRendererAdapter);

    gitHubActionsGeneratorAdapter = container.get(
      GitHubActionsGeneratorAdapter
    );
  });

  afterEach(() => {
    // Restore real file system
    mockFs.restore();
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('getPlatformName', () => {
    it('should return "github-actions" as platform name', () => {
      // Act
      const result = gitHubActionsGeneratorAdapter.getPlatformName();

      // Assert
      expect(result).toBe('github-actions');
    });
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

      const sourcePath = join(rootPath, 'action.yml');
      const destinationPath = join(rootPath, 'README.md');

      // Setup mock file with the action YAML content
      mockFs({
        [sourcePath]: actionYaml,
      });

      // Act
      await rendererAdapter.initialize(
        destinationPath,
        formatterAdapter,
      );

      await gitHubActionsGeneratorAdapter.generateDocumentation({
        source: sourcePath,
        sections: {},
        rendererAdapter,
        repositoryProvider,
      });

      await rendererAdapter.finalize();

      // Assert
      // Verify that the README.md file was created and has content
      expect(existsSync(destinationPath)).toBe(true);

      const generatedContent = readFileSync(destinationPath, 'utf-8');
      expect(generatedContent).toBeDefined();
      expect(generatedContent.length).toBeGreaterThan(0);

      // Snapshot test the generated content      
      const sanitizedContent = sanitizeSnapshotContent(generatedContent);
      expect(sanitizedContent).toMatchSnapshot('github-action-documentation');
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
  workflow_call:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: string
    outputs:
      deployment-url:
        description: 'URL of the deployed application'
    secrets:
      github-token:
        description: 'GitHub token for authentication'

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
      const sourcePath = join(rootPath, '.github/workflows/ci-cd.yml')
      const destinationPath = join(rootPath, '.github/workflows/ci-cd.md');


      // Setup mock file with the workflow YAML content
      mockFs({
        [sourcePath]: workflowYaml,
      });

      // Act
      await rendererAdapter.initialize(
        destinationPath,
        formatterAdapter,
      );

      await gitHubActionsGeneratorAdapter.generateDocumentation({
        source: sourcePath,
        sections: {},
        rendererAdapter,
        repositoryProvider,
      });

      await rendererAdapter.finalize();

      // Assert
      // Verify that the README.md file was created and has content
      expect(existsSync(destinationPath)).toBe(true);

      const generatedContent = readFileSync(destinationPath, 'utf-8');
      expect(generatedContent).toBeDefined();
      expect(generatedContent.length).toBeGreaterThan(0);

      // Snapshot test the generated content
      const sanitizedContent = sanitizeSnapshotContent(generatedContent);
      expect(sanitizedContent).toMatchSnapshot('workflow-documentation');
    });
  });

  describe('file support validation', () => {
    it('should correctly identify supported GitHub Action files', () => {
      const actionFiles = ['action.yml', 'action.yaml'];

      actionFiles.forEach((file) => {
        expect(gitHubActionsGeneratorAdapter.supportsSource(file)).toBe(true);
      });
    });

    it('should correctly identify supported GitHub Workflow files', () => {
      const workflowFiles = [
        '.github/workflows/ci.yml',
        '.github/workflows/ci.yaml',
        '.github/workflows/deploy.yml',
        '.github/workflows/release.yaml',
      ];

      workflowFiles.forEach((file) => {
        expect(gitHubActionsGeneratorAdapter.supportsSource(file)).toBe(true);
      });
    });

    it('should reject unsupported files', () => {
      const unsupportedFiles = [
        'package.json',
        'README.md',
        'config.yml',
        'action.json',
        '.github/dependabot.yml',
      ];

      unsupportedFiles.forEach((file) => {
        expect(gitHubActionsGeneratorAdapter.supportsSource(file)).toBe(false);
      });
    });
  });

  describe('documentation path generation', () => {
    it('should generate correct paths for GitHub Actions', () => {
      const testCases = [
        { input: 'action.yml', expected: 'README.md' },
        { input: 'action.yaml', expected: 'README.md' },
        { input: 'subfolder/action.yml', expected: 'subfolder/README.md' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(gitHubActionsGeneratorAdapter.getDocumentationPath(input)).toBe(
          expected
        );
      });
    });

    it('should generate correct paths for GitHub Workflows', () => {
      const testCases = [
        {
          input: '.github/workflows/ci.yml',
          expected: '.github/workflows/ci.md',
        },
        {
          input: '.github/workflows/deploy.yaml',
          expected: '.github/workflows/deploy.md',
        },
        {
          input: '.github/workflows/release.yml',
          expected: '.github/workflows/release.md',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(gitHubActionsGeneratorAdapter.getDocumentationPath(input)).toBe(
          expected
        );
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
        '/test/action.yml': malformedYaml,
      });

      // Act & Assert
      await rendererAdapter.initialize(
        '/test/README.md',
        formatterAdapter,
      );

      await expect(
        gitHubActionsGeneratorAdapter.generateDocumentation({
          source: '/test/action.yml',
          sections: {},
          rendererAdapter,
          repositoryProvider,
        })
      ).rejects.toThrow('Missing closing \'quote at line 3, column 42');

      await rendererAdapter.finalize();
    });

    it('should handle non-existent files gracefully', async () => {
      // Arrange
      // Setup empty mock file system
      mockFs({});


      // Act & Assert
      await rendererAdapter.initialize(
        '/test/README.md',
        formatterAdapter,
      );

      await expect(
        gitHubActionsGeneratorAdapter.generateDocumentation({
          source: '/test/action.yml',
          sections: {},
          rendererAdapter,
          repositoryProvider,
        })
      ).rejects.toThrow('Source file does not exist: "/test/action.yml"');

      await rendererAdapter.finalize();
    });

    it('should handle empty YAML files', async () => {
      // Arrange
      // Setup mock file with empty content
      mockFs({
        '/test/action.yml': '',
      });

      // Act
      await rendererAdapter.initialize(
        '/test/README.md',
        formatterAdapter,
      );

      await expect(
        gitHubActionsGeneratorAdapter.generateDocumentation({
          source: '/test/action.yml',
          sections: {},
          rendererAdapter,
          repositoryProvider,
        })
      ).rejects.toThrow('Unsupported source file: /test/action.yml');

      await rendererAdapter.finalize();
    });
  });
});
