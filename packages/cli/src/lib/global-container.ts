import { Container , initContainer as coreInitContainer , resetContainer as resetCoreContainer } from '@ci-dokumentor/core';
import { initContainer as gitInitContainer , resetContainer as resetGitContainer } from '@ci-dokumentor/repository-git';
import { initContainer as githubInitContainer , resetContainer as resetGithubContainer } from '@ci-dokumentor/repository-github';
import { initContainer as gitlabInitContainer , resetContainer as resetGitlabContainer } from '@ci-dokumentor/repository-gitlab';
import { initContainer as githubActionsInitContainer , resetContainer as resetGithubActionsContainer } from '@ci-dokumentor/cicd-github-actions';
import { initContainer as gitlabCIInitContainer , resetContainer as resetGitlabCIContainer } from '@ci-dokumentor/cicd-gitlab-ci';
import { initContainer, resetContainer } from './container.js';

let globalContainer: Container | null = null;

/**
 * Initialize the global container that includes all packages.
 * It should init cli container then other packages containers.
 */
export function initGlobalContainer(): Container {
  if (globalContainer) {
    return globalContainer;
  }

  // Initialize core container first
  globalContainer = coreInitContainer();

  // Initialize repository packages
  globalContainer = gitInitContainer(globalContainer);
  globalContainer = githubInitContainer(globalContainer);
  globalContainer = gitlabInitContainer(globalContainer);

  // Initialize CICD packages
  globalContainer = githubActionsInitContainer(globalContainer);
  globalContainer = gitlabCIInitContainer(globalContainer);

  // Initialize CLI package itself
  globalContainer = initContainer(globalContainer);

  return globalContainer;
}

export function resetGlobalContainer(): void {
  globalContainer = null;
  resetContainer();
  resetGitlabCIContainer();
  resetGithubActionsContainer();
  resetGitlabContainer();
  resetGithubContainer();
  resetGitContainer();
  resetCoreContainer();
}
