import { injectable } from 'inversify';
import { ReaderAdapter, ReadableContent } from './reader.adapter.js';
import { createReadStream, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

@injectable()
export class FileReaderAdapter implements ReaderAdapter {

    resourceExists(path: string): boolean {
        return this.getStat(path)?.isFile() ?? false;
    }

    async readResource(path: string): Promise<ReadableContent> {
        if (!this.resourceExists(path)) {
            return Buffer.alloc(0);
        }

        return new Promise((resolve, reject) => {
            const fileStream = createReadStream(path);
            const chunks: ReadableContent[] = [];

            fileStream.on('data', (chunk: string | ReadableContent) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });

            fileStream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            fileStream.on('error', (err) => {
                reject(err);
            });
        });
    }

    containerExists(path: string): boolean {
        return this.getStat(path)?.isDirectory() ?? false;
    }

    async readContainer(path: string): Promise<string[]> {
        // Fast-path: if container doesn't exist, return empty list.
        if (!this.containerExists(path)) {
            return [];
        }

        // Use readdirSync withDirent to avoid extra stat calls per entry.
        // Synchronous call is acceptable here because adapters are expected
        // to be IO-bound and callers can decide to run concurrently if
        // needed. This avoids allocating extra promises per child and keeps
        // memory overhead low for large directories.
        const entries = readdirSync(path, { withFileTypes: true });
        const results: string[] = [];

        for (const dirent of entries) {
            // Only include files and (optionally) non-hidden entries.
            // We include both files and directories because callers may
            // expect containerChildren to contain both kinds of resources.
            // If callers only want files they can filter themselves; this
            // keeps the adapter fast and simple.
            if (dirent.name === '.' || dirent.name === '..') continue;
            results.push(join(path, dirent.name));
        }

        return results;
    }

    private getStat(path: string): { isFile: () => boolean, isDirectory: () => boolean } | undefined {
        if (!existsSync(path)) {
            return undefined;
        }
        return statSync(path);
    }
}