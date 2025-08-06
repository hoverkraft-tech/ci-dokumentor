import { Container as InversifyContainer } from "inversify";
import { initContainer as coreInitContainer } from './container.js';

export type GlobalContainer = InversifyContainer;

let globalContainer: GlobalContainer | null = null;

export function resetGlobalContainer(): void {
    globalContainer = null;
}

/**
 * Initialize a global container that orchestrates all package containers.
 * This provides a single entry point for dependency injection that includes
 * all services from all packages.
 * 
 * This is the primary runtime container initialization that should be used
 * by both runtime packages and tests for consistent dependency injection.
 */
export function initGlobalContainer(): GlobalContainer {
    if (globalContainer) {
        return globalContainer;
    }

    // Start with core container
    globalContainer = coreInitContainer();

    return globalContainer;
}

/**
 * Initialize global container with all available packages.
 * This dynamically loads and initializes all package containers.
 * 
 * @param packages Optional array of package initializers to include
 */
export async function initGlobalContainerWithPackages(
    packages?: Array<(container: GlobalContainer) => GlobalContainer | Promise<GlobalContainer>>
): Promise<GlobalContainer> {
    if (globalContainer && !packages) {
        return globalContainer;
    }

    // Initialize base global container
    globalContainer = initGlobalContainer();

    // If specific packages are provided, use them
    if (packages) {
        for (const packageInit of packages) {
            globalContainer = await packageInit(globalContainer);
        }
        return globalContainer;
    }

    // Otherwise, try to dynamically load common packages
    try {
        // Try to load git repository package
        const { initContainer: gitInitContainer } = await import('@ci-dokumentor/repository-git');
        gitInitContainer(globalContainer);
    } catch (error) {
        // Package not available, skip
    }

    try {
        // Try to load github repository package  
        const { initContainer: githubInitContainer } = await import('@ci-dokumentor/repository-github');
        githubInitContainer(globalContainer);
    } catch (error) {
        // Package not available, skip
    }

    try {
        // Try to load github actions package
        const { initContainer: githubActionsInitContainer } = await import('@ci-dokumentor/cicd-github-actions');
        githubActionsInitContainer(globalContainer);
    } catch (error) {
        // Package not available, skip
    }

    return globalContainer;
}

/**
 * Initialize global container with specific package initializers (synchronous version).
 * This is primarily for tests that need predictable, synchronous initialization.
 * 
 * @param packageInitializers Array of package initializer functions
 */
export function initGlobalContainerWithPackagesSync(
    packageInitializers: Array<(container: GlobalContainer) => GlobalContainer>
): GlobalContainer {
    // Reset and create fresh container for tests
    globalContainer = initGlobalContainer();

    // Initialize packages synchronously
    for (const packageInit of packageInitializers) {
        globalContainer = packageInit(globalContainer);
    }

    return globalContainer;
}

/**
 * Create a test container with all common packages.
 * This is a convenience function for tests that need a fully configured container.
 */
export function createTestContainer(): GlobalContainer {
    try {
        // Try to require packages synchronously (they should be available in test environment)
        const { initContainer: gitInitContainer } = require('@ci-dokumentor/repository-git');
        const { initContainer: githubInitContainer } = require('@ci-dokumentor/repository-github');
        const { initContainer: githubActionsInitContainer } = require('@ci-dokumentor/cicd-github-actions');

        return initGlobalContainerWithPackagesSync([
            gitInitContainer,
            githubInitContainer,
            githubActionsInitContainer
        ]);
    } catch (error) {
        // Fallback to just core container if packages aren't available
        return initGlobalContainer();
    }
}