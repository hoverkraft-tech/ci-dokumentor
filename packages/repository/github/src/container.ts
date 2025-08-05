import { Container, initContainer as coreInitContainer, REPOSITORY_ADAPTER_IDENTIFIER } from '@ci-dokumentor/core';
import { GitHubRepositoryService } from './github-repository.service.js';

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
    container.bind(GitHubRepositoryService).toSelf().inSingletonScope();
    
    // Register as repository adapter
    container.bind(REPOSITORY_ADAPTER_IDENTIFIER).to(GitHubRepositoryService);

    return container;
}