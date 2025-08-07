import 'reflect-metadata';
import { Container } from '@ci-dokumentor/core';
import { initContainer } from './container.js';

/**
 * Initialize the global container that includes all packages.
 * It should init cli container then other packages containers.
 */
export function initGlobalContainer(): Container {
    // Initialize core container first
    const { initContainer: coreInitContainer } = require('@ci-dokumentor/core');
    const baseContainer = coreInitContainer();

    // Initialize repository packages
    const { initContainer: gitInitContainer } = require('@ci-dokumentor/repository-git');
    gitInitContainer(baseContainer);

    const { initContainer: githubInitContainer } = require('@ci-dokumentor/repository-github');
    githubInitContainer(baseContainer);

    // Initialize CICD packages
    const { initContainer: githubActionsInitContainer } = require('@ci-dokumentor/cicd-github-actions');
    githubActionsInitContainer(baseContainer);

    // Initialize CLI package itself
    return initContainer(baseContainer);
}