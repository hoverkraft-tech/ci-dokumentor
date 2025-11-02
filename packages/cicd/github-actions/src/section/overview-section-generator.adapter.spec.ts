import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { FormatterAdapter, MarkdownFormatterAdapter, RepositoryProvider, SectionIdentifier } from '@ci-dokumentor/core';
import { initTestContainer } from '@ci-dokumentor/repository-github';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';
import { GitHubAction, GitHubActionsManifest, GitHubWorkflow } from '../github-actions-parser.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { OverviewSectionGenerator } from './overview-section-generator.adapter.js';

describe('OverviewSectionGenerator', () => {
    let mockRepositoryProvider: Mocked<RepositoryProvider>;
    let formatterAdapter: FormatterAdapter;

    let generator: OverviewSectionGenerator;

    beforeEach(() => {
        vi.resetAllMocks();

        mockRepositoryProvider = RepositoryProviderMockFactory.create({
            getRepositoryInfo: RepositoryInfoMockFactory.create(),
        });

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
        describe('with GitHub Action manifest', () => {
            it.each([
                {
                    name: 'with description',
                    description: 'A comprehensive test action for CI/CD workflows',
                    expected: `## Overview

A comprehensive test action for CI/CD workflows
`,
                },
                {
                    name: 'without description (undefined)',
                    description: undefined,
                    expected: '',
                },
                {
                    name: 'with empty description',
                    description: '',
                    expected: '',
                },
                {
                    name: 'with multiline description',
                    description: 'A test action with\nmultiple lines\n\nof description',
                    expected: `## Overview

A test action with
multiple lines

of description
`,
                },
                {
                    name: 'with code block in description',
                    description: `A test action with code block:

\`\`\`yaml
test:
  key: value
  list:
    - item1
    - item2
\`\`\``,
                    expected: `## Overview

A test action with code block:

\`\`\`yaml
test:
  key: value
  list:
    - item1
    - item2
\`\`\`
`,
                },
                {
                    name: 'with special characters',
                    description: 'A test action with **bold**, *italic*, and `code` formatting',
                    expected: `## Overview

A test action with **bold**, *italic*, and \`code\` formatting
`,
                },
                {
                    name: 'with description and comments combined',
                    description: 'Short description from manifest\n\nThis is extended description from comments.\nIt provides more details about the action.',
                    expected: `## Overview

Short description from manifest

This is extended description from comments.
It provides more details about the action.
`,
                },
            ])('$name', async ({ description, expected }) => {
                // Arrange
                const manifest: GitHubAction = GitHubActionMockFactory.create({ description });

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert
                expect(result.toString()).toEqual(expected);
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
                    description: 'Continuous integration workflow for the project\n\nWorkflow runs on push to main branch.',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert

                expect(result.toString()).toEqual(
                    `## Overview

Continuous integration workflow for the project

Workflow runs on push to main branch.
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
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert

                expect(result.toString()).toEqual(
                    `## Overview

Continuous integration workflow with permissions

### Permissions

- **\`contents\`**: \`read\`
- **\`id-token\`**: \`write\`
- **\`pull-requests\`**: \`write\`
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
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert

                expect(result.toString()).toEqual(
                    `## Overview

Workflow with empty permissions
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
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert

                expect(result.toString()).toEqual(
                    `## Overview

Workflow without permissions
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
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert

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
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert

                expect(result.toString()).toEqual(
                    `## Overview

Automated release workflow

### Permissions

- **\`actions\`**: \`read\`
- **\`checks\`**: \`read\`
- **\`contents\`**: \`write\`
- **\`deployments\`**: \`write\`
- **\`id-token\`**: \`write\`
- **\`packages\`**: \`write\`
- **\`pull-requests\`**: \`read\`
- **\`security-events\`**: \`write\`
`
                );
            });

            it('should merge permissions from workflow-level and job-level', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        permissions: {
                            contents: 'read',
                            'pull-requests': 'write',
                        },
                        jobs: {
                            job1: {
                                'runs-on': 'ubuntu-latest',
                                permissions: {
                                    'id-token': 'write',
                                    packages: 'write',
                                },
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                            job2: {
                                'runs-on': 'ubuntu-latest',
                                permissions: {
                                    actions: 'read',
                                },
                                steps: [{ run: 'echo "test"' }],
                            },
                        },
                    }),
                    description: 'Workflow with merged permissions',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert
                expect(result.toString()).toEqual(
                    `## Overview

Workflow with merged permissions

### Permissions

- **\`actions\`**: \`read\`
- **\`contents\`**: \`read\`
- **\`id-token\`**: \`write\`
- **\`packages\`**: \`write\`
- **\`pull-requests\`**: \`write\`
`
                );
            });

            it('should override workflow-level permissions with job-level permissions', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        permissions: {
                            contents: 'read',
                            packages: 'read',
                        },
                        jobs: {
                            job1: {
                                'runs-on': 'ubuntu-latest',
                                permissions: {
                                    contents: 'write', // Override read to write
                                    'id-token': 'write',
                                },
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                        },
                    }),
                    description: 'Workflow with overridden permissions',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert
                expect(result.toString()).toEqual(
                    `## Overview

Workflow with overridden permissions

### Permissions

- **\`contents\`**: \`write\`
- **\`id-token\`**: \`write\`
- **\`packages\`**: \`read\`
`
                );
            });

            it('should handle workflow with only job-level permissions', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        jobs: {
                            job1: {
                                'runs-on': 'ubuntu-latest',
                                permissions: {
                                    contents: 'write',
                                    'id-token': 'write',
                                },
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                            job2: {
                                'runs-on': 'ubuntu-latest',
                                permissions: {
                                    packages: 'write',
                                },
                                steps: [{ run: 'echo "test"' }],
                            },
                        },
                    }),
                    description: 'Workflow with only job-level permissions',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert
                expect(result.toString()).toEqual(
                    `## Overview

Workflow with only job-level permissions

### Permissions

- **\`contents\`**: \`write\`
- **\`id-token\`**: \`write\`
- **\`packages\`**: \`write\`
`
                );
            });

            it('should handle workflow with some jobs having permissions and some not', async () => {
                // Arrange
                const manifest = {
                    ...GitHubWorkflowMockFactory.create({
                        on: { push: { branches: ['main'] } },
                        permissions: {
                            contents: 'read',
                        },
                        jobs: {
                            job1: {
                                'runs-on': 'ubuntu-latest',
                                permissions: {
                                    'id-token': 'write',
                                },
                                steps: [{ name: 'Checkout', uses: 'actions/checkout@v4' }],
                            },
                            job2: {
                                'runs-on': 'ubuntu-latest',
                                steps: [{ run: 'echo "test"' }], // No permissions
                            },
                        },
                    }),
                    description: 'Workflow with mixed job permissions',
                } as GitHubWorkflow & { description: string };

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert
                expect(result.toString()).toEqual(
                    `## Overview

Workflow with mixed job permissions

### Permissions

- **\`contents\`**: \`read\`
- **\`id-token\`**: \`write\`
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
                    , destination: 'README.md'
                })).rejects.toThrow("Cannot use 'in' operator to search for 'description' in undefined");

            });

            it('should handle manifest without description property', async () => {
                // Arrange
                const manifest = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    runs: { using: 'node20' },
                } as GitHubAction;

                // Act
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert

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
                const result = await generator.generateSection({ formatterAdapter, manifest, repositoryProvider: mockRepositoryProvider, destination: 'README.md' });

                // Assert
                const expectedOutput = `## Overview

Test description
`;

                expect(result.toString()).toEqual(expectedOutput);
            });
        });
    });
});
