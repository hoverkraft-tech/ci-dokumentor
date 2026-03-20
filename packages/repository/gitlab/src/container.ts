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
  const targetContainer = baseContainer ?? (container ??= new InversifyContainer() as Container);

  // Return early if this package has already been initialized in this container.
  if (targetContainer.isCurrentBound(GitLabRepositoryProvider)) {
    return targetContainer;
  }

  // Bind GitLab repository services only
  targetContainer.bind(GitLabRepositoryProvider).toSelf().inSingletonScope();

  // Register as repository provider
  targetContainer.bind(REPOSITORY_PROVIDER_IDENTIFIER).toService(GitLabRepositoryProvider);

  return targetContainer;
}

/**
 * Initialize a test container for GitLab repository package.
 * This initializes all the proper packages needed for GitLab testing.
 */
export function initTestContainer(): Container {
  let testContainer = coreInitContainer();
  testContainer = gitInitContainer(testContainer);
  return initContainer(testContainer);
}