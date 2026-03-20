import { Container } from '@ci-dokumentor/core';
import { Container as InversifyContainer } from 'inversify';
import { Command as CommanderCommand } from 'commander';
import {
  COMMAND_IDENTIFIER

} from './commands/command.js';
import type { Command } from './commands/command.js';
import {
  LOGGER_ADAPTER_IDENTIFIER

} from './logger/adapters/logger.adapter.js';
import type { LoggerAdapter } from './logger/adapters/logger.adapter.js';
import {
  PACKAGE_SERVICE_IDENTIFIER

} from './package/package-service.js';
import type { PackageService } from './package/package-service.js';
import {
  PROGRAM_IDENTIFIER

} from './application/program.js';
import type { Program } from './application/program.js';
import { CliApplication } from './application/cli-application.js';
import { GenerateCommand } from './commands/generate-command.js';
import { MigrateCommand } from './commands/migrate-command.js';
import { GenerateDocumentationUseCase } from './usecases/generate-documentation.usecase.js';
import { MigrateDocumentationUseCase } from './usecases/migrate-documentation.usecase.js';
import { LoggerService } from './logger/logger.service.js';
import { FilePackageService } from './package/file-package.service.js';
import { TextLoggerAdapter } from './logger/adapters/text-logger.adapter.js';
import { JsonLoggerAdapter } from './logger/adapters/json-logger.adapter.js';
import { GITHUB_OUTPUT_IDENTIFIER, GitHubActionLoggerAdapter } from './logger/adapters/github-action-logger.adapter.js';
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
  const targetContainer = baseContainer ?? (container ??= new InversifyContainer() as Container);

  // Return early if this package has already been initialized in this container.
  if (targetContainer.isCurrentBound(LOGGER_ADAPTER_IDENTIFIER)) {
    return targetContainer;
  }

  // Bind logging-specific services
  targetContainer.bind(LoggerService).toSelf().inSingletonScope();

  targetContainer.bind<LoggerAdapter>(LOGGER_ADAPTER_IDENTIFIER)
    .to(TextLoggerAdapter)
    .inSingletonScope();

  targetContainer.bind<LoggerAdapter>(LOGGER_ADAPTER_IDENTIFIER)
    .to(JsonLoggerAdapter)
    .inSingletonScope();

  targetContainer.bind(GITHUB_OUTPUT_IDENTIFIER).toConstantValue(process.env.GITHUB_OUTPUT);
  targetContainer.bind<LoggerAdapter>(LOGGER_ADAPTER_IDENTIFIER)
    .to(GitHubActionLoggerAdapter)
    .inSingletonScope();

  // Bind CLI-specific services
  targetContainer.bind(ProgramConfiguratorService).toSelf().inSingletonScope();

  targetContainer.bind<PackageService>(PACKAGE_SERVICE_IDENTIFIER)
    .to(FilePackageService)
    .inSingletonScope();

  targetContainer
    .bind<Program>(PROGRAM_IDENTIFIER)
    .toConstantValue(new CommanderCommand());

  // Bind use cases
  targetContainer.bind(GenerateDocumentationUseCase).toSelf().inSingletonScope();
  targetContainer.bind(MigrateDocumentationUseCase).toSelf().inSingletonScope();

  // Bind commands (using multiInject pattern)
  targetContainer
    .bind<Command>(COMMAND_IDENTIFIER)
    .to(GenerateCommand)
    .inSingletonScope();

  targetContainer
    .bind<Command>(COMMAND_IDENTIFIER)
    .to(MigrateCommand)
    .inSingletonScope();

  // Bind the main application
  targetContainer.bind(CliApplication).toSelf().inSingletonScope();

  return targetContainer;
}
