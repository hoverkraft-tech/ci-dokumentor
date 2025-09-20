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

/**
 * Utility function to convert ReadableContent directly to string
 * This is more efficient than converting to buffer first when only string is needed
 */
export async function readableToString(readable: ReadableContent, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: string[] = [];

        readable.setEncoding(encoding);

        readable.on('data', (chunk: string) => {
            chunks.push(chunk);
        });

        readable.on('end', () => {
            resolve(chunks.join(''));
        });

        readable.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Utility function to convert Buffer to ReadableContent
 * This allows converting buffer data to stream format when needed
 */
export function bufferToReadable(buffer: Buffer): ReadableContent {
    return Readable.from(buffer);
}