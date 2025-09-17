import { describe, it, expect, beforeEach, Mocked } from 'vitest';
import { ContributingSectionGenerator } from './contributing-section-generator.adapter.js';
import { FormatterAdapter, MarkdownFormatterAdapter, RepositoryProvider, SectionIdentifier } from '@ci-dokumentor/core';
import { GitHubAction } from '../github-actions-parser.js';
import { initTestContainer } from '@ci-dokumentor/repository-github';
import { RepositoryInfoMockFactory, RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('ContributingSectionGenerator', () => {
    let formatterAdapter: FormatterAdapter;
    let generator: ContributingSectionGenerator;
    let mockRepositoryProvider: Mocked<RepositoryProvider>;

    beforeEach(() => {
        mockRepositoryProvider = RepositoryProviderMockFactory.create({
            getRepositoryInfo: RepositoryInfoMockFactory.create(),
        });

        const container = initTestContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new ContributingSectionGenerator();
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

        it('should generate contributing section when repository has contributing information', async () => {
            // Arrange
            mockRepositoryProvider.getContributing.mockResolvedValue({
                url: 'https://github.com/owner/repo/blob/main/CONTRIBUTING.md',
            });

            // Act
            const result = await generator.generateSection({ formatterAdapter, manifest: mockManifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual(`## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/owner/repo/blob/main/CONTRIBUTING.md) for more details.
`);
        });

        it('should return empty buffer when repository has no contributing information', async () => {
            // Act
            const result = await generator.generateSection({ formatterAdapter, manifest: mockManifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual('');
        });

        it('should return empty buffer when repository contributing object exists but has no url', async () => {
            // Arrange
            mockRepositoryProvider.getContributing.mockResolvedValue({} as { url: string });

            // Act
            const result = await generator.generateSection({ formatterAdapter, manifest: mockManifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual('');
        });

        it('should return empty buffer when repository contributing url is empty string', async () => {
            // Arrange
            mockRepositoryProvider.getContributing.mockResolvedValue({ url: '' });

            // Act
            const result = await generator.generateSection({ formatterAdapter, manifest: mockManifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual('');
        });

        it.each([
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
        ])('should handle different contributing URL formats correctly: $name', async ({ url }) => {
            // Arrange
            mockRepositoryProvider.getContributing.mockResolvedValue({ url });

            // Act
            const result = await generator.generateSection({ formatterAdapter, manifest: mockManifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual(`## Contributing

Contributions are welcome! Please see the [contributing guidelines](${url}) for more details.
`);
        });

        it('should properly escape special characters in contributing URL', async () => {
            // Arrange
            mockRepositoryProvider.getContributing.mockResolvedValue({
                url: 'https://github.com/owner/repo-with-special-chars/blob/main/CONTRIBUTING.md?tab=readme-ov-file#contributing'
            });

            // Act
            const result = await generator.generateSection({ formatterAdapter, manifest: mockManifest, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual(`## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/owner/repo-with-special-chars/blob/main/CONTRIBUTING.md?tab=readme-ov-file#contributing) for more details.
`);
        });

        it.each([
            {
                manifest: {
                    usesName: 'different/action',
                    name: 'Different Action',
                    description: 'A different action',
                    runs: { using: 'node18' },
                },
            },
            {
                manifest: {
                    usesName: 'another/action',
                    name: 'Another Action',
                    description: 'Another action with different properties',
                    runs: { using: 'composite' },
                    inputs: { input1: { description: 'Test input' } },
                }
            },
        ])('should generate consistent output regardless of manifest content', async ({
            manifest
        }) => {
            // Arrange
            mockRepositoryProvider.getContributing.mockResolvedValue({
                url: 'https://github.com/owner/repo/blob/main/CONTRIBUTING.md',
            });


            const expectedOutput = `## Contributing

Contributions are welcome! Please see the [contributing guidelines](https://github.com/owner/repo/blob/main/CONTRIBUTING.md) for more details.
`;

            // Act
            const result = await generator.generateSection({ formatterAdapter, manifest: manifest as GitHubAction, repositoryProvider: mockRepositoryProvider , destination: 'README.md' });

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toEqual(expectedOutput);
        });
    });
});
