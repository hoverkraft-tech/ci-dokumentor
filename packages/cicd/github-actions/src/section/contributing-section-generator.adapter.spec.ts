import { describe, it, expect, beforeEach } from 'vitest';
import { ContributingSectionGenerator } from './contributing-section-generator.adapter.js';
import { FormatterAdapter, MarkdownFormatterAdapter, Repository, SectionIdentifier } from '@ci-dokumentor/core';
import { GitHubAction } from '../github-actions-parser.js';
import { initTestContainer } from '@ci-dokumentor/repository-github';

describe('ContributingSectionGenerator', () => {
    let formatterAdapter: FormatterAdapter;
    let generator: ContributingSectionGenerator;
    let mockRepository: Repository;

    beforeEach(() => {
        const container = initTestContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new ContributingSectionGenerator();

        // Create base mock repository
        mockRepository = {
            url: 'https://github.com/owner/repo',
            owner: 'owner',
            name: 'repo',
            fullName: 'owner/repo',
        } as Repository;
    });

    describe('getSectionIdentifier', () => {
        it('should return Contributing section identifier', () => {
            // Act
            const result = generator.getSectionIdentifier();

            // Assert
            expect(result).toBe(SectionIdentifier.Contributing);
        });
    });

    describe('generateSection', () => {
        const mockManifest: GitHubAction = {
            usesName: 'owner/repo',
            name: 'Test Action',
            description: 'A test action',
            runs: { using: 'node20' },
        };

        it('should generate contributing section when repository has contributing information', () => {
            // Arrange
            const repositoryWithContributing = {
                ...mockRepository,
                contributing: {
                    url: 'https://github.com/owner/repo/blob/main/CONTRIBUTING.md',
                },
            };

            // Act
            const result = generator.generateSection(
                formatterAdapter,
                mockManifest,
                repositoryWithContributing
            );

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual(
                'Contributions are welcome! Please see the [contributing guidelines](https://github.com/owner/repo/blob/main/CONTRIBUTING.md) for more details.\n'
            );
        });

        it('should return empty buffer when repository has no contributing information', () => {
            // Act
            const result = generator.generateSection(
                formatterAdapter,
                mockManifest,
                mockRepository
            );

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual('');
        });

        it('should return empty buffer when repository contributing object exists but has no url', () => {
            // Arrange
            const repositoryWithEmptyContributing = {
                ...mockRepository,
                contributing: {} as { url: string },
            };

            // Act
            const result = generator.generateSection(
                formatterAdapter,
                mockManifest,
                repositoryWithEmptyContributing
            );

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual('');
        });

        it('should return empty buffer when repository contributing url is empty string', () => {
            // Arrange
            const repositoryWithEmptyUrl = {
                ...mockRepository,
                contributing: {
                    url: '',
                },
            };

            // Act
            const result = generator.generateSection(
                formatterAdapter,
                mockManifest,
                repositoryWithEmptyUrl
            );

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual('');
        });

        it('should handle different contributing URL formats correctly', () => {
            // Arrange
            const testCases = [
                {
                    name: 'GitHub blob URL',
                    url: 'https://github.com/owner/repo/blob/main/CONTRIBUTING.md',
                },
                {
                    name: 'GitHub raw URL',
                    url: 'https://raw.githubusercontent.com/owner/repo/main/CONTRIBUTING.md',
                },
                {
                    name: 'GitLab URL',
                    url: 'https://gitlab.com/owner/repo/-/blob/main/CONTRIBUTING.md',
                },
                {
                    name: 'Relative documentation URL',
                    url: '/docs/contributing',
                },
                {
                    name: 'External documentation URL',
                    url: 'https://docs.example.com/contributing',
                },
            ];

            testCases.forEach(({ url }) => {
                // Arrange
                const repositoryWithUrl = {
                    ...mockRepository,
                    contributing: { url },
                };

                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    mockManifest,
                    repositoryWithUrl
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(
                    `Contributions are welcome! Please see the [contributing guidelines](${url}) for more details.\n`
                );
            });
        });

        it('should properly escape special characters in contributing URL', () => {
            // Arrange
            const repositoryWithSpecialChars = {
                ...mockRepository,
                contributing: {
                    url: 'https://github.com/owner/repo-with-special-chars/blob/main/CONTRIBUTING.md?tab=readme-ov-file#contributing',
                },
            };

            // Act
            const result = generator.generateSection(
                formatterAdapter,
                mockManifest,
                repositoryWithSpecialChars
            );

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual(
                'Contributions are welcome! Please see the [contributing guidelines](https://github.com/owner/repo-with-special-chars/blob/main/CONTRIBUTING.md?tab=readme-ov-file#contributing) for more details.\n'
            );
        });

        it('should generate consistent output regardless of manifest content', () => {
            // Arrange
            const repositoryWithContributing = {
                ...mockRepository,
                contributing: {
                    url: 'https://github.com/owner/repo/blob/main/CONTRIBUTING.md',
                },
            };

            const differentManifests = [
                {
                    usesName: 'different/action',
                    name: 'Different Action',
                    description: 'A different action',
                    runs: { using: 'node18' },
                },
                {
                    usesName: 'another/action',
                    name: 'Another Action',
                    description: 'Another action with different properties',
                    runs: { using: 'composite' },
                    inputs: { input1: { description: 'Test input' } },
                },
            ];

            const expectedOutput = 'Contributions are welcome! Please see the [contributing guidelines](https://github.com/owner/repo/blob/main/CONTRIBUTING.md) for more details.\n';

            differentManifests.forEach((manifest) => {
                // Act
                const result = generator.generateSection(
                    formatterAdapter,
                    manifest as GitHubAction,
                    repositoryWithContributing
                );

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toEqual(expectedOutput);
            });
        });
    });
});
