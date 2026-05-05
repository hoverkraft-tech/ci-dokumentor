import { Container as InversifyContainer } from 'inversify';
import { GeneratorService } from './generator/generator.service.js';
import { FormatterService } from './formatter/formatter.service.js';
import { MarkdownFormatterAdapter } from './formatter/markdown/markdown-formatter.adapter.js';
import { FORMATTER_ADAPTER_IDENTIFIER } from './formatter/formatter.adapter.js';
import { RepositoryService } from './repository/repository.service.js';
import {
  LicenseService,
  LICENSE_SERVICE_IDENTIFIER,
} from './license/license.service.js';
import { FileRendererAdapter } from './renderer/file-renderer.adapter.js';
import { DiffRendererAdapter } from './renderer/diff-renderer.adapter.js';
import {
  FileReaderAdapter,
  FILE_READER_ADAPTER_IDENTIFIER,
} from './reader/file-reader.adapter.js';
import {
  VersionService,
  VERSION_SERVICE_IDENTIFIER,
} from './version/version.service.js';
import { MigrationService } from './migration/migration.service.js';
import { ConcurrencyService } from './concurrency/concurrency.service.js';
import { MarkdownTableGenerator } from './formatter/markdown/markdown-table.generator.js';
import { MarkdownLinkGenerator } from './formatter/markdown/markdown-link.generator.js';
import { MarkdownCodeGenerator } from './formatter/markdown/markdown-code.generator.js';
import { RENDERER_FACTORY_IDENTIFIER, containerRendererFactory, RendererFactory } from './renderer/renderer.factory.js';

export type Container = InversifyContainer;

let container: Container | null = null;

export function resetContainer(): void {
  container = null;
}

export function initContainer(
  baseContainer: Container | undefined = undefined
): Container {
  const targetContainer = baseContainer ?? (container ??= new InversifyContainer());

  // Return early if this package has already been initialized in this container.
  if (targetContainer.isCurrentBound(FormatterService)) {
    return targetContainer;
  }

  // Bind core services only - no dependencies on other packages
  targetContainer.bind(FormatterService).toSelf().inSingletonScope();
  targetContainer.bind(GeneratorService).toSelf().inSingletonScope();
  targetContainer.bind(FileReaderAdapter).toSelf().inSingletonScope();
  targetContainer.bind(FILE_READER_ADAPTER_IDENTIFIER).toService(FileReaderAdapter);
  targetContainer.bind(FileRendererAdapter).toSelf().inTransientScope();
  targetContainer.bind(DiffRendererAdapter).toSelf().inTransientScope();
  targetContainer.bind<RendererFactory>(RENDERER_FACTORY_IDENTIFIER).toFactory(containerRendererFactory);
  targetContainer.bind(RepositoryService).toSelf().inSingletonScope();
  targetContainer.bind(LicenseService).toSelf().inSingletonScope();
  targetContainer.bind(LICENSE_SERVICE_IDENTIFIER).toService(LicenseService);
  targetContainer.bind(VersionService).toSelf().inSingletonScope();
  targetContainer.bind(VERSION_SERVICE_IDENTIFIER).toService(VersionService);
  targetContainer.bind(MigrationService).toSelf().inSingletonScope();
  targetContainer.bind(ConcurrencyService).toSelf().inSingletonScope();

  // Formatter adapters
  targetContainer.bind(MarkdownLinkGenerator).toSelf().inSingletonScope();
  targetContainer.bind(MarkdownTableGenerator).toSelf().inSingletonScope();
  targetContainer.bind(MarkdownCodeGenerator).toSelf().inSingletonScope();
  targetContainer.bind(MarkdownFormatterAdapter).toSelf().inSingletonScope();
  targetContainer
    .bind<MarkdownFormatterAdapter>(FORMATTER_ADAPTER_IDENTIFIER)
    .toService(MarkdownFormatterAdapter);

  return targetContainer;
}
