import { Container as InversifyContainer } from "inversify";
import { GeneratorService } from "./generator/generator.service.js";
import { FormatterService } from "./formatter/formatter.service.js";
import { MarkdownFormatterAdapter } from "./formatter/markdown-formatter.adapter.js";
import { FORMATTER_ADAPTER_IDENTIFIER } from "./formatter/formatter.adapter.js";
import { RepositoryService } from "./repository/repository.service.js";

export type Container = InversifyContainer;

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

    // Bind core services only - no dependencies on other packages
    container.bind(FormatterService).toSelf().inSingletonScope();
    container.bind(GeneratorService).toSelf().inSingletonScope();
    container.bind(RepositoryService).toSelf().inSingletonScope();

    // Formatter adapters
    container.bind(MarkdownFormatterAdapter).toSelf().inSingletonScope();
    container
        .bind<MarkdownFormatterAdapter>(FORMATTER_ADAPTER_IDENTIFIER)
        .to(MarkdownFormatterAdapter);

    return container;
}