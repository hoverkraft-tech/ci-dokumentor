import { Container, initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { initContainer as gitInitContainer } from '@ci-dokumentor/repository-git';
import { initContainer as githubInitContainer } from '@ci-dokumentor/repository-github';
import { initContainer as githubActionsInitContainer } from '@ci-dokumentor/cicd-github-actions';

export type GlobalContainer = Container;

let globalContainer: GlobalContainer | null = null;

export function resetGlobalContainer(): void {
    globalContainer = null;
}

/**
 * Initialize a global container that orchestrates all package containers.
 * This provides a single entry point for dependency injection that includes
 * all services from all packages.
 */
export function initGlobalContainer(): GlobalContainer {
    if (globalContainer) {
        return globalContainer;
    }

    // Start with core container
    globalContainer = coreInitContainer();

    // Initialize repository providers
    gitInitContainer(globalContainer);
    githubInitContainer(globalContainer);

    // Initialize CICD providers  
    githubActionsInitContainer(globalContainer);

    return globalContainer;
}