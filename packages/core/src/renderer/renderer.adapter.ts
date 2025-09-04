import { FormatterAdapter } from "src/formatter/formatter.adapter.js";

export type RenderSectionData = {
    formatterAdapter: FormatterAdapter;
    destination: string;
    sectionIdentifier: string;
    data: Buffer;
}

/**
 * RendererAdapter is responsible for producing an OutputAdapter tied to a
 * destination and performing any finalization steps after generation
 * (for example: persisting to disk, calculating diffs, printing results).
 */
export interface RendererAdapter {
    writeSection(data: RenderSectionData): Promise<void>
}
