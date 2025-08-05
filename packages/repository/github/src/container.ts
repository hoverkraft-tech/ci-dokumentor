import { Container, REPOSITORY_PROVIDER_IDENTIFIER } from '@ci-dokumentor/core';
import { initContainer as gitRepositoryInitContainer, GitRepositoryProvider } from '@ci-dokumentor/repository-git';
import { GitHubRepositoryProvider } from './github-repository.provider.js';

let container: Container | null = null;

export function resetContainer(): void {
    container = null;
}

export function initContainer(baseContainer: Container | undefined = undefined): Container {
    if (baseContainer) {
        // When a base container is provided, always use it and set it as our singleton
        container = baseContainer;
        // Only initialize git repository container if GitRepositoryProvider is not already bound
        if (!container.isBound(GitRepositoryProvider)) {
            gitRepositoryInitContainer(container);
        }
    } else if (container) {
        // Only return existing singleton if no base container is provided
        return container;
    } else {
        // Initialize with git repository container first
        container = gitRepositoryInitContainer();
    }

    // Check if GitHubRepositoryProvider is already bound
    if (!container.isBound(GitHubRepositoryProvider)) {
        // Services
        container.bind(GitHubRepositoryProvider).toSelf().inSingletonScope();
        
        // Register as repository provider
        container.bind(REPOSITORY_PROVIDER_IDENTIFIER).to(GitHubRepositoryProvider);
    }

    return container;
}