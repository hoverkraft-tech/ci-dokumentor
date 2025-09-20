import { Readable } from "node:stream";

export const READER_ADAPTER_IDENTIFIER = Symbol('ReaderAdapter');

export type ReadableContent = Readable;

export interface ReaderAdapter {
    getContent(path: string): Promise<ReadableContent>;
}

/**
 * Utility function to convert ReadableContent to Buffer
 * This bridges the gap between stream-based reading and buffer-based processing
 */
export async function readableToBuffer(readable: ReadableContent): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        readable.on('data', (chunk: string | Buffer) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        readable.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        readable.on('error', (err) => {
            reject(err);
        });
    });
}