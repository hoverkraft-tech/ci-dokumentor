import 'reflect-metadata';
import { Container } from '@ci-dokumentor/core';
import { initGlobalContainer } from './global-container.js';

let container: Container | null = null;

/**
 * Resets the container singleton for testing purposes
 */
export function resetContainer(): void {
    container = null;
}

/**
 * Creates and configures the dependency injection container
 */
export async function initContainer(): Promise<Container> {
    if (container) {
        return container;
    }

    // Use the global container that includes all packages
    container = await initGlobalContainer();

    return container;
}