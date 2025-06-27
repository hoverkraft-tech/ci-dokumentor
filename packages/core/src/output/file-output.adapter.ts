import { createReadStream, existsSync, writeFile, writeFileSync } from "node:fs";
import { OutputAdapter } from "./output.adapter.js";
import { createInterface } from "node:readline";
import { FormatterAdapter } from "../formatter/formatter.adapter.js";


export class FileOutputAdapter implements OutputAdapter {
    private static readonly fileLocks = new Map<string, Promise<void>>();

    constructor(
        private readonly filePath: string,
        private readonly formatter: FormatterAdapter
    ) {
    }

    async writeSection(sectionIdentifier: string, data: Buffer): Promise<void> {
        // Serialize access to the same file to prevent race conditions
        const existingLock = FileOutputAdapter.fileLocks.get(this.filePath);

        const operation = async () => {
            return this.performWriteSection(sectionIdentifier, data);
        };

        const lockPromise = existingLock ? existingLock.then(operation) : operation();
        FileOutputAdapter.fileLocks.set(this.filePath, lockPromise);

        try {
            await lockPromise;
        } finally {
            // Clean up the lock if this was the last operation
            if (FileOutputAdapter.fileLocks.get(this.filePath) === lockPromise) {
                FileOutputAdapter.fileLocks.delete(this.filePath);
            }
        }
    }

    private performWriteSection(sectionIdentifier: string, data: Buffer): Promise<void> {
        // Look for the section in the file, replace content if it exists, or append if it doesn't.

        // Read file line by line to find the section
        return new Promise((resolve, reject) => {
            if (!existsSync(this.filePath)) {
                writeFileSync(this.filePath, '');
            }

            const fileStream = createReadStream(this.filePath);

            // Handle file read errors (like file not found)
            fileStream.on('error', (err) => {
                reject(err);
            });

            const readLine = createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let sectionFound = false;
            let inSection = false;
            const output: Buffer[] = [];

            const sectionStart = this.getSectionStart(sectionIdentifier).toString();
            const sectionEnd = this.getSectionEnd(sectionIdentifier).toString();

            if (data.length > 0) {
                // Ensure the data is properly formatted
                data = Buffer.concat([
                    Buffer.from("\n"),
                    data,
                    Buffer.from("\n"),
                ]);
            }

            const sectionContent = Buffer.concat([
                this.formatter.comment(Buffer.from(`${sectionIdentifier}:start`)),
                data,
                this.formatter.comment(Buffer.from(`${sectionIdentifier}:end`))
            ])

            readLine.on('line', (line) => {
                if (line.trim() === sectionStart.trim()) {
                    sectionFound = true;
                    inSection = true;
                    output.push(sectionContent);
                } else if (line.trim() === sectionEnd.trim() && inSection) {
                    inSection = false;
                    // Skip the end marker as it's already included above
                    return;
                } else if (!inSection) {
                    output.push(Buffer.from(line + '\n'));
                }
                // Skip lines inside the section (they get replaced)
            });

            readLine.on('close', () => {
                if (!sectionFound) {
                    output.push(sectionContent);
                }
                writeFile(this.filePath, Buffer.concat(output), (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }

    private getSectionStart(sectionIdentifier: string): Buffer {
        return this.formatter.comment(Buffer.from(`${sectionIdentifier}:start`));
    }

    private getSectionEnd(sectionIdentifier: string): Buffer {
        return this.formatter.comment(Buffer.from(`${sectionIdentifier}:end`));
    }
}
