import { injectable, inject } from 'inversify';
import { READER_ADAPTER_IDENTIFIER, readableToBuffer } from '../reader/reader.adapter.js';
import type { ReaderAdapter } from '../reader/reader.adapter.js';
import { existsSync } from 'node:fs';

/**
 * Service that provides content reading functionality for renderers
 * This bridges the RendererAdapter interface with the ReaderAdapter pattern
 */
@injectable()
export class RendererService {
    constructor(@inject(READER_ADAPTER_IDENTIFIER) private readonly readerAdapter: ReaderAdapter) {
    }

    /**
     * Read existing content from a destination path
     * Returns empty Buffer if destination doesn't exist or has no content
     */
    async readExistingContent(destination: string): Promise<Buffer> {
        if (!existsSync(destination)) {
            return Buffer.alloc(0);
        }

        const stream = await this.readerAdapter.getContent(destination);
        return readableToBuffer(stream);
    }
}