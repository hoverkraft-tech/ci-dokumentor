import { Container } from '@ci-dokumentor/core';
import { Container as InversifyContainer } from 'inversify';
import {
  COMMAND_IDENTIFIER,
  type Command,
} from './commands/command.js';
import {
  LOGGER_ADAPTER_IDENTIFIER,
  type LoggerAdapter,
} from './logger/adapters/logger.adapter.js';
import {
  PACKAGE_SERVICE_IDENTIFIER,
  type PackageService,
} from './package/package-service.js';
import {
  PROGRAM_IDENTIFIER,
  type Program,
} from './application/program.js';
import { CliApplication } from './application/cli-application.js';
import { GenerateCommand } from './commands/generate-command.js';
import { GenerateDocumentationUseCase } from './usecases/generate-documentation.usecase.js';
import { LoggerService } from './logger/logger.service.js';
import { FilePackageService } from './package/file-package.service.js';
import { Command as CommanderCommand } from 'commander';
import { TextLoggerAdapter } from './logger/adapters/text-logger.adapter.js';
import { JsonLoggerAdapter } from './logger/adapters/json-logger.adapter.js';
import { GitHubActionLoggerAdapter } from './logger/adapters/github-action-logger.adapter.js';
import { ProgramConfiguratorService } from './application/program-configurator.service.js';

let container: Container | null = null;

/**
 * Resets the container singleton for testing purposes
 */
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

  // Return early if services are already bound
  if (container.isBound(LOGGER_ADAPTER_IDENTIFIER)) {
    return container;
  }

  // Bind logging-specific services
  container.bind(LoggerService).toSelf().inSingletonScope();

  container.bind<LoggerAdapter>(LOGGER_ADAPTER_IDENTIFIER)
    .to(TextLoggerAdapter)
    .inSingletonScope();

  container.bind<LoggerAdapter>(LOGGER_ADAPTER_IDENTIFIER)
    .to(JsonLoggerAdapter)
    .inSingletonScope();

  container.bind<LoggerAdapter>(LOGGER_ADAPTER_IDENTIFIER)
    .to(GitHubActionLoggerAdapter)
    .inSingletonScope();

  // Bind CLI-specific services
  container.bind(ProgramConfiguratorService).toSelf().inSingletonScope();

  container.bind<PackageService>(PACKAGE_SERVICE_IDENTIFIER)
    .to(FilePackageService)
    .inSingletonScope();

  container
    .bind<Program>(PROGRAM_IDENTIFIER)
    .toConstantValue(new CommanderCommand());

  // Bind use cases
  container.bind(GenerateDocumentationUseCase).toSelf().inSingletonScope();

  // Bind commands (using multiInject pattern)
  container
    .bind<Command>(COMMAND_IDENTIFIER)
    .to(GenerateCommand)
    .inSingletonScope();

  // Bind the main application
  container.bind(CliApplication).toSelf().inSingletonScope();

  return container;
}
