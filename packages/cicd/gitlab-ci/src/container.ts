import {
  Container,
  GENERATOR_ADAPTER_IDENTIFIER,
  initContainer as coreInitContainer
} from '@ci-dokumentor/core';
import { Container as InversifyContainer } from 'inversify';
import { initContainer as gitInitContainer } from '@ci-dokumentor/repository-git';
import { initContainer as gitlabInitContainer } from '@ci-dokumentor/repository-gitlab';
import { GitLabCIParser } from './gitlab-ci-parser.js';
import { 
  GitLabCIGeneratorAdapter, 
  GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER 
} from './gitlab-ci-generator.adapter.js';

// Section generators
import { HeaderSectionGenerator } from './section/header-section-generator.adapter.js';
import { OverviewSectionGenerator } from './section/overview-section-generator.adapter.js';
import { UsageSectionGenerator } from './section/usage-section-generator.adapter.js';
import { InputsSectionGenerator } from './section/inputs-section-generator.adapter.js';

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
  if (container.isBound(GitLabCIParser)) {
    return container;
  }

  // Bind GitLab CI specific services only
  // Bind parser
  container.bind(GitLabCIParser).toSelf().inSingletonScope();

  // Bind generator
  container.bind(GitLabCIGeneratorAdapter).toSelf().inSingletonScope();
  container
    .bind(GENERATOR_ADAPTER_IDENTIFIER)
    .to(GitLabCIGeneratorAdapter);

  // Bind section generators
  container
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(HeaderSectionGenerator);
  container
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(OverviewSectionGenerator);
  container
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(UsageSectionGenerator);
  container
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(InputsSectionGenerator);

  return container;
}

/**
 * Initialize a test container for GitLab CI package.
 * This initializes all the proper packages needed for GitLab CI testing.
 */
export function initTestContainer(): Container {
  // Initialize core container first
  const baseContainer = coreInitContainer();

  // Initialize git repository package
  gitInitContainer(baseContainer);

  // Initialize gitlab repository package
  gitlabInitContainer(baseContainer);

  // Initialize this package
  return initContainer(baseContainer);
}