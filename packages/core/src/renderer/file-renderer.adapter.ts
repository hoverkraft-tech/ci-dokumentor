import {
    createReadStream,
    writeFile,
    writeFileSync,
} from 'node:fs';
import { createInterface } from 'node:readline';
import { injectable, inject } from 'inversify';
import { SectionIdentifier } from '../generator/section/section-generator.adapter.js';
import type { ReaderAdapter } from '../reader/reader.adapter.js';
import { FileReaderAdapter } from '../reader/file-reader.adapter.js';
import { ReadableContent } from '../reader/readable-content.js';
import { AbstractRendererAdapter } from './abstract-renderer.adapter.js';


@injectable()
export class FileRendererAdapter extends AbstractRendererAdapter {
    private static readonly fileLocks = new Map<string, Promise<void>>();

    constructor(@inject(FileReaderAdapter) private readonly readerAdapter: ReaderAdapter) {
        super();
    }

    async replaceContent(content: ReadableContent): Promise<void> {
        await this.safeWriteWithLock(async () => {
            return this.performReplaceContent(content);
        });
    }

    async writeSection(sectionIdentifier: SectionIdentifier, content: ReadableContent): Promise<void> {
        await this.safeWriteWithLock(async () => {
            return this.performWriteSection(sectionIdentifier, content);
        });
    }

    override async finalize(): Promise<string | undefined> {
        // Release locks
        const lockPromise = this.getExistingLock();
        if (lockPromise) {
            await lockPromise.then();
        }

        await super.finalize();

        return undefined;
    }

    private performReplaceContent(content: ReadableContent): Promise<void> {
        const destination = this.getDestination();

        return new Promise((resolve, reject) => {
            writeFile(destination, content.toString(), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private performWriteSection(sectionIdentifier: SectionIdentifier, content: ReadableContent): Promise<void> {
        const destination = this.getDestination();
        const formatterAdapter = this.getFormatterAdapter();

        const sectionContent = formatterAdapter.section(
            sectionIdentifier,
            content
        );

        const sectionStart = formatterAdapter.sectionStart(sectionIdentifier);
        const sectionEnd = formatterAdapter.sectionEnd(sectionIdentifier);


        // Look for the section in the file, replace content if it exists, or append if it doesn't.
        // Read file line by line to find the section
        return new Promise((resolve, reject) => {
            try {
                if (!this.readerAdapter.resourceExists(destination)) {
                    writeFileSync(destination, '');
                }

                const fileStream = createReadStream(destination);

                // Handle file read errors (like file not found)
                fileStream.on('error', (err) => {
                    reject(err);
                });

                const readLine = createInterface({
                    input: fileStream,
                    crlfDelay: Infinity,
                });

                let sectionFound = false;
                let inSection = false;
                let output = ReadableContent.empty();

                readLine.on('line', (line) => {
                    const isSectionStart = sectionStart.equals(line.trim());
                    if (isSectionStart) {
                        sectionFound = true;
                        inSection = true;
                        output = output.append(sectionContent);
                        return;
                    }

                    const isSectionEnd = sectionEnd.equals(line.trim());
                    if (isSectionEnd && inSection) {
                        inSection = false;
                        // Skip the end marker as it's already included above
                        return;
                    }

                    if (!inSection) {
                        output = output.append(line, formatterAdapter.lineBreak());
                    }
                    // Skip lines inside the section (they get replaced)
                });

                readLine.on('close', () => {
                    if (!sectionFound) {
                        output = output.append(sectionContent);
                    }
                    writeFile(destination, output.toString(), (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    private async safeWriteWithLock(operation: () => Promise<void>) {
        const destination = this.getDestination();

        // Serialize access to the same file to prevent race conditions
        const existingLock = this.getExistingLock();

        const lockPromise = existingLock
            ? existingLock.then(operation)
            : operation();

        FileRendererAdapter.fileLocks.set(destination, lockPromise);

        try {
            await lockPromise;
        } finally {
            // Clean up the lock if this was the last operation
            if (FileRendererAdapter.fileLocks.get(destination) === lockPromise) {
                FileRendererAdapter.fileLocks.delete(destination);
            }
        }
    }

    private getExistingLock(): Promise<void> | undefined {
        return FileRendererAdapter.fileLocks.get(this.getDestination());
    }

    async getExistingContent(): Promise<ReadableContent> {
        const destination = this.getDestination();
        return this.readerAdapter.readResource(destination);
    }
}
