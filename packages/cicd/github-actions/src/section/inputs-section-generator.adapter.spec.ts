import { describe, it, expect, beforeEach } from 'vitest';
import { InputsSectionGenerator } from './inputs-section-generator.adapter.js';
import { GitHubAction, GitHubWorkflow, GitHubActionInput, GitHubWorkflowInput } from '../github-actions-parser.js';
import { FormatterAdapter, SectionIdentifier, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import { Repository } from "@ci-dokumentor/core";
import { initContainer } from '../container.js';

describe('InputsSectionGenerator', () => {
    let formatterAdapter: FormatterAdapter;
    let generator: InputsSectionGenerator;
    let mockRepository: Repository;

    beforeEach(() => {
        // Use real formatter to facilitate testing
        const container = initContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new InputsSectionGenerator();

        // Create mock repository
        mockRepository = {
            url: 'https://github.com/owner/repo',
            owner: 'owner',
            name: 'repo',
            fullName: 'owner/repo'
        };
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
        describe('with GitHub Action manifest', () => {
            it('should generate inputs section for GitHub Action with inputs', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    inputs: {
                        'input-name': {
                            description: 'Test input description',
                            required: true,
                            default: 'default-value'
                        },
                        'optional-input': {
                            description: 'Optional input description',
                            required: false
                        }
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Inputs
| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |
| **\`input-name\`** | Test input description | **true** | \`default-value\` |
| **\`optional-input\`** | Optional input description | **false** | \`\` |`
                );
            });

            it('should generate inputs section for GitHub Action without inputs', () => {
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
                    `## Inputs
| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |`
                );
            });

            it('should generate inputs section for GitHub Action with empty inputs object', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    inputs: {}
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Inputs
| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |`
                );
            });

            it('should handle inputs with missing optional properties', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    inputs: {
                        'minimal-input': {} as GitHubActionInput
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Inputs
| **Input** | **Description** | **Required** | **Default** |
| --- | --- | --- | --- |
| **\`minimal-input\`** |  | **false** | \`\` |`
                );
            });
        });

        describe('with GitHub Workflow manifest', () => {
            it('should generate inputs section for GitHub Workflow with workflow_dispatch inputs', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test.yml',
                    name: 'Test Workflow',
                    on: {
                        workflow_dispatch: {
                            inputs: {
                                'environment': {
                                    description: 'Environment to deploy to',
                                    required: true,
                                    type: 'choice',
                                    default: 'staging',
                                    options: ['staging', 'production']
                                },
                                'version': {
                                    description: 'Version to deploy',
                                    required: false,
                                    type: 'string'
                                }
                            }
                        }
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Inputs
| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |
| **\`environment\`** | Environment to deploy to | **true** | **choice** | \`staging\` |
|  | Options: \`staging\`, \`production\` |  |  |  |
| **\`version\`** | Version to deploy | **false** | **string** | \`\` |`
                );
            });

            it('should generate inputs section for GitHub Workflow without workflow_dispatch', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test.yml',
                    name: 'Test Workflow',
                    on: {
                        push: {}
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Inputs
| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |`
                );
            });

            it('should generate inputs section for GitHub Workflow with workflow_dispatch but no inputs', () => {
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
                    `## Inputs
| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |`
                );
            });

            it('should handle workflow inputs with missing optional properties', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test.yml',
                    name: 'Test Workflow',
                    on: {
                        workflow_dispatch: {
                            inputs: {
                                'minimal-input': {
                                    description: 'Minimal input',
                                    type: 'string'
                                } as GitHubWorkflowInput
                            }
                        }
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Inputs
| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |
| **\`minimal-input\`** | Minimal input | **false** | **string** | \`\` |`
                );
            });

            it('should handle workflow inputs with options but no description', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test.yml',
                    name: 'Test Workflow',
                    on: {
                        workflow_dispatch: {
                            inputs: {
                                'choice-input': {
                                    description: '',
                                    type: 'choice',
                                    options: ['option1', 'option2', 'option3']
                                }
                            }
                        }
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Inputs
| **Input** | **Description** | **Required** | **Type** | **Default** |
| --- | --- | --- | --- | --- |
| **\`choice-input\`** |  | **false** | **choice** | \`\` |
|  | Options: \`option1\`, \`option2\`, \`option3\` |  |  |  |`
                );
            });
        });

        describe('error handling', () => {
            it('should throw error for unsupported manifest type', () => {
                // Arrange
                const invalidManifest = {
                    unsupportedType: true
                } as unknown as GitHubAction | GitHubWorkflow;

                // Act & Assert
                expect(() => {
                    generator.generateSection(formatterAdapter, invalidManifest, mockRepository);
                }).toThrow('Unsupported manifest type for InputsSectionGenerator');
            });
        });
    });
});
