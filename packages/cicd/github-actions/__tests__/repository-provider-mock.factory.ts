import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import type { Repository, RepositoryOptionsDescriptors, RepositoryProvider } from '@ci-dokumentor/core';

type RepositoryProviderDefaults = Partial<{
    getPlatformName: string;
    getPriority: number;
    supports: boolean;
    getRepository: Repository;
    getOptions: RepositoryOptionsDescriptors<Record<string, unknown>>;
    setOptions: void;
}>;

export class RepositoryProviderMockFactory {
    static create(defaults?: RepositoryProviderDefaults): Mocked<RepositoryProvider> {
        const mock = {
            getPlatformName: vi.fn() as Mocked<RepositoryProvider['getPlatformName']>,
            getPriority: vi.fn() as Mocked<RepositoryProvider['getPriority']>,
            supports: vi.fn() as Mocked<RepositoryProvider['supports']>,
            getRepository: vi.fn() as Mocked<RepositoryProvider['getRepository']>,
            getOptions: vi.fn() as Mocked<RepositoryProvider['getOptions']>,
            setOptions: vi.fn() as Mocked<RepositoryProvider['setOptions']>,
        } as Mocked<RepositoryProvider>;

        if (defaults?.getPlatformName !== undefined) {
            mock.getPlatformName.mockReturnValue(defaults.getPlatformName);
        }
        if (defaults?.getPriority !== undefined) {
            mock.getPriority.mockReturnValue(defaults.getPriority);
        }
        if (defaults?.supports !== undefined) {
            mock.supports.mockResolvedValue(defaults.supports as boolean);
        }
        if (defaults?.getRepository !== undefined) {
            mock.getRepository.mockResolvedValue(defaults.getRepository as Repository);
        }
        if (defaults?.getOptions !== undefined) {
            mock.getOptions.mockReturnValue(defaults.getOptions as RepositoryOptionsDescriptors<Record<string, unknown>>);
        }
        if (defaults?.setOptions !== undefined) {
            mock.setOptions.mockReturnValue(defaults.setOptions as void);
        }

        return mock;
    }
}
