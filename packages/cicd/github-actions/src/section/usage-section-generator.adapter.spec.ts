import { describe, it, expect, beforeEach } from 'vitest';
import { UsageSectionGenerator } from './usage-section-generator.adapter.js';
import { GitHubAction, GitHubWorkflow, GitHubActionInput, GitHubWorkflowInput, GitHubWorkflowSecrets } from '../github-actions-parser.js';
import { FormatterAdapter, SectionIdentifier, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import { GitHubRepository } from '../repository/github-repository.service.js';
import { initContainer } from '../container.js';

describe('UsageSectionGenerator', () => {
    let formatterAdapter: FormatterAdapter;
    let generator: UsageSectionGenerator;
    let mockRepository: GitHubRepository;

    beforeEach(() => {
        // Use real formatter to facilitate testing
        const container = initContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new UsageSectionGenerator();

        // Create mock repository
        mockRepository = {
            url: 'https://github.com/owner/repo',
            owner: 'owner',
            name: 'repo',
            fullName: 'owner/repo'
        };
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
            it('should generate usage section for simple GitHub Action without inputs', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Usage
\`\`\`yaml
- uses: owner/repo

\`\`\``
                );
            });

            it('should generate usage section for GitHub Action with simple inputs', () => {
                // Arrange
                const inputs: Record<string, GitHubActionInput> = {
                    'api-key': {
                        description: 'API key for authentication',
                        required: true
                    },
                    'timeout': {
                        description: 'Request timeout in seconds',
                        default: '30'
                    }
                };

                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    inputs,
                    runs: { using: 'node20' }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

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

\`\`\``
                );
            });

            it('should generate usage section for GitHub Action with complex inputs', () => {
                // Arrange
                const inputs: Record<string, GitHubActionInput> = {
                    'boolean-input': {
                        description: 'A boolean input',
                        default: 'true',
                        required: false
                    },
                    'number-input': {
                        description: 'A number input',
                        required: true
                    },
                    'optional-input': {
                        description: 'An optional input'
                    }
                };

                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    inputs,
                    runs: { using: 'node20' }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

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

\`\`\``
                );
            });
        });

        describe('with GitHub Workflow manifest', () => {
            it('should generate usage section for simple workflow without inputs', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/workflow.yml',
                    name: 'Test Workflow',
                    on: {
                        push: { branches: ['main'] },
                        workflow_dispatch: {}
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

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

\`\`\``
                );
            });

            it('should generate usage section for workflow with inputs and secrets', () => {
                // Arrange
                const inputs: Record<string, GitHubWorkflowInput> = {
                    'environment': {
                        description: 'Deployment environment',
                        type: 'choice',
                        options: ['development', 'staging', 'production'],
                        required: true
                    },
                    'version': {
                        description: 'Version to deploy',
                        type: 'string',
                        default: 'latest'
                    },
                    'debug': {
                        description: 'Enable debug mode',
                        type: 'boolean',
                        default: 'false'
                    }
                };

                const secrets: Record<string, GitHubWorkflowSecrets> = {
                    'DEPLOY_TOKEN': {
                        description: 'Token for deployment',
                        required: true
                    },
                    'API_KEY': {
                        description: 'Optional API key'
                    }
                };

                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/deploy.yml',
                    name: 'Deploy Workflow',
                    on: {
                        push: { branches: ['main'] },
                        workflow_dispatch: {
                            inputs,
                            secrets
                        }
                    },
                    permissions: {
                        contents: 'read',
                        deployments: 'write'
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

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
      # Options:
      # - \`development\`
      # - \`staging\`
      # - \`production\`
      environment: development

      # Version to deploy
      # Default: \`latest\`
      version: latest

      # Enable debug mode
      # Default: \`false\`
      debug: false

\`\`\``
                );
            });

            it('should generate usage section for workflow with only push trigger', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/ci.yml',
                    name: 'CI Workflow',
                    on: {
                        push: { branches: ['main', 'develop'] },
                        pull_request: { branches: ['main'] },
                        workflow_dispatch: {}
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

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

\`\`\``
                );
            });

            it('should generate usage section for workflow with complex on triggers', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/release.yml',
                    name: 'Release Workflow',
                    on: {
                        release: { types: ['published'] },
                        schedule: [{ cron: '0 0 * * 0' }],
                        workflow_dispatch: {}
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

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

\`\`\``
                );
            });

            it('should handle workflow with no on triggers gracefully', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test.yml',
                    name: 'Test Workflow',
                    on: {
                        workflow_dispatch: {}
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

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

\`\`\``
                );
            });
        });
    });

});
