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
import { GeneratedSectionGenerator } from './section/generated-section-generator.adapter.js';

let container: Container | null = null;

export function resetContainer(): void {
  container = null;
}

export function initContainer(
  baseContainer: Container | undefined = undefined
): Container {
  const targetContainer = baseContainer ?? (container ??= new InversifyContainer() as Container);

  // Return early if this package has already been initialized in this container.
  if (targetContainer.isCurrentBound(GitLabCIParser)) {
    return targetContainer;
  }

  // Bind GitLab CI specific services only
  // Bind parser
  targetContainer.bind(GitLabCIParser).toSelf().inSingletonScope();

  // Bind generator
  targetContainer.bind(GitLabCIGeneratorAdapter).toSelf().inSingletonScope();
  targetContainer
    .bind(GENERATOR_ADAPTER_IDENTIFIER)
    .toService(GitLabCIGeneratorAdapter);

  // Bind section generators
  targetContainer
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(HeaderSectionGenerator);
  targetContainer
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(OverviewSectionGenerator);
  targetContainer
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(UsageSectionGenerator);
  targetContainer
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(InputsSectionGenerator);
  targetContainer
    .bind(GITLAB_CI_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(GeneratedSectionGenerator);

  return targetContainer;
}

/**
 * Initialize a test container for GitLab CI package.
 * This initializes all the proper packages needed for GitLab CI testing.
 */
export function initTestContainer(): Container {
  let testContainer = coreInitContainer();
  testContainer = gitInitContainer(testContainer);
  testContainer = gitlabInitContainer(testContainer);
  return initContainer(testContainer);
}