import { describe, it, expect, beforeEach } from 'vitest';
import { OverviewSectionGenerator } from './overview-section-generator.adapter.js';
import { FormatterAdapter, MarkdownFormatterAdapter, Repository, SectionIdentifier } from '@ci-dokumentor/core';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../test-utils/github-action-mock.factory.js';
import { initTestContainer } from '@ci-dokumentor/repository-github';
import { GitHubWorkflowMockFactory } from '../test-utils/github-workflow-mock.factory.js';

describe('OverviewSectionGenerator', () => {
    let formatterAdapter: FormatterAdapter;
    let generator: OverviewSectionGenerator;
    let mockRepository: Repository;

    beforeEach(() => {
        const container = initTestContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new OverviewSectionGenerator();

        // Create base mock repository
        mockRepository = {
            url: 'https://github.com/owner/repo',
            owner: 'owner',
            name: 'repo',
            fullName: 'owner/repo',
        } as Repository;
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
            it('should generate overview section for GitHub Action with description', () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: 'A comprehensive test action for CI/CD workflows',
                });

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

A comprehensive test action for CI/CD workflows
`
                );
            });

            it('should return empty buffer for GitHub Action without description', () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: undefined as any,
                });

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it('should return empty buffer for GitHub Action with empty description', () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: '',
                });

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it('should handle multiline descriptions correctly', () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: 'A test action with\nmultiple lines\nof description',
                });

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

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

            it('should handle descriptions with special characters', () => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({
                    description: 'A test action with **bold**, *italic*, and `code` formatting',
                });

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

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
            it('should generate overview section for GitHub Workflow with description only', () => {
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
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Continuous integration workflow for the project

### Permissions

`
                );
            });

            it('should generate overview section for GitHub Workflow with description and permissions', () => {
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
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

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

            it('should handle GitHub Workflow with empty permissions object', () => {
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
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Workflow with empty permissions

### Permissions

`
                );
            });

            it('should handle GitHub Workflow without permissions', () => {
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
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `## Overview

Workflow without permissions

### Permissions

`
                );
            });

            it('should return empty buffer for GitHub Workflow without description', () => {
                // Arrange
                const manifest: GitHubWorkflow = GitHubWorkflowMockFactory.create({
                    on: { push: { branches: ['main'] } },
                    permissions: { contents: 'read' },
                });

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it('should handle GitHub Workflow with complex permissions structure', () => {
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
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

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
            it('should handle null manifest gracefully', () => {
                // Act & Assert
                expect(() => {
                    generator.generateSection(
                        formatterAdapter,
                        null as any,
                        mockRepository
                    );
                }).toThrow();
            });

            it('should handle undefined manifest gracefully', () => {
                // Act & Assert
                expect(() => {
                    generator.generateSection(
                        formatterAdapter,
                        undefined as any,
                        mockRepository
                    );
                }).toThrow();
            });

            it('should handle manifest without description property', () => {
                // Arrange
                const manifest = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    runs: { using: 'node20' },
                } as GitHubAction;

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest,
                    mockRepository
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual('');
            });

            it('should generate section independent of repository content', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'Test description',
                    runs: { using: 'node20' },
                };

                const differentRepositories = [
                    mockRepository,
                    { ...mockRepository, name: 'different-repo' },
                    { ...mockRepository, owner: 'different-owner' },
                    null as any,
                    undefined as any,
                ];

                const expectedOutput = `## Overview

Test description
`;

                differentRepositories.forEach((repo, index) => {
                    // Act
                    const result = generator.generateSection(
                        formatterAdapter,
                        manifest,
                        repo
                    );

                    // Assert
                    expect(result).toBeInstanceOf(Buffer);
                    expect(result.toString()).toEqual(expectedOutput);
                });
            });
        });
    });
});
