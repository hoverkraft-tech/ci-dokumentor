import { RendererAdapter } from "./renderer.adapter.js";
import { FormatterAdapter } from "../formatter/formatter.adapter.js";
import { ReadableContent } from "../reader/reader.adapter.js";

export abstract class AbstractRendererAdapter implements RendererAdapter {
    private destination?: string;
    private formatterAdapter?: FormatterAdapter;

    async initialize(destination: string, formatterAdapter: FormatterAdapter): Promise<void> {
        if (this.destination) {
            throw new Error('Destination is already initialized');
        }
        if (this.formatterAdapter) {
            throw new Error('Formatter Adapter is already initialized');
        }

        this.destination = destination;
        this.formatterAdapter = formatterAdapter;
    }

    getFormatterAdapter(): FormatterAdapter {
        if (!this.formatterAdapter) {
            throw new Error('Formatter Adapter not initialized');
        }
        return this.formatterAdapter;
    }

    getDestination(): string {
        if (!this.destination) {
            throw new Error('Destination not initialized');
        }
        return this.destination;
    }

    abstract writeSection(sectionIdentifier: string, data: ReadableContent): Promise<void>;

    abstract replaceContent(data: ReadableContent): Promise<void>;

    async finalize(): Promise<string | undefined> {
        // Reset initialized parameters
        this.destination = undefined;
        this.formatterAdapter = undefined;
        return undefined;
    }
}