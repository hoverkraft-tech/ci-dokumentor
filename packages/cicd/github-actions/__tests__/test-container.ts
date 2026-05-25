import { Container, initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { initContainer as gitInitContainer } from '@ci-dokumentor/repository-git';
import { initContainer as githubInitContainer } from '@ci-dokumentor/repository-github';
import { initContainer as githubActionsInitContainer } from '../src/container.js';

export function initTestContainer(): Container {
    let testContainer = coreInitContainer();
    testContainer = gitInitContainer(testContainer);
    testContainer = githubInitContainer(testContainer);
    return githubActionsInitContainer(testContainer);
}