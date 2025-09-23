import { Container as InversifyContainer } from 'inversify';
import { GeneratorService } from './generator/generator.service.js';
import { FormatterService } from './formatter/formatter.service.js';
import { MarkdownFormatterAdapter } from './formatter/markdown/markdown-formatter.adapter.js';
import { FORMATTER_ADAPTER_IDENTIFIER } from './formatter/formatter.adapter.js';
import { RepositoryService } from './repository/repository.service.js';
import { LicenseService } from './license/license.service.js';
import { FileRendererAdapter } from './renderer/file-renderer.adapter.js';
import { DiffRendererAdapter } from './renderer/diff-renderer.adapter.js';
import { FileReaderAdapter } from './reader/file-reader.adapter.js';
import { VersionService } from './version/version.service.js';
import { MigrationService } from './migration/migration.service.js';
import { MarkdownTableGenerator } from './formatter/markdown/markdown-table.generator.js';
import { MarkdownLinkGenerator } from './formatter/markdown/markdown-link.generator.js';

export type Container = InversifyContainer;

let container: Container | null = null;

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
    container = new InversifyContainer();
  }

  // Return early if services are already bound
  if (container.isBound(FormatterService)) {
    return container;
  }

  // Bind core services only - no dependencies on other packages
  container.bind(FormatterService).toSelf().inSingletonScope();
  container.bind(GeneratorService).toSelf().inSingletonScope();
  container.bind(FileReaderAdapter).toSelf().inSingletonScope();
  container.bind(FileRendererAdapter).toSelf().inSingletonScope();
  container.bind(DiffRendererAdapter).toSelf().inSingletonScope();
  container.bind(RepositoryService).toSelf().inSingletonScope();
  container.bind(LicenseService).toSelf().inSingletonScope();
  container.bind(VersionService).toSelf().inSingletonScope();
  container.bind(MigrationService).toSelf().inSingletonScope();

  // Formatter adapters
  container.bind(MarkdownLinkGenerator).toSelf().inSingletonScope();
  container.bind(MarkdownTableGenerator).toSelf().inSingletonScope();
  container.bind(MarkdownFormatterAdapter).toSelf().inSingletonScope();
  container
    .bind<MarkdownFormatterAdapter>(FORMATTER_ADAPTER_IDENTIFIER)
    .to(MarkdownFormatterAdapter);

  return container;
}
