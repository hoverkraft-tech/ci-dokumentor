import { describe, it, expect, beforeEach } from 'vitest';
import { SecretsSectionGenerator } from './secrets-section-generator.adapter.js';
import { GitHubWorkflowMockFactory } from '../../__tests__/github-workflow-mock.factory.js';
import { GitHubActionMockFactory } from '../../__tests__/github-action-mock.factory.js';
import { MarkdownFormatterAdapter, RepositoryProvider } from '@ci-dokumentor/core';
import { initTestContainer } from '@ci-dokumentor/repository-github';
import { RepositoryProviderMockFactory } from '@ci-dokumentor/core/tests';

describe('SecretsSectionGenerator', () => {
    let generator: SecretsSectionGenerator;
    let formatterAdapter: MarkdownFormatterAdapter;
    let mockRepositoryProvider: RepositoryProvider;

    beforeEach(() => {
        mockRepositoryProvider = RepositoryProviderMockFactory.create();

        const container = initTestContainer();
        formatterAdapter = container.get(MarkdownFormatterAdapter);

        generator = new SecretsSectionGenerator();
    });

    it('should return empty buffer for GitHub Action manifests', async () => {
        // Arrange
        const action = GitHubActionMockFactory.create();

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest: action as any, repositoryProvider: mockRepositoryProvider as any });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual('');
    });

    it('should return empty buffer when workflow has no secrets', async () => {
        // Arrange
        const workflow = GitHubWorkflowMockFactory.create();

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest: workflow, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual('');
    });

    it('should generate a secrets table when workflow has secrets', async () => {
        // Arrange
        const secrets = {
            SECRET_A: { description: 'First secret', required: true },
            SECRET_B: { description: 'Second secret', required: false },
        } as Record<string, any>;

        const workflow = GitHubWorkflowMockFactory.create({ on: { workflow_call: { secrets } } });

        // Act
        const result = await generator.generateSection({ formatterAdapter, manifest: workflow, repositoryProvider: mockRepositoryProvider });

        // Assert
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toEqual(`## Secrets

| **Secret**     | **Description** | **Required** |
| -------------- | --------------- | ------------ |
| **\`SECRET_A\`** | First secret    | **true**     |
| **\`SECRET_B\`** | Second secret   | **false**    |
`);
    });
});
