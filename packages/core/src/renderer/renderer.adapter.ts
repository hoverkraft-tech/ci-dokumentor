import { FormatterAdapter } from "../formatter/formatter.adapter.js";
import { ReadableContent } from "../reader/reader.adapter.js";

/**
 * RendererAdapter is responsible for producing an OutputAdapter tied to a
 * destination and performing any finalization steps after generation
 * (for example: persisting to disk, calculating diffs, printing results).
 *
 * Lifecycle:
 *  - initialize(destination, formatterAdapter)  // prepare adapter for a single rendering target
 *  - writeSection(sectionIdentifier, data)      // write successive sections
 *  - replaceContent(data)                       // replace entire content (for migrations)
 *  - finalize()                                 // finalize and cleanup
 */
export interface RendererAdapter {
    initialize(destination: string, formatterAdapter: FormatterAdapter): Promise<void>;

    getFormatterAdapter(): FormatterAdapter;

    getDestination(): string;

    writeSection(sectionIdentifier: string, data: ReadableContent): Promise<void>;

    /**
     * Replace the entire content at the destination with the provided data.
     * This is useful for migration scenarios where the entire content needs
     * to be transformed and replaced, rather than appending sections.
     */
    replaceContent(data: ReadableContent): Promise<void>;

    /**
     * Finalize the rendering process and cleanup initialization.
     * @return A promise that resolves to an optional string (for example a diff)
     */
    finalize(): Promise<string | undefined>;
}
