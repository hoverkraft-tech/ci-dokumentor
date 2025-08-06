import 'reflect-metadata';
import { Command as CommanderCommand } from 'commander';
import { type GlobalContainer, initGlobalContainer } from './global-container.js';
import { COMMAND_IDENTIFIER, type Command } from './interfaces/command.interface.js';
import { LOGGER_IDENTIFIER, type Logger } from './interfaces/logger.interface.js';
import { PACKAGE_SERVICE_IDENTIFIER, type PackageService } from './interfaces/package-service.interface.js';
import { PROGRAM_IDENTIFIER, type Program } from './interfaces/program.interface.js';
import { CliApplication } from './application/cli-application.js';
import { GenerateCommand } from './commands/generate-command.js';
import { GenerateDocumentationUseCase } from './usecases/generate-documentation.usecase.js';
import { ConsoleLogger } from './services/console-logger.service.js';
import { FilePackageService } from './services/file-package.service.js';

let container: GlobalContainer | null = null;

/**
 * Resets the container singleton for testing purposes
 */
export function resetContainer(): void {
    container = null;
}

/**
 * Creates and configures the dependency injection container
 */
export function initContainer(): GlobalContainer {
    if (container) {
        return container;
    }

    // Initialize the global container which includes all packages
    container = initGlobalContainer();

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