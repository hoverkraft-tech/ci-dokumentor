import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { OverviewSectionGenerator } from './overview-section-generator.adapter.js';
import { FormatterAdapter, MarkdownFormatterAdapter, RepositoryProvider, SectionIdentifier } from '@ci-dokumentor/core';
import { GitHubAction, GitHubActionsManifest, GitHubWorkflow } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { initTestContainer } from '@ci-dokumentor/repository-github';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('OverviewSectionGenerator', () => {
    let mockRepositoryProvider: Mocked<RepositoryProvider>;
    let formatterAdapter: FormatterAdapter;

    let generator: OverviewSectionGenerator;

    beforeEach(() => {
        mockRepositoryProvider = RepositoryProviderMockFactory.create({
            getRepositoryInfo: RepositoryInfoMockFactory.create(),
        });

        const container = initTestContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new OverviewSectionGenerator();
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
        describe('with GitHub Action manifest', () => {
            it('should generate overview section for GitHub Action with description', async () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: 'A comprehensive test action for CI/CD workflows',
                });

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

A comprehensive test action for CI/CD workflows
`
                );
            });

            it('should return empty buffer for GitHub Action without description', async () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: undefined,
                });

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it('should return empty buffer for GitHub Action with empty description', async () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: '',
                });

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it('should handle multiline descriptions correctly', async () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: 'A test action with\nmultiple lines\nof description',
                });

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

A test action with
multiple lines
of description
`
                );
            });

            it('should handle descriptions with special characters', async () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: 'A test action with **bold**, *italic*, and `code` formatting',
                });

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

A test action with **bold**, *italic*, and \`code\` formatting
`
                );
            });
        });

        describe('with GitHub Workflow manifest', () => {
            it('should generate overview section for GitHub Workflow with description only', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        jobs: {
                            test: {
                                'runs-on': 'ubuntu-latest',
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                        },
                    }),
                    description: 'Continuous integration workflow for the project',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Continuous integration workflow for the project

### Permissions

`
                );
            });

            it('should generate overview section for GitHub Workflow with description and permissions', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        permissions: {
                            contents: 'read',
                            'pull-requests': 'write',
                            'id-token': 'write',
                        },
                        jobs: {
                            test: {
                                'runs-on': 'ubuntu-latest',
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                        },
                    }),
                    description: 'Continuous integration workflow with permissions',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Continuous integration workflow with permissions

### Permissions

- **contents**: read
- **pull-requests**: write
- **id-token**: write
`
                );
            });

            it('should handle GitHub Workflow with empty permissions object', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        permissions: {},
                        jobs: {
                            test: {
                                'runs-on': 'ubuntu-latest',
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                        },
                    }),
                    description: 'Workflow with empty permissions',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Workflow with empty permissions

### Permissions

`
                );
            });

            it('should handle GitHub Workflow without permissions', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        jobs: {
                            test: {
                                'runs-on': 'ubuntu-latest',
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                        },
                    }),
                    description: 'Workflow without permissions',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Workflow without permissions

### Permissions

`
                );
            });

            it('should return empty buffer for GitHub Workflow without description', async () => {
                // Arrange
                const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
                    on: { push: { branches: ['main'] } },
                    permissions: { contents: 'read' },
                });

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it('should handle GitHub Workflow with complex permissions structure', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        usesName: 'owner/repo/.github/workflows/release.yml',
                        name: 'Release Workflow',
                        on: { push: { tags: ['v*'] }, workflow_dispatch: {} },
                        permissions: {
                            contents: 'write',
                            packages: 'write',
                            'pull-requests': 'read',
                            'id-token': 'write',
                            'security-events': 'write',
                            actions: 'read',
                            checks: 'read',
                            deployments: 'write',
                        },
                        jobs: {
                            release: {
                                'runs-on': 'ubuntu-latest',
                                steps: [
                                    { name: 'Checkout', uses: 'actions/checkout@v4' },
                                    { name: 'Build', run: 'npm run build' },
                                ],
                            },
                        },
                    }),
                    description: 'Automated release workflow',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Automated release workflow

### Permissions

- **contents**: write
- **packages**: write
- **pull-requests**: read
- **id-token**: write
- **security-events**: write
- **actions**: read
- **checks**: read
- **deployments**: write
`
                );
            });
        });

        describe('edge cases', () => {
            it('should handle undefined manifest gracefully', async () => {
                // Act & Assert
                await expect(generator.generateSection({
                    formatterAdapter,
                    manifest: undefined as unknown as GitHubActionsManifest,
                    repositoryProvider: mockRepositoryProvider
                , destination: 'README.md' })).rejects.toThrow("Cannot use 'in' operator to search for 'description' in undefined");

            });

            it('should handle manifest without description property', async () => {
                // Arrange
                const manifest = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    runs: { using: 'node20' },
                } as GitHubAction;

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it.each([
                {
                    name: 'standard full info',
                    repositoryInfo: RepositoryInfoMockFactory.create(),
                },
                {
                    name: 'different repository name',
                    repositoryInfo: RepositoryInfoMockFactory.create({
                        name: 'different-repo',
                    }),
                },
                {
                    name: 'different repository owner',
                    repositoryInfo: RepositoryInfoMockFactory.create({
                        owner: 'different-owner',
                    }),
                },
            ])('should generate section independent of repository with $name', async ({ repositoryInfo }) => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'Test description',
                    runs: { using: 'node20' },
                };

                mockRepositoryProvider.getRepositoryInfo.mockResolvedValue(repositoryInfo);


                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

                // Assert
                const expectedOutput = `## Overview

Test description
`;
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(expectedOutput);
            });
        });
    });
});
