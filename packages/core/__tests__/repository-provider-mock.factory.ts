import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { RepositoryOptions, RepositoryProvider } from '../src/repository/repository.provider.js';

type RepositoryProviderDefaults<Options extends RepositoryOptions> = Partial<{
    getPlatformName: ReturnType<RepositoryProvider<Options>['getPlatformName']>;
    getPriority: ReturnType<RepositoryProvider<Options>['getPriority']>;
    supports: Awaited<ReturnType<RepositoryProvider<Options>['supports']>>;
    getRepositoryInfo: Awaited<ReturnType<RepositoryProvider<Options>['getRepositoryInfo']>>;
    getLogo: Awaited<ReturnType<RepositoryProvider<Options>['getLogo']>>;
    getLicense: Awaited<ReturnType<RepositoryProvider<Options>['getLicense']>>;
    getContributing: Awaited<ReturnType<RepositoryProvider<Options>['getContributing']>>;
    getLatestVersion: Awaited<ReturnType<RepositoryProvider<Options>['getLatestVersion']>>;
    getOptions: ReturnType<RepositoryProvider<Options>['getOptions']>;
    setOptions: ReturnType<RepositoryProvider<Options>['setOptions']>;
}>;

export class RepositoryProviderMockFactory {
    static create<Options extends RepositoryOptions = RepositoryOptions>(defaults?: RepositoryProviderDefaults<Options>): Mocked<RepositoryProvider<Options>> {
        const mock = {
            getPlatformName: vi.fn() as Mocked<RepositoryProvider<Options>['getPlatformName']>,
            getPriority: vi.fn() as Mocked<RepositoryProvider<Options>['getPriority']>,
            supports: vi.fn() as Mocked<RepositoryProvider<Options>['supports']>,
            getRepositoryInfo: vi.fn() as Mocked<RepositoryProvider<Options>['getRepositoryInfo']>,
            getLogo: vi.fn() as Mocked<RepositoryProvider<Options>['getLogo']>,
            getLicense: vi.fn() as Mocked<RepositoryProvider<Options>['getLicense']>,
            getContributing: vi.fn() as Mocked<RepositoryProvider<Options>['getContributing']>,
            getLatestVersion: vi.fn() as Mocked<RepositoryProvider<Options>['getLatestVersion']>,
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
        if (defaults?.getRepositoryInfo !== undefined) {
            mock.getRepositoryInfo.mockResolvedValue(defaults.getRepositoryInfo);
        }
        if (defaults?.getLogo !== undefined) {
            mock.getLogo.mockResolvedValue(defaults.getLogo);
        }
        if (defaults?.getLicense !== undefined) {
            mock.getLicense.mockResolvedValue(defaults.getLicense);
        }
        if (defaults?.getContributing !== undefined) {
            mock.getContributing.mockResolvedValue(defaults.getContributing);
        }
        if (defaults?.getLatestVersion !== undefined) {
            mock.getLatestVersion.mockResolvedValue(defaults.getLatestVersion);
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
