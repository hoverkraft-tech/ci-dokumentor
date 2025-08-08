import 'reflect-metadata';
import { Container } from '@ci-dokumentor/core';
import { initContainer } from './container.js';
import { initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { initContainer as gitInitContainer } from '@ci-dokumentor/repository-git';
import { initContainer as githubInitContainer } from '@ci-dokumentor/repository-github';
import { initContainer as githubActionsInitContainer } from '@ci-dokumentor/cicd-github-actions';

/**
 * Initialize the global container that includes all packages.
 * It should init cli container then other packages containers.
 */
export function initGlobalContainer(): Container {
    // Initialize core container first
    const baseContainer = coreInitContainer();

    // Initialize repository packages
    gitInitContainer(baseContainer);

    githubInitContainer(baseContainer);

    // Initialize CICD packages
    githubActionsInitContainer(baseContainer);

    // Initialize CLI package itself
    return initContainer(baseContainer);
}