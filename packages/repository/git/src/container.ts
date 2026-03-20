import { Container, REPOSITORY_PROVIDER_IDENTIFIER } from '@ci-dokumentor/core';
import { Container as InversifyContainer } from 'inversify';
import { GitRepositoryProvider } from './git-repository-provider.js';

let container: Container | null = null;

export function resetContainer(): void {
  container = null;
}

export function initContainer(
  baseContainer: Container | undefined = undefined
): Container {
  const targetContainer = baseContainer ?? (container ??= new InversifyContainer() as Container);

  // Return early if this package has already been initialized in this container.
  if (targetContainer.isCurrentBound(GitRepositoryProvider)) {
    return targetContainer;
  }

  // Bind git repository services only
  targetContainer.bind(GitRepositoryProvider).toSelf().inSingletonScope();

  // Register as repository provider
  targetContainer.bind(REPOSITORY_PROVIDER_IDENTIFIER).toService(GitRepositoryProvider);

  return targetContainer;
}
