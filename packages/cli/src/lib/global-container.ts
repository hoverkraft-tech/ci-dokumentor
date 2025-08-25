import 'reflect-metadata';
import { Container } from '@ci-dokumentor/core';
import { initContainer, resetContainer } from './container.js';
import { initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { initContainer as gitInitContainer } from '@ci-dokumentor/repository-git';
import { initContainer as githubInitContainer } from '@ci-dokumentor/repository-github';
import { initContainer as githubActionsInitContainer } from '@ci-dokumentor/cicd-github-actions';
import { resetContainer as resetCoreContainer } from '@ci-dokumentor/core';
import { resetContainer as resetGitContainer } from '@ci-dokumentor/repository-git';
import { resetContainer as resetGithubContainer } from '@ci-dokumentor/repository-github';
import { resetContainer as resetGithubActionsContainer } from '@ci-dokumentor/cicd-github-actions';

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

export function resetGlobalContainer(): void {
  resetContainer();
  resetCoreContainer();
  resetGitContainer();
  resetGithubContainer();
  resetGithubActionsContainer();
}
