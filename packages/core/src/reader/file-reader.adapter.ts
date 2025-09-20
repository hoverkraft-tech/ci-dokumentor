import { injectable } from 'inversify';
import { ReaderAdapter, ReadableContent } from './reader.adapter.js';
import { createReadStream } from 'node:fs';

@injectable()
export class FileReaderAdapter implements ReaderAdapter {
    async getContent(path: string): Promise<ReadableContent> {
        return createReadStream(path);
    }
}