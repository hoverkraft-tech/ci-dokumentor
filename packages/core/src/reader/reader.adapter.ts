
export const READER_ADAPTER_IDENTIFIER = Symbol('ReaderAdapter');

export type ReadableContent = {
    isEmpty(): boolean;
    match(pattern: RegExp): RegExpMatchArray | null;
    extract(start: number, end?: number): ReadableContent;
    trim(): ReadableContent;
    endsWith(content: ReadableContent): boolean;
    append(...contents: ReadableContent[]): ReadableContent;
};

export interface ReaderAdapter {
    getContent(path: string): ReadableContent;
    emptyContent(): ReadableContent;
}