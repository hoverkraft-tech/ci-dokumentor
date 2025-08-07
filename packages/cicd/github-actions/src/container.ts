import { Container, SECTION_GENERATOR_ADAPTER_IDENTIFIER, GENERATOR_ADAPTER_IDENTIFIER } from '@ci-dokumentor/core';
import { Container as InversifyContainer } from "inversify";
import { GitHubActionsParser } from './github-actions-parser.js';
import { GitHubActionsGeneratorAdapter } from './github-actions-generator.adapter.js';

// Section generators
import { HeaderSectionGenerator } from './section/header-section-generator.adapter.js';
import { BadgesSectionGenerator } from './section/badges-section-generator.adapter.js';
import { OverviewSectionGenerator } from './section/overview-section-generator.adapter.js';
import { ContentsSectionGenerator } from './section/contents-section-generator.adapter.js';
import { UsageSectionGenerator } from './section/usage-section-generator.adapter.js';
import { InputsSectionGenerator } from './section/inputs-section-generator.adapter.js';
import { OutputsSectionGenerator } from './section/outputs-section-generator.adapter.js';
import { SecretsSectionGenerator } from './section/secrets-section-generator.adapter.js';
import { ExamplesSectionGenerator } from './section/examples-section-generator.adapter.js';
import { JobsSectionGenerator } from './section/jobs-section-generator.adapter.js';
import { ContributingSectionGenerator } from './section/contributing-section-generator.adapter.js';
import { SecuritySectionGenerator } from './section/security-section-generator.adapter.js';
import { LicenseSectionGenerator } from './section/license-section-generator.adapter.js';

let container: Container | null = null;

export function resetContainer(): void {
    container = null;
}

export function initContainer(baseContainer: Container | undefined = undefined): Container {
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
    if (container.isBound(GitHubActionsParser)) {
        return container;
    }

    // Bind GitHub Actions specific services only
    // Bind parser
    container.bind(GitHubActionsParser).toSelf().inSingletonScope();

    // Bind generator
    container.bind(GitHubActionsGeneratorAdapter).toSelf().inSingletonScope();
    container.bind(GENERATOR_ADAPTER_IDENTIFIER).to(GitHubActionsGeneratorAdapter);

    // Bind section generators
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(HeaderSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(BadgesSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(OverviewSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(ContentsSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(UsageSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(InputsSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(OutputsSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(SecretsSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(ExamplesSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(JobsSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(ContributingSectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(SecuritySectionGenerator);
    container.bind(SECTION_GENERATOR_ADAPTER_IDENTIFIER).to(LicenseSectionGenerator);

    return container;
}

/**
 * Initialize a test container for GitHub Actions package.
 * This initializes all the proper packages needed for GitHub Actions testing.
 */
export function initTestContainer(): Container {
    // Initialize core container first
    const { initContainer: coreInitContainer } = require('@ci-dokumentor/core');
    const baseContainer = coreInitContainer();

    // Initialize git repository package
    const { initContainer: gitInitContainer } = require('@ci-dokumentor/repository-git');
    gitInitContainer(baseContainer);

    // Initialize github repository package
    const { initContainer: githubInitContainer } = require('@ci-dokumentor/repository-github');
    githubInitContainer(baseContainer);

    // Initialize this package
    return initContainer(baseContainer);
}