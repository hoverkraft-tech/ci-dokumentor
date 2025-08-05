import 'reflect-metadata';
import { Command as CommanderCommand } from 'commander';
import { type Container, initContainer as coreInitContainer } from '@ci-dokumentor/core';
import { initContainer as gitHubActionsInitContainer } from '@ci-dokumentor/cicd-github-actions';
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

/**
 * Resets the container singleton for testing purposes
 */
export function resetContainer(): void {
    container = null;
}

/**
 * Creates and configures the dependency injection container
 */
export function initContainer(): Container {
    if (container) {
        return container;
    }

    // Initialize the core container
    // This allows us to use the core services and types
    container = coreInitContainer();

    // Initialize GitHub Actions specific bindings
    gitHubActionsInitContainer(container);

    // Bind core services
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