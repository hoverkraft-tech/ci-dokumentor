import { Container, initContainer as coreInitContainer, REPOSITORY_PROVIDER_IDENTIFIER } from '@ci-dokumentor/core';
import { GitHubRepositoryProvider } from './github-repository.service.js';

let container: Container | null = null;

export function resetContainer(): void {
    container = null;
}

export function initContainer(baseContainer: Container | undefined = undefined): Container {
    if (baseContainer) {
        // When a base container is provided, always use it and set it as our singleton
        container = baseContainer;
    } else if (container) {
        // Only return existing singleton if no base container is provided
        return container;
    } else {
        container = coreInitContainer();
    }

    // Services
    container.bind(GitHubRepositoryProvider).toSelf().inSingletonScope();
    
    // Register as repository provider
    container.bind(REPOSITORY_PROVIDER_IDENTIFIER).to(GitHubRepositoryProvider);

    return container;
}