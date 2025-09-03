import { AbstractRendererAdapter } from './abstract-renderer.adapter.js';
import { createPatch } from 'diff';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { injectable, inject } from 'inversify';
import { FileRendererAdapter } from './file-renderer.adapter.js';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { FormatterAdapter } from '../formatter/formatter.adapter.js';

@injectable()
export class DiffRendererAdapter extends AbstractRendererAdapter {
    private tempFilePath?: string;

    constructor(@inject(FileRendererAdapter) private readonly fileRenderer: FileRendererAdapter) {
        super();
    }

    override async initialize(destination: string, formatterAdapter: FormatterAdapter): Promise<void> {
        await super.initialize(destination, formatterAdapter);

        const tempFilePath = this.getTempFilePath();

        // Initialize inner file renderer with temp file
        await this.fileRenderer.initialize(tempFilePath, formatterAdapter);
    }

    async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
        if (!this.tempFilePath) { throw new Error('Temp file path not initialized'); }
        // Delegate to the inner file renderer which targets the temp file
        await this.fileRenderer.writeSection(sectionIdentifier, data);
    }

    override async finalize(): Promise<string | undefined> {
        const destination = this.getDestination();
        const temp = this.getTempFilePath();

        // Produce patch between destination and temp
        const diff = createPatch(
            destination,
            existsSync(destination) ? readFileSync(destination, 'utf-8') : '',
            readFileSync(temp, 'utf-8'),
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
