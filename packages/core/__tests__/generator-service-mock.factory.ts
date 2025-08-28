import { GeneratorService } from "../src/generator/generator.service.js";
import type { Mocked } from "vitest";

type GeneratorServiceDefaults = Partial<{
    getSupportedCicdPlatforms: ReturnType<GeneratorService['getSupportedCicdPlatforms']>;
    autoDetectCicdAdapter: ReturnType<GeneratorService['autoDetectCicdAdapter']>;
    autoDetectCicdPlatform: ReturnType<GeneratorService['autoDetectCicdPlatform']>;
    getGeneratorAdapterByPlatform: ReturnType<GeneratorService['getGeneratorAdapterByPlatform']>;
    generateDocumentationForPlatform: Awaited<ReturnType<GeneratorService['generateDocumentationForPlatform']>>;
}>;

export class GeneratorServiceMockFactory {
    static create(defaults?: GeneratorServiceDefaults): Mocked<GeneratorService> {
        const mock = {
            getSupportedCicdPlatforms: vi.fn() as Mocked<GeneratorService['getSupportedCicdPlatforms']>,
            autoDetectCicdAdapter: vi.fn() as Mocked<GeneratorService['autoDetectCicdAdapter']>,
            autoDetectCicdPlatform: vi.fn() as Mocked<GeneratorService['autoDetectCicdPlatform']>,
            getGeneratorAdapterByPlatform: vi.fn() as Mocked<GeneratorService['getGeneratorAdapterByPlatform']>,
            generateDocumentationForPlatform: vi.fn() as Mocked<GeneratorService['generateDocumentationForPlatform']>,
        } as Mocked<GeneratorService>;

        if (defaults?.getSupportedCicdPlatforms !== undefined) {
            mock.getSupportedCicdPlatforms.mockReturnValue(defaults.getSupportedCicdPlatforms);
        }
        if (defaults?.autoDetectCicdAdapter !== undefined) {
            mock.autoDetectCicdAdapter.mockReturnValue(defaults.autoDetectCicdAdapter);
        }
        if (defaults?.autoDetectCicdPlatform !== undefined) {
            mock.autoDetectCicdPlatform.mockReturnValue(defaults.autoDetectCicdPlatform);
        }
        if (defaults?.getGeneratorAdapterByPlatform !== undefined) {
            mock.getGeneratorAdapterByPlatform.mockReturnValue(defaults.getGeneratorAdapterByPlatform);
        }
        if (defaults?.generateDocumentationForPlatform !== undefined) {
            mock.generateDocumentationForPlatform.mockResolvedValue(defaults.generateDocumentationForPlatform);
        }

        return mock;
    }
}
