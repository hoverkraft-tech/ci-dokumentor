import { Container as InversifyContainer } from 'inversify';
import { SECTION_GENERATOR_ADAPTER_IDENTIFIER, initContainer as coreInitContainer } from '@ci-dokumentor/core';
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
export type Container = InversifyContainer;

let container: Container | null = null;

export function initContainer(): Container {
    if (container) {
        return container;
    }

    container = coreInitContainer();

    // Bind parser
    container.bind(GitHubActionsParser).toSelf().inSingletonScope();

    // Bind generator
    container.bind(GitHubActionsGeneratorAdapter).toSelf().inSingletonScope();

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