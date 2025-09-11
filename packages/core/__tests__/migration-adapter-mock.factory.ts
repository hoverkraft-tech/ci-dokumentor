import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { MigrationAdapter } from '../src/migration/migration.adapter.js';

export interface MigrationAdapterDefaults {
    getName: ReturnType<MigrationAdapter['getName']>
    supportsDestination: ReturnType<MigrationAdapter['supportsDestination']>
    migrateDocumentation: Awaited<ReturnType<MigrationAdapter['migrateDocumentation']>>
}

export class MigrationAdapterMockFactory {
    static create(defaults?: Partial<MigrationAdapterDefaults>): Mocked<MigrationAdapter> {
        const mock = {
            getName: vi.fn() as Mocked<MigrationAdapter['getName']>,
            supportsDestination: vi.fn() as Mocked<MigrationAdapter['supportsDestination']>,
            migrateDocumentation: vi.fn() as Mocked<MigrationAdapter['migrateDocumentation']>,
        } as Mocked<MigrationAdapter>;

        if (defaults?.getName !== undefined) {
            mock.getName.mockReturnValue(defaults.getName);
        }
        if (defaults?.supportsDestination !== undefined) {
            mock.supportsDestination.mockReturnValue(defaults.supportsDestination);
        }
        if (defaults?.migrateDocumentation !== undefined) {
            mock.migrateDocumentation.mockResolvedValue(defaults.migrateDocumentation);
        }

        return mock;
    }
}