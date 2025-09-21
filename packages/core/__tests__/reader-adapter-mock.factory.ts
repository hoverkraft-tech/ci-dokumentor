import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { ReaderAdapter } from '../src/reader/reader.adapter.js';

export interface ReaderAdapterDefaults {
    getContent: Awaited<ReturnType<ReaderAdapter['readResource']>>
    resourceExists: ReturnType<ReaderAdapter['resourceExists']>
    containerExists: ReturnType<ReaderAdapter['containerExists']>
    readContainer: Awaited<ReturnType<ReaderAdapter['readContainer']>>
}

export class ReaderAdapterMockFactory {
    static create(defaults?: Partial<ReaderAdapterDefaults>): Mocked<ReaderAdapter> {
        const mock = {
            readResource: vi.fn() as Mocked<ReaderAdapter['readResource']>,
            resourceExists: vi.fn() as Mocked<ReaderAdapter['resourceExists']>,
            containerExists: vi.fn() as Mocked<ReaderAdapter['containerExists']>,
            readContainer: vi.fn().mockResolvedValue([]) as Mocked<ReaderAdapter['readContainer']>,
        } as Mocked<ReaderAdapter>;

        if (defaults?.getContent !== undefined) {
            mock.readResource.mockResolvedValue(defaults.getContent);
        }
        if (defaults?.resourceExists !== undefined) {
            mock.resourceExists.mockReturnValue(defaults.resourceExists);
        }
        if (defaults?.containerExists !== undefined) {
            mock.containerExists.mockReturnValue(defaults.containerExists);
        }
        if (defaults?.readContainer !== undefined) {
            mock.readContainer.mockResolvedValue(defaults.readContainer as unknown as Awaited<ReturnType<ReaderAdapter['readContainer']>>);
        }

        return mock;
    }
}