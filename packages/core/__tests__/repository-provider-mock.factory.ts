import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { RepositoryOptions, RepositoryProvider } from '../src/repository/repository.provider.js';

type RepositoryProviderDefaults<Options extends RepositoryOptions> = Partial<{
    getPlatformName: ReturnType<RepositoryProvider<Options>['getPlatformName']>;
    getPriority: ReturnType<RepositoryProvider<Options>['getPriority']>;
    supports: Awaited<ReturnType<RepositoryProvider<Options>['supports']>>;
    getRepository: Awaited<ReturnType<RepositoryProvider<Options>['getRepository']>>;
    getOptions: ReturnType<RepositoryProvider<Options>['getOptions']>;
    setOptions: ReturnType<RepositoryProvider<Options>['setOptions']>;
}>;

export class RepositoryProviderMockFactory {
    static create<Options extends RepositoryOptions = RepositoryOptions>(defaults?: RepositoryProviderDefaults<Options>): Mocked<RepositoryProvider<Options>> {
        const mock = {
            getPlatformName: vi.fn() as Mocked<RepositoryProvider<Options>['getPlatformName']>,
            getPriority: vi.fn() as Mocked<RepositoryProvider<Options>['getPriority']>,
            supports: vi.fn() as Mocked<RepositoryProvider<Options>['supports']>,
            getRepository: vi.fn() as Mocked<RepositoryProvider<Options>['getRepository']>,
            getOptions: vi.fn() as Mocked<RepositoryProvider<Options>['getOptions']>,
            setOptions: vi.fn() as Mocked<RepositoryProvider<Options>['setOptions']>,
        } as Mocked<RepositoryProvider<Options>>;

        if (defaults?.getPlatformName !== undefined) {
            mock.getPlatformName.mockReturnValue(defaults.getPlatformName);
        }
        if (defaults?.getPriority !== undefined) {
            mock.getPriority.mockReturnValue(defaults.getPriority);
        }
        if (defaults?.supports !== undefined) {
            mock.supports.mockResolvedValue(defaults.supports);
        }
        if (defaults?.getRepository !== undefined) {
            mock.getRepository.mockResolvedValue(defaults.getRepository);
        }
        if (defaults?.getOptions !== undefined) {
            mock.getOptions.mockReturnValue(defaults.getOptions);
        }
        if (defaults?.setOptions !== undefined) {
            mock.setOptions.mockReturnValue(defaults.setOptions);
        }

        return mock;
    }
}
