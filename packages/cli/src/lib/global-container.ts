import 'reflect-metadata';
import { Command as CommanderCommand } from 'commander';
import { Container } from '@ci-dokumentor/core';
import { Container as InversifyContainer } from "inversify";
import { COMMAND_IDENTIFIER, type Command } from './interfaces/command.interface.js';
import { LOGGER_IDENTIFIER, type Logger } from './interfaces/logger.interface.js';
import { PACKAGE_SERVICE_IDENTIFIER, type PackageService } from './interfaces/package-service.interface.js';
import { PROGRAM_IDENTIFIER, type Program } from './interfaces/program.interface.js';
import { CliApplication } from './application/cli-application.js';
import { GenerateCommand } from './commands/generate-command.js';
import { GenerateDocumentationUseCase } from './usecases/generate-documentation.usecase.js';
import { ConsoleLogger } from './services/console-logger.service.js';
import { FilePackageService } from './services/file-package.service.js';

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
        container = new InversifyContainer();
    }

    // Bind CLI-specific services
    container.bind<Logger>(LOGGER_IDENTIFIER).to(ConsoleLogger).inSingletonScope();
    container.bind<PackageService>(PACKAGE_SERVICE_IDENTIFIER).to(FilePackageService).inSingletonScope();
    container.bind<Program>(PROGRAM_IDENTIFIER).toConstantValue(new CommanderCommand());

    // Bind use cases
    container.bind(GenerateDocumentationUseCase).toSelf();

    // Bind commands (using multiInject pattern)
    container.bind<Command>(COMMAND_IDENTIFIER).to(GenerateCommand).inSingletonScope();

    // Bind the main application
    container.bind(CliApplication).toSelf().inSingletonScope();

    return container;
}

/**
 * Initialize the global container that includes all packages including CLI.
 * This provides a complete container with all services from all packages.
 */
export async function initGlobalContainer(): Promise<Container> {
    if (container) {
        return container;
    }

    // Initialize core container first
    const { initContainer: coreInitContainer } = await import('@ci-dokumentor/core');
    const baseContainer = coreInitContainer();

    // Initialize repository packages
    try {
        const { initContainer: gitInitContainer } = await import('@ci-dokumentor/repository-git');
        gitInitContainer(baseContainer);
    } catch (error) {
        // Package not available, skip
    }

    try {
        const { initContainer: githubInitContainer } = await import('@ci-dokumentor/repository-github');
        githubInitContainer(baseContainer);
    } catch (error) {
        // Package not available, skip
    }

    // Initialize CICD packages
    try {
        const { initContainer: githubActionsInitContainer } = await import('@ci-dokumentor/cicd-github-actions');
        githubActionsInitContainer(baseContainer);
    } catch (error) {
        // Package not available, skip
    }

    // Initialize CLI package itself
    return initContainer(baseContainer);
}