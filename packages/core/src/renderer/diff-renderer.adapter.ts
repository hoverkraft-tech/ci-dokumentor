import { AbstractRendererAdapter } from './abstract-renderer.adapter.js';
import { createPatch } from 'diff';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { injectable, inject } from 'inversify';
import { FileRendererAdapter } from './file-renderer.adapter.js';
import { unlinkSync } from 'node:fs';
import { FileReaderAdapter } from '../reader/file-reader.adapter.js';
import type { ReaderAdapter } from '../reader/reader.adapter.js';
import { FormatterAdapter } from '../formatter/formatter.adapter.js';
import { SectionIdentifier } from '../generator/section-generator.adapter.js';
import { ReadableContent } from '../reader/reader.adapter.js';

@injectable()
export class DiffRendererAdapter extends AbstractRendererAdapter {
    private tempFilePath?: string;

    constructor(
        @inject(FileRendererAdapter) private readonly fileRenderer: FileRendererAdapter,
        @inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter
    ) {
        super();
    }

    override async initialize(destination: string, formatterAdapter: FormatterAdapter): Promise<void> {
        await super.initialize(destination, formatterAdapter);

        const tempFilePath = this.getTempFilePath();

        // Initialize inner file renderer with temp file
        await this.fileRenderer.initialize(tempFilePath, formatterAdapter);
    }

    async writeSection(sectionIdentifier: SectionIdentifier, data: ReadableContent): Promise<void> {
        await this.fileRenderer.writeSection(sectionIdentifier, data);
    }

    async replaceContent(data: ReadableContent): Promise<void> {
        return this.fileRenderer.replaceContent(data);
    }

    override async finalize(): Promise<string | undefined> {
        const destination = this.getDestination();
        const temp = this.getTempFilePath();

        // Produce patch between destination and temp
        const destinationContent = this.readerAdapter.resourceExists(destination)
            ? await this.readerAdapter.readResource(destination)
            : undefined;

        const tempContent = await this.fileRenderer.getExistingContent();

        const diff = createPatch(
            destination,
            destinationContent ? destinationContent.toString('utf-8') : '',
            tempContent.toString('utf-8'),
        );

        // Reset initialized parameters
        await this.fileRenderer.finalize();
        await super.finalize();
        unlinkSync(temp);
        this.tempFilePath = undefined;

        return diff;
    }

    private getTempFilePath(): string {
        if (this.tempFilePath) {
            return this.tempFilePath;
        }

        const base = basename(this.getDestination());
        const name = `${base}.${Date.now()}.tmp`;
        return this.tempFilePath = join(tmpdir(), name);
    }
}
