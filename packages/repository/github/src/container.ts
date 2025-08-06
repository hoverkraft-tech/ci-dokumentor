import { Container, REPOSITORY_PROVIDER_IDENTIFIER } from '@ci-dokumentor/core';
import { GitHubRepositoryProvider } from './github-repository.provider.js';

let container: Container | null = null;

export function resetContainer(): void {
    container = null;
}

export function initContainer(baseContainer: Container): Container {
    // Always use the provided base container
    container = baseContainer;

    // Check if GitHubRepositoryProvider is already bound
    if (!container.isBound(GitHubRepositoryProvider)) {
        // Bind GitHub repository services only
        container.bind(GitHubRepositoryProvider).toSelf().inSingletonScope();
        
        // Register as repository provider
        container.bind(REPOSITORY_PROVIDER_IDENTIFIER).to(GitHubRepositoryProvider);
    }

    return container;
}