import {
    createReadStream,
    existsSync,
    writeFile,
    writeFileSync,
} from 'node:fs';
import { createInterface } from 'node:readline';
import { injectable } from 'inversify';
import { AbstractRendererAdapter } from './abstract-renderer.adapter.js';


@injectable()
export class FileRendererAdapter extends AbstractRendererAdapter {
    private static readonly fileLocks = new Map<string, Promise<void>>();

    async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
        await this.safeWriteWithLock(async () => {
            return this.performWriteSection(sectionIdentifier, data);
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


    private performWriteSection(sectionIdentifier: string, data: Buffer): Promise<void> {
        const destination = this.getDestination();
        const formatterAdapter = this.getFormatterAdapter();

        // Look for the section in the file, replace content if it exists, or append if it doesn't.

        // Read file line by line to find the section
        return new Promise((resolve, reject) => {
            if (!existsSync(destination)) {
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
            let output: Buffer = Buffer.alloc(0);

            const sectionStart = this.getSectionStart(sectionIdentifier);
            const sectionEnd = this.getSectionEnd(sectionIdentifier);

            const sectionContent = Buffer.concat([
                sectionStart,
                ...(data.length ? [data, formatterAdapter.lineBreak()] : []),
                sectionEnd,
            ]);

            const sectionStartString = sectionStart.toString();
            const sectionEndString = sectionEnd.toString();

            readLine.on('line', (line) => {
                const isSectionStart = line.trim() === sectionStartString.trim();
                if (isSectionStart) {
                    sectionFound = true;
                    inSection = true;
                    output = Buffer.concat([output, sectionContent]);
                    return;
                }

                const isSectionEnd = line.trim() === sectionEndString.trim();
                if (isSectionEnd && inSection) {
                    inSection = false;
                    // Skip the end marker as it's already included above
                    return;
                }

                if (!inSection) {
                    output = Buffer.concat([output, Buffer.from(line), formatterAdapter.lineBreak()]);
                }
                // Skip lines inside the section (they get replaced)
            });

            readLine.on('close', () => {
                if (!sectionFound) {
                    output = Buffer.concat([output, sectionContent]);
                }
                writeFile(destination, output, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
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
}
