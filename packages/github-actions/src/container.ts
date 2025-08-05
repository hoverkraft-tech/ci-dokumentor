import { Container } from '@ci-dokumentor/core';
import { initContainer as initCicdContainer } from '@ci-dokumentor/cicd-github-actions';

let container: Container | null = null;

export function initContainer(baseContainer: Container | undefined = undefined): Container {
    if (container) {
        return container;
    }

    if (baseContainer) {
        container = baseContainer;
        // Initialize cicd container with the base container
        initCicdContainer(container);
    } else {
        // Initialize the full container hierarchy
        container = initCicdContainer();
    }

    return container;
}