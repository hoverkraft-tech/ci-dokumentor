import { Container } from '@ci-dokumentor/core';
import { REPOSITORY_PROVIDER_IDENTIFIER } from '@ci-dokumentor/core';
import { GitRepositoryProvider } from './git-repository-provider.js';

let container: Container | null = null;

export function resetContainer(): void {
    container = null;
}

export function initContainer(baseContainer: Container): Container {
    // Always use the provided base container
    container = baseContainer;

    // Bind git repository services only
    if (!container.isBound(GitRepositoryProvider)) {
        container.bind(GitRepositoryProvider).toSelf().inSingletonScope();
        
        // Register as repository provider
        container.bind(REPOSITORY_PROVIDER_IDENTIFIER).to(GitRepositoryProvider);
    }

    return container;
}