import { describe, it, expect, beforeEach } from 'vitest';
import { OutputsSectionGenerator } from './outputs-section-generator.adapter.js';
import { GitHubAction, GitHubWorkflow, GitHubActionOutput } from '../github-actions-parser.js';
import { FormatterAdapter, SectionIdentifier, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import { Repository } from "@ci-dokumentor/core";
import { initContainer } from '../container.js';

describe('OutputsSectionGenerator', () => {
    let formatterAdapter: FormatterAdapter;
    let generator: OutputsSectionGenerator;
    let mockRepository: Repository;

    beforeEach(() => {
        // Use real formatter to facilitate testing
        const container = initContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new OutputsSectionGenerator();

        // Create mock repository
        mockRepository = {
            url: 'https://github.com/owner/repo',
            owner: 'owner',
            name: 'repo',
            fullName: 'owner/repo'
        };
    });

    describe('getSectionIdentifier', () => {
        it('should return Outputs section identifier', () => {
            // Act
            const result = generator.getSectionIdentifier();

            // Assert
            expect(result).toBe(SectionIdentifier.Outputs);
        });
    });

    describe('generateSection', () => {
        describe('with GitHub Action manifest', () => {
            it('should generate outputs section for GitHub Action with outputs', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    outputs: {
                        'output-name': {
                            description: 'Test output description',
                            value: '${{ steps.test.outputs.result }}'
                        },
                        'another-output': {
                            description: 'Another output description',
                            value: 'static-value'
                        }
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Outputs
| **Output** | **Description** |
| --- | --- |
| **\`output-name\`** | Test output description |
| **\`another-output\`** | Another output description |`
                );
            });

            it('should generate outputs section for GitHub Action without outputs', () => {
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
                    `## Outputs
| **Output** | **Description** |
| --- | --- |`
                );
            });

            it('should generate outputs section for GitHub Action with empty outputs object', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    outputs: {}
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Outputs
| **Output** | **Description** |
| --- | --- |`
                );
            });

            it('should handle outputs with missing optional properties', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    outputs: {
                        'minimal-output': {} as GitHubActionOutput
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Outputs
| **Output** | **Description** |
| --- | --- |
| **\`minimal-output\`** |  |`
                );
            });

            it('should handle outputs with only description', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    outputs: {
                        'description-only': {
                            description: 'Output with description only'
                        }
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Outputs
| **Output** | **Description** |
| --- | --- |
| **\`description-only\`** | Output with description only |`
                );
            });

            it('should handle outputs with no description', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    outputs: {
                        'no-description': {
                            value: '${{ steps.build.outputs.version }}'
                        }
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Outputs
| **Output** | **Description** |
| --- | --- |
| **\`no-description\`** |  |`
                );
            });
        });

        describe('with GitHub Workflow manifest', () => {
            it('should generate empty outputs section for GitHub Workflow', () => {
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
                    `## Outputs
| **Output** | **Description** |
| --- | --- |`
                );
            });

            it('should generate empty outputs section for GitHub Workflow with push trigger', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/ci.yml',
                    name: 'CI Workflow',
                    on: {
                        push: {}
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `## Outputs
| **Output** | **Description** |
| --- | --- |`
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
                }).toThrow('Unsupported manifest type for OutputsSectionGenerator');
            });
        });
    });
});
