import { FormatterAdapter } from "../formatter/formatter.adapter.js";

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

    writeSection(sectionIdentifier: string, data: Buffer): Promise<void>;

    /**
     * Read existing content from the destination.
     * Returns empty Buffer if destination doesn't exist or has no content.
     * This method is agnostic to the storage mechanism (file, memory, etc.)
     */
    readExistingContent(): Promise<Buffer>;

    /**
     * Replace the entire content at the destination with the provided data.
     * This is useful for migration scenarios where the entire content needs
     * to be transformed and replaced, rather than appending sections.
     */
    replaceContent(data: Buffer): Promise<void>;

    /**
     * Finalize the rendering process and cleanup initialization.
     * @return A promise that resolves to an optional string (for example a diff)
     */
    finalize(): Promise<string | undefined>;
}
