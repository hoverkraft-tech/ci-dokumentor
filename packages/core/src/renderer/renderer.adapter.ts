import { FormatterAdapter } from "src/formatter/formatter.adapter.js";

/**
 * RendererAdapter is responsible for producing an OutputAdapter tied to a
 * destination and performing any finalization steps after generation
 * (for example: persisting to disk, calculating diffs, printing results).
 *
 * Lifecycle:
 *  - initialize(destination, formatterAdapter)  // prepare adapter for a single rendering target
 *  - writeSection(sectionIdentifier, data)      // write successive sections
 *  - finalize()                                 // finalize and cleanup
 */
export interface RendererAdapter {
    initialize(destination: string, formatterAdapter: FormatterAdapter): Promise<void>;

    getFormatterAdapter(): FormatterAdapter;

    writeSection(sectionIdentifier: string, data: Buffer): Promise<void>;

    /**
     * Finalize the rendering process and cleanup initialization.
     * @return A promise that resolves to an optional string (for example a diff)
     */
    finalize(): Promise<string | undefined>;
}
