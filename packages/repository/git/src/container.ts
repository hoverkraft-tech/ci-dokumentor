import { Container } from '@ci-dokumentor/core';
import { Container as InversifyContainer } from "inversify";
import { REPOSITORY_PROVIDER_IDENTIFIER } from '@ci-dokumentor/core';
import { GitRepositoryProvider } from './git-repository-provider.js';

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
        container = new InversifyContainer() as Container;
    }

    // Bind git repository services only
    if (!container.isBound(GitRepositoryProvider)) {
        container.bind(GitRepositoryProvider).toSelf().inSingletonScope();
        
        // Register as repository provider
        container.bind(REPOSITORY_PROVIDER_IDENTIFIER).to(GitRepositoryProvider);
    }

    return container;
}