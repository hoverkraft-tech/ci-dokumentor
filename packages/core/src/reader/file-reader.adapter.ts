import { injectable } from 'inversify';
import { ReaderAdapter, ReadableContent } from './reader.adapter.js';
import { createReadStream } from 'node:fs';

@injectable()
export class FileReaderAdapter implements ReaderAdapter {
    getContent(path: string): ReadableContent {
        return createReadStream(path);
    }
}