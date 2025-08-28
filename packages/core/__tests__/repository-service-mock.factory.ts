import { RepositoryService } from "../src/repository/repository.service.js";
import type { Mocked } from "vitest";

type RepositoryServiceDefaults = Partial<{
    autoDetectRepositoryProvider: Awaited<ReturnType<RepositoryService['autoDetectRepositoryProvider']>>;
    getRepository: Awaited<ReturnType<RepositoryService['getRepository']>>;
    getRepositoryProviderByPlatform: ReturnType<RepositoryService['getRepositoryProviderByPlatform']>;
    getSupportedRepositoryPlatforms: ReturnType<RepositoryService['getSupportedRepositoryPlatforms']>;
}>;

export class RepositoryServiceMockFactory {
    static create(defaults?: RepositoryServiceDefaults): Mocked<RepositoryService> {
        const mock = {
            autoDetectRepositoryProvider: vi.fn() as Mocked<RepositoryService['autoDetectRepositoryProvider']>,
            getRepository: vi.fn() as Mocked<RepositoryService['getRepository']>,
            getRepositoryProviderByPlatform: vi.fn() as Mocked<RepositoryService['getRepositoryProviderByPlatform']>,
            getSupportedRepositoryPlatforms: vi.fn() as Mocked<RepositoryService['getSupportedRepositoryPlatforms']>,
        } as Mocked<RepositoryService>;

        if (defaults?.autoDetectRepositoryProvider !== undefined) {
            mock.autoDetectRepositoryProvider.mockResolvedValue(defaults.autoDetectRepositoryProvider);
        }
        if (defaults?.getRepository !== undefined) {
            mock.getRepository.mockResolvedValue(defaults.getRepository);
        }
        if (defaults?.getRepositoryProviderByPlatform !== undefined) {
            mock.getRepositoryProviderByPlatform.mockReturnValue(defaults.getRepositoryProviderByPlatform);
        }
        if (defaults?.getSupportedRepositoryPlatforms !== undefined) {
            mock.getSupportedRepositoryPlatforms.mockReturnValue(defaults.getSupportedRepositoryPlatforms);
        }

        return mock;
    }
}