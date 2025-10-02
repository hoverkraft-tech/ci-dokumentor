import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { ReaderAdapter } from '../src/reader/reader.adapter.js';

export interface ReaderAdapterDefaults {
    getContent: Awaited<ReturnType<ReaderAdapter['readResource']>>
    resourceExists: ReturnType<ReaderAdapter['resourceExists']>
    containerExists: ReturnType<ReaderAdapter['containerExists']>
    readContainer: Awaited<ReturnType<ReaderAdapter['readContainer']>>
    findResources: Awaited<ReturnType<ReaderAdapter['findResources']>>
}

export class ReaderAdapterMockFactory {
    static create(defaults?: Partial<ReaderAdapterDefaults>): Mocked<ReaderAdapter> {
        const mock = {
            readResource: vi.fn() as Mocked<ReaderAdapter['readResource']>,
            resourceExists: vi.fn() as Mocked<ReaderAdapter['resourceExists']>,
            containerExists: vi.fn() as Mocked<ReaderAdapter['containerExists']>,
            readContainer: vi.fn().mockResolvedValue([]) as Mocked<ReaderAdapter['readContainer']>,
            findResources: vi.fn() as Mocked<ReaderAdapter['findResources']>,
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
        if (defaults?.findResources !== undefined) {
            mock.findResources.mockResolvedValue(defaults.findResources);
        } else {
            // Default behavior: return the pattern as a single-element array (like a single file match)
            mock.findResources.mockImplementation(async (pattern: string) => [pattern]);
        }

        return mock;
    }
}