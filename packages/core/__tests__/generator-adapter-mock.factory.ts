import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { GeneratorAdapter } from '../src/generator/generator.adapter.js';

type GeneratorAdapterDefaults = Partial<{
    getPlatformName: ReturnType<GeneratorAdapter['getPlatformName']>;
    getSupportedSections: ReturnType<GeneratorAdapter['getSupportedSections']>;
    supportsSource: ReturnType<GeneratorAdapter['supportsSource']>;
    getDocumentationPath: ReturnType<GeneratorAdapter['getDocumentationPath']>;
    generateDocumentation: Awaited<ReturnType<GeneratorAdapter['generateDocumentation']>>;
}>;

export class GeneratorAdapterMockFactory {
    static create(defaults?: GeneratorAdapterDefaults): Mocked<GeneratorAdapter> {
        const mock = {
            getPlatformName: vi.fn() as Mocked<GeneratorAdapter['getPlatformName']>,
            getSupportedSections: vi.fn() as Mocked<GeneratorAdapter['getSupportedSections']>,
            supportsSource: vi.fn() as Mocked<GeneratorAdapter['supportsSource']>,
            getDocumentationPath: vi.fn() as Mocked<GeneratorAdapter['getDocumentationPath']>,
            generateDocumentation: vi.fn() as Mocked<GeneratorAdapter['generateDocumentation']>,
        } as Mocked<GeneratorAdapter>;

        if (defaults?.getPlatformName !== undefined) {
            mock.getPlatformName.mockReturnValue(defaults.getPlatformName);
        }
        if (defaults?.getSupportedSections !== undefined) {
            mock.getSupportedSections.mockReturnValue(defaults.getSupportedSections);
        }
        if (defaults?.supportsSource !== undefined) {
            mock.supportsSource.mockReturnValue(defaults.supportsSource);
        }
        if (defaults?.getDocumentationPath !== undefined) {
            mock.getDocumentationPath.mockReturnValue(defaults.getDocumentationPath);
        }
        if (defaults?.generateDocumentation !== undefined) {
            mock.generateDocumentation.mockResolvedValue(defaults.generateDocumentation);
        }

        return mock;
    }
}
