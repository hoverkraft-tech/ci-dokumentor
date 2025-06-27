import { Container as InversifyContainer } from "inversify";
import { GeneratorService } from "./generator/generator.service.js";
import { FormatterService } from "./formatter/formatter.service.js";
import { MarkdownFormatterAdapter } from "./formatter/markdown-formatter.adapter.js";
import { FORMATTER_ADAPTER_IDENTIFIER } from "./formatter/formatter.adapter.js";

export type Container = InversifyContainer;

let container: Container | null = null;

export function initContainer(): Container {
    if (container) {
        return container;
    }

    container = new InversifyContainer();

    // Bind services
    container.bind(FormatterService).toSelf().inSingletonScope();
    container.bind(GeneratorService).toSelf().inSingletonScope();

    // Formatter adapters
    container.bind(MarkdownFormatterAdapter).toSelf().inSingletonScope();
    container
        .bind<MarkdownFormatterAdapter>(FORMATTER_ADAPTER_IDENTIFIER)
        .to(MarkdownFormatterAdapter);

    return container;
}