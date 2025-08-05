import { Container, initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { GitHubRepositoryService } from './github-repository.service.js';

let container: Container | null = null;

export function initContainer(baseContainer: Container | undefined = undefined): Container {
    if (container) {
        return container;
    }

    if (baseContainer) {
        container = baseContainer;
    } else {
        container = coreInitContainer();
    }

    // Services
    container.bind(GitHubRepositoryService).toSelf().inSingletonScope();

    return container;
}