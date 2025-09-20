import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { ReaderAdapter } from '../src/reader/reader.adapter.js';

export interface ReaderAdapterDefaults {
    getContent: Awaited<ReturnType<ReaderAdapter['getContent']>>
}

export class ReaderAdapterMockFactory {
    static create(defaults?: Partial<ReaderAdapterDefaults>): Mocked<ReaderAdapter> {
        const mock = {
            getContent: vi.fn() as Mocked<ReaderAdapter['getContent']>,
        } as Mocked<ReaderAdapter>;

        if (defaults?.getContent !== undefined) {
            mock.getContent.mockResolvedValue(defaults.getContent);
        }

        return mock;
    }
}