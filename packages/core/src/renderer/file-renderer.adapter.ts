import {
    createReadStream,
    existsSync,
    writeFile,
    writeFileSync,
} from 'node:fs';
import { createInterface } from 'node:readline';
import { RenderSectionData } from './renderer.adapter.js';
import { injectable } from 'node_modules/inversify/lib/cjs/index.js';
import { AbstractRendererAdapter } from './abstract-renderer.adapter.js';



@injectable()
export class FileRendererAdapter extends AbstractRendererAdapter {
    private static readonly fileLocks = new Map<string, Promise<void>>();

    async writeSection(renderSectionData: RenderSectionData): Promise<void> {
        // Serialize access to the same file to prevent race conditions
        const existingLock = FileRendererAdapter.fileLocks.get(renderSectionData.destination);

        const operation = async () => {
            return this.performWriteSection(renderSectionData);
        };

        const lockPromise = existingLock
            ? existingLock.then(operation)
            : operation();
        FileRendererAdapter.fileLocks.set(renderSectionData.destination, lockPromise);

        try {
            await lockPromise;
        } finally {
            // Clean up the lock if this was the last operation
            if (FileRendererAdapter.fileLocks.get(renderSectionData.destination) === lockPromise) {
                FileRendererAdapter.fileLocks.delete(renderSectionData.destination);
            }
        }
    }

    private performWriteSection(renderSectionData: RenderSectionData): Promise<void> {
        // Look for the section in the file, replace content if it exists, or append if it doesn't.

        // Read file line by line to find the section
        return new Promise((resolve, reject) => {
            if (!existsSync(renderSectionData.destination)) {
                writeFileSync(renderSectionData.destination, '');
            }

            const fileStream = createReadStream(renderSectionData.destination);

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

            const sectionStart = this.getSectionStart(renderSectionData);
            const sectionEnd = this.getSectionEnd(renderSectionData);

            const sectionContent = Buffer.concat([
                sectionStart,
                ...(renderSectionData.data.length ? [renderSectionData.data, renderSectionData.formatterAdapter.lineBreak()] : []),
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
                    output = Buffer.concat([output, Buffer.from(line), renderSectionData.formatterAdapter.lineBreak()]);
                }
                // Skip lines inside the section (they get replaced)
            });

            readLine.on('close', () => {
                if (!sectionFound) {
                    output = Buffer.concat([output, sectionContent]);
                }
                writeFile(renderSectionData.destination, output, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }
}
