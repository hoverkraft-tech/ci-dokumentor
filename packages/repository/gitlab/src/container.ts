import { Container, REPOSITORY_PROVIDER_IDENTIFIER, initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { initContainer as gitInitContainer } from '@ci-dokumentor/repository-git';
import { Container as InversifyContainer } from 'inversify';
import { GitLabRepositoryProvider } from './gitlab-repository.provider.js';

let container: Container | null = null;

export function resetContainer(): void {
  container = null;
}

export function initContainer(
  baseContainer: Container | undefined = undefined
): Container {
  if (baseContainer) {
    // When a base container is provided, always use it and set it as our singleton
    container = baseContainer;
  } else if (container) {
    // Only return existing singleton if no base container is provided
    return container;
  } else {
    container = new InversifyContainer() as Container;
  }

  // Return early if already bound
  if (container.isBound(GitLabRepositoryProvider)) {
    return container;
  }

  // Bind GitLab repository services only
  container.bind(GitLabRepositoryProvider).toSelf().inSingletonScope();

  // Register as repository provider
  container.bind(REPOSITORY_PROVIDER_IDENTIFIER).to(GitLabRepositoryProvider);

  return container;
}

/**
 * Initialize a test container for GitLab repository package.
 * This initializes all the proper packages needed for GitLab testing.
 */
export function initTestContainer(): Container {
  // Initialize core container first
  const baseContainer = coreInitContainer();

  // Initialize git repository package
  gitInitContainer(baseContainer);

  // Initialize this package
  return initContainer(baseContainer);
}