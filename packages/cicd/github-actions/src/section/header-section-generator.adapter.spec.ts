import { describe, it, expect, beforeEach } from 'vitest';
import { HeaderSectionGenerator } from './header-section-generator.adapter.js';
import { GitHubAction, GitHubWorkflow } from '../github-actions-parser.js';
import { FormatterAdapter, SectionIdentifier, MarkdownFormatterAdapter } from '@ci-dokumentor/core';
import { Repository } from '../repository/github-repository.service.js';
import { initContainer } from '../container.js';

describe('HeaderSectionGenerator', () => {
    let formatterAdapter: FormatterAdapter;
    let generator: HeaderSectionGenerator;
    let mockRepository: Repository;

    beforeEach(() => {
        // Use real formatter to facilitate testing
        const container = initContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new HeaderSectionGenerator();

        // Create mock repository
        mockRepository = {
            url: 'https://github.com/owner/repo',
            owner: 'owner',
            name: 'repo',
            fullName: 'owner/repo'
        };
    });

    describe('getSectionIdentifier', () => {
        it('should return Header section identifier', () => {
            // Act
            const result = generator.getSectionIdentifier();

            // Assert
            expect(result).toBe(SectionIdentifier.Header);
        });
    });

    describe('generateSection', () => {
        describe('with GitHub Action manifest', () => {
            it('should generate header section for GitHub Action without logo', () => {
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
                    `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# GitHub Action: Test Action

</div>`
                );
            });

            it('should generate header section for GitHub Action with logo', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' }
                };
                const repositoryWithLogo: Repository = {
                    ...mockRepository,
                    logo: 'https://example.com/logo.png'
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, repositoryWithLogo);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

<img src="https://example.com/logo.png" width="60px" align="center" alt="Test Action" />
# GitHub Action: Test Action

</div>`
                );
            });

            it('should generate header section for GitHub Action with branding icon', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    branding: {
                        icon: 'activity',
                        color: 'blue'
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYWN0aXZpdHkiIGNvbG9yPSJibHVlIj48cG9seWxpbmUgcG9pbnRzPSIyMiAxMiAxOCAxMiAxNSAyMSA5IDMgNiAxMiAyIDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==) GitHub Action: Test Action

</div>`
                );
            });

            it('should generate header section for GitHub Action with branding icon and default color', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    branding: {
                        icon: 'activity'
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYWN0aXZpdHkiIGNvbG9yPSJncmF5LWRhcmsiPjxwb2x5bGluZSBwb2ludHM9IjIyIDEyIDE4IDEyIDE1IDIxIDkgMyA2IDEyIDIgMTIiPjwvcG9seWxpbmU+PC9zdmc+) GitHub Action: Test Action

</div>`);
            });

            it('should generate header section for GitHub Action with invalid branding icon', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    branding: {
                        icon: 'nonexistent-icon',
                        color: 'blue'
                    }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# GitHub Action: Test Action

</div>`
                );
            });

            it('should generate header section for GitHub Action with logo and branding icon', () => {
                // Arrange
                const manifest: GitHubAction = {
                    usesName: 'owner/repo',
                    name: 'Test Action',
                    description: 'A test action',
                    runs: { using: 'node20' },
                    branding: {
                        icon: 'activity',
                        color: 'blue'
                    }
                };
                const repositoryWithLogo: Repository = {
                    ...mockRepository,
                    logo: 'https://example.com/logo.png'
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, repositoryWithLogo);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(
                    `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

<img src="https://example.com/logo.png" width="60px" align="center" alt="Test Action" />
# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItYWN0aXZpdHkiIGNvbG9yPSJibHVlIj48cG9seWxpbmUgcG9pbnRzPSIyMiAxMiAxOCAxMiAxNSAyMSA5IDMgNiAxMiAyIDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==) GitHub Action: Test Action

</div>`
                );
            });
        });

        describe('with GitHub Workflow manifest', () => {
            it('should generate header section for GitHub Workflow without logo', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test-workflow.yml',
                    name: 'Test Workflow',
                    on: { push: {} }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(`<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# GitHub Workflow: Test Workflow

</div>`);
            });

            it('should generate header section for GitHub Workflow with logo', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test-workflow.yml',
                    name: 'Test Workflow',
                    on: { push: {} }
                };
                const repositoryWithLogo: Repository = {
                    ...mockRepository,
                    logo: 'https://example.com/logo.png'
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, repositoryWithLogo);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(`<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

<img src="https://example.com/logo.png" width="60px" align="center" alt="Test Workflow" />
# GitHub Workflow: Test Workflow

</div>`);
            });

            it('should not generate branding icon for GitHub Workflow', () => {
                // Arrange
                const manifest: GitHubWorkflow = {
                    usesName: 'owner/repo/.github/workflows/test-workflow.yml',
                    name: 'Test Workflow',
                    on: { push: {} }
                };

                // Act
                const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

                // Assert
                expect(result).toBeInstanceOf(Buffer);
                expect(result.toString()).toBe(`<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# GitHub Workflow: Test Workflow

</div>`);
            });
        });

        it('should handle empty manifest name', () => {
            // Arrange
            const manifest: GitHubAction = {
                usesName: 'owner/repo',
                name: '',
                description: 'A test action',
                runs: { using: 'node20' }
            };

            // Act
            const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toBe(
                `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# GitHub Action: Repo

</div>`
            );
        });

        it('should handle manifest with special characters in name', () => {
            // Arrange
            const manifest: GitHubAction = {
                usesName: 'owner/repo',
                name: 'Test & Action <script>',
                description: 'A test action',
                runs: { using: 'node20' }
            };

            // Act
            const result = generator.generateSection(formatterAdapter, manifest, mockRepository);

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toBe(
                `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# GitHub Action: Test & Action <script>

</div>`
            );
        });

        it('should handle repository without logo property', () => {
            // Arrange
            const manifest: GitHubAction = {
                usesName: 'owner/repo',
                name: 'Test Action',
                description: 'A test action',
                runs: { using: 'node20' }
            };
            const repositoryWithoutLogo = {
                url: 'https://github.com/owner/repo',
                owner: 'owner',
                name: 'repo',
                fullName: 'owner/repo'
                // No logo property
            };

            // Act
            const result = generator.generateSection(formatterAdapter, manifest, repositoryWithoutLogo);

            // Assert
            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toBe(
                `<!-- markdownlint-disable-next-line first-line-heading -->
<div align="center">

# GitHub Action: Test Action

</div>`
            );
        });
    });
});
