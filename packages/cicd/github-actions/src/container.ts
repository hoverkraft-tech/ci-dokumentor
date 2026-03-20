import {
  Container,
  GENERATOR_ADAPTER_IDENTIFIER,
  MIGRATION_ADAPTER_IDENTIFIER,
  initContainer as coreInitContainer
} from '@ci-dokumentor/core';
import { Container as InversifyContainer } from 'inversify';
import { initContainer as gitInitContainer } from '@ci-dokumentor/repository-git';
import { initContainer as githubInitContainer } from '@ci-dokumentor/repository-github';
import { GitHubActionsParser } from './github-actions-parser.js';
import {
  GitHubActionsGeneratorAdapter,
  GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER
} from './github-actions-generator.adapter.js';

// Section generators
import { HeaderSectionGenerator } from './section/header-section-generator.adapter.js';
import { BadgesSectionGenerator } from './section/badges-section-generator.adapter.js';
import { OverviewSectionGenerator } from './section/overview-section-generator.adapter.js';
import { UsageSectionGenerator } from './section/usage-section-generator.adapter.js';
import { InputsSectionGenerator } from './section/inputs-section-generator.adapter.js';
import { OutputsSectionGenerator } from './section/outputs-section-generator.adapter.js';
import { SecretsSectionGenerator } from './section/secrets-section-generator.adapter.js';
import { ExamplesSectionGenerator } from './section/examples-section-generator.adapter.js';
import { ContributingSectionGenerator } from './section/contributing-section-generator.adapter.js';
import { SecuritySectionGenerator } from './section/security-section-generator.adapter.js';
import { LicenseSectionGenerator } from './section/license-section-generator.adapter.js';
import { GeneratedSectionGenerator } from './section/generated-section-generator.adapter.js';

// Migration adapters
import { ActionDocsMigrationAdapter } from './migration/action-docs-migration.adapter.js';
import { AutoDocMigrationAdapter } from './migration/auto-doc-migration.adapter.js';
import { ActdocsMigrationAdapter } from './migration/actdocs-migration.adapter.js';
import { GitHubActionReadmeGeneratorMigrationAdapter } from './migration/github-action-readme-generator-migration.adapter.js';

let container: Container | null = null;

export function resetContainer(): void {
  container = null;
}

export function initContainer(
  baseContainer: Container | undefined = undefined
): Container {
  const targetContainer = baseContainer ?? (container ??= new InversifyContainer() as Container);

  // Return early if this package has already been initialized in this container.
  if (targetContainer.isCurrentBound(GitHubActionsParser)) {
    return targetContainer;
  }

  // Bind GitHub Actions specific services only
  // Bind parser
  targetContainer.bind(GitHubActionsParser).toSelf().inSingletonScope();

  // Bind generator
  targetContainer.bind(GitHubActionsGeneratorAdapter).toSelf().inSingletonScope();
  targetContainer
    .bind(GENERATOR_ADAPTER_IDENTIFIER)
    .toService(GitHubActionsGeneratorAdapter);

  // Bind section generators
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(HeaderSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(BadgesSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(OverviewSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(UsageSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(InputsSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(SecretsSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(OutputsSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(ExamplesSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(ContributingSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(SecuritySectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(LicenseSectionGenerator);
  targetContainer
    .bind(GITHUB_ACTIONS_SECTION_GENERATOR_ADAPTER_IDENTIFIER)
    .to(GeneratedSectionGenerator);

  // Bind migration adapters to the container
  targetContainer.bind(ActionDocsMigrationAdapter).toSelf().inSingletonScope();
  targetContainer
    .bind(MIGRATION_ADAPTER_IDENTIFIER)
    .toService(ActionDocsMigrationAdapter);

  targetContainer.bind(AutoDocMigrationAdapter).toSelf().inSingletonScope();
  targetContainer
    .bind(MIGRATION_ADAPTER_IDENTIFIER)
    .toService(AutoDocMigrationAdapter);

  targetContainer.bind(ActdocsMigrationAdapter).toSelf().inSingletonScope();
  targetContainer
    .bind(MIGRATION_ADAPTER_IDENTIFIER)
    .toService(ActdocsMigrationAdapter);

  targetContainer.bind(GitHubActionReadmeGeneratorMigrationAdapter).toSelf().inSingletonScope();
  targetContainer
    .bind(MIGRATION_ADAPTER_IDENTIFIER)
    .toService(GitHubActionReadmeGeneratorMigrationAdapter);

  return targetContainer;
}

/**
 * Initialize a test container for GitHub Actions package.
 * This initializes all the proper packages needed for GitHub Actions testing.
 */
export function initTestContainer(): Container {
  let testContainer = coreInitContainer();
  testContainer = gitInitContainer(testContainer);
  testContainer = githubInitContainer(testContainer);
  return initContainer(testContainer);
}
